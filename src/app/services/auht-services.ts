import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(usuario: string, contrasena: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { usuario, contrasena }).pipe(
      tap((res) => this.guardarSesionSiVieneToken(res))
    );
  }

  // Segundo paso cuando el usuario pertenece a varias empresas: elige una con el pre-token.
  seleccionarEmpresa(preToken: string, empresaId: number | null, modoSuperAdmin: boolean = false): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/seleccionar-empresa`,
        { empresaId, modoSuperAdmin },
        { headers: { Authorization: `Bearer ${preToken}` } }
      )
      .pipe(tap((res) => this.guardarSesionSiVieneToken(res)));
  }

  // Cambiar de empresa ya logueado, sin pedir contraseña de nuevo.
  cambiarEmpresa(empresaId: number | null, modoSuperAdmin: boolean = false): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/cambiar-empresa`, { empresaId, modoSuperAdmin })
      .pipe(tap((res) => this.guardarSesionSiVieneToken(res)));
  }

  misEmpresas(): Observable<{ empresas: any[]; esSuperAdmin: boolean }> {
    return this.http.get<any>(`${this.apiUrl}/mis-empresas`);
  }

  private guardarSesionSiVieneToken(res: any): void {
    if (res?.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
    }
  }

  registrarUsuario(datos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registrar`, datos);
  }

  listarUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`);
  }

  listarRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/roles`);
  }

  actualizarUsuario(id: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/usuarios/${id}`, datos);
  }

  forzarLogoutUsuario(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/usuarios/${id}/forzar-logout`, {});
  }

  // --- Roles y permisos (solo administradores) ---
  listarRolesDetalle(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/roles/detalle`);
  }

  listarPermisos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/permisos`);
  }

  permisosDeRol(rolId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/roles/${rolId}/permisos`);
  }

  crearRol(datos: { nombre: string; permisoIds: number[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/roles`, datos);
  }

  actualizarRol(id: number, datos: { nombre: string; permisoIds: number[] }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/roles/${id}`, datos);
  }

  eliminarRol(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/roles/${id}`);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/auth/login']);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  obtenerUsuario(): any {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  esAdmin(): boolean {
    return this.obtenerUsuario()?.esAdmin === true;
  }

  esSuperAdmin(): boolean {
    return this.obtenerUsuario()?.esSuperAdmin === true;
  }

  empresaActual(): { id: number; nombre: string } | null {
    const u = this.obtenerUsuario();
    return u?.empresaId ? { id: u.empresaId, nombre: u.empresaNombre } : null;
  }

  // Los administradores siempre tienen acceso; los demás según su lista de permisos
  tienePermiso(codigo: string): boolean {
    const usuario = this.obtenerUsuario();
    if (!usuario) return false;
    if (usuario.esAdmin) return true;
    return (usuario.permisos || []).includes(codigo);
  }
}