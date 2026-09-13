import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auht-services';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private apiUrl = environment.apiUrl + '/empresas';

  // Avisa al sidebar/header que el branding (nombre o logo) de la empresa activa
  // cambió, para que se refresquen sin necesidad de recargar la página.
  brandingActualizada$ = new Subject<void>();

  constructor(private http: HttpClient, private authService: AuthService) {}

  // --- Autoservicio: datos de la empresa activa (admin de esa empresa) ---
  obtenerActual(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/actual`);
  }

  actualizarActual(datos: { nombreComercial: string; nit: string; direccion: string; telefono: string; nombreMarca: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/actual`, datos);
  }

  // El <img>/<link> del navegador no puede mandar el header Authorization,
  // así que el token va como query param (el backend ya lo acepta así).
  logoUrl(): string {
    const token = this.authService.obtenerToken();
    return `${this.apiUrl}/actual/logo?token=${encodeURIComponent(token || '')}`;
  }

  subirLogo(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', archivo);
    return this.http.post<any>(`${this.apiUrl}/actual/logo`, formData);
  }

  eliminarLogo(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/actual/logo`);
  }

  notificarBrandingActualizada(): void {
    this.brandingActualizada$.next();
  }

  // --- Administración global (superadministrador) ---
  listarTodas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  crear(datos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, datos);
  }

  actualizar(id: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, datos);
  }

  asignarUsuario(id: number, identificador: string, rolId?: number | null): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/asignar-usuario`, { identificador, rolId });
  }
}
