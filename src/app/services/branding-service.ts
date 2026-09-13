import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './auht-services';
import { EmpresaService } from './empresa-service';
import { PlataformaService } from './plataforma-service';

const NOMBRE_POR_DEFECTO = 'Miscelánea POS';
const FAVICON_POR_DEFECTO = 'assets/images/favicon.png';

@Injectable({ providedIn: 'root' })
export class BrandingService {
  constructor(
    private titleService: Title,
    private authService: AuthService,
    private empresaService: EmpresaService,
    private plataformaService: PlataformaService
  ) {}

  // Se llama al entrar al layout autenticado y cada vez que se guarda un
  // cambio de branding, para que el sidebar/pestaña se actualicen sin recargar.
  aplicar(): void {
    const empresaActiva = this.authService.empresaActual();

    // Nombre de marca de la empresa (autoservicio) > nombre de la plataforma
    // (superadmin) > nombre por defecto. Así la app se puede "vestir" completa
    // sin tocar código, para cualquier empresa que la use.
    this.plataformaService.obtenerBranding().subscribe({
      next: (plataforma) => {
        const nombrePlataforma = plataforma?.nombrePlataforma || NOMBRE_POR_DEFECTO;
        if (!empresaActiva) {
          this.titleService.setTitle(nombrePlataforma);
          this.aplicarFavicon(FAVICON_POR_DEFECTO);
          return;
        }

        this.empresaService.obtenerActual().subscribe({
          next: (empresa) => {
            this.titleService.setTitle(empresa?.NombreMarca || nombrePlataforma);
            this.aplicarFavicon(empresa?.TieneLogo ? this.empresaService.logoUrl() : FAVICON_POR_DEFECTO);
          },
          error: () => {
            this.titleService.setTitle(nombrePlataforma);
            this.aplicarFavicon(FAVICON_POR_DEFECTO);
          },
        });
      },
      error: () => {
        this.titleService.setTitle(empresaActiva ? NOMBRE_POR_DEFECTO : NOMBRE_POR_DEFECTO);
        this.aplicarFavicon(FAVICON_POR_DEFECTO);
      },
    });
  }

  private aplicarFavicon(href: string): void {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }
}
