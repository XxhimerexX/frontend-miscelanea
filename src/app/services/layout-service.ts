import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'mp-sidebar-collapsed';

/**
 * Estado del shell: sidebar minimizado (desktop) y sidebar abierto (móvil).
 * Reemplaza el toggle que antes hacía custom.js / sidebarmenu.js con jQuery.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly sidebarColapsada = signal<boolean>(this.leerColapsada());
  readonly sidebarMovilAbierta = signal<boolean>(false);

  alternarColapsada(): void {
    const nuevo = !this.sidebarColapsada();
    this.sidebarColapsada.set(nuevo);
    try {
      localStorage.setItem(STORAGE_KEY, String(nuevo));
    } catch {
      /* ignora */
    }
  }

  alternarMovil(): void {
    this.sidebarMovilAbierta.set(!this.sidebarMovilAbierta());
  }

  cerrarMovil(): void {
    this.sidebarMovilAbierta.set(false);
  }

  private leerColapsada(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
