import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlataformaService {
  private apiUrl = environment.apiUrl + '/plataforma';

  constructor(private http: HttpClient) {}

  // Pública: la usa la pantalla de login antes de autenticarse.
  obtenerBranding(): Observable<{ nombrePlataforma: string | null; tieneImagenLogin: boolean }> {
    return this.http.get<any>(`${this.apiUrl}/branding`);
  }

  imagenLoginUrl(): string {
    return `${this.apiUrl}/imagen-login`;
  }

  // --- Solo superadministrador ---
  actualizarBranding(nombrePlataforma: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/branding`, { nombrePlataforma });
  }

  subirImagenLogin(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', archivo);
    return this.http.post<any>(`${this.apiUrl}/imagen-login`, formData);
  }

  eliminarImagenLogin(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/imagen-login`);
  }
}
