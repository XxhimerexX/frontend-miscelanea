import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auht-services';
import { AlertService } from '../../services/alert-service';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { ThemeService } from '../../services/theme-service';
import { LayoutService } from '../../services/layout-service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  cajaAbierta: boolean = false;
  misEmpresasLista: any[] = [];

  constructor(
    public authService: AuthService,
    public theme: ThemeService,
    public layout: LayoutService,
    private alertService: AlertService,
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.miscelaneaService.cajaAbierta$.subscribe((abierta) => {
      this.cajaAbierta = abierta;
      this.cdr.detectChanges();
    });
    this.cargarMisEmpresas();
  }

  cargarMisEmpresas() {
    this.authService.misEmpresas().subscribe({
      next: (res) => {
        this.misEmpresasLista = res.empresas || [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  // El selector solo tiene sentido si hay más de una empresa a la mano,
  // o si el usuario puede entrar en modo superadministrador.
  get mostrarSelectorEmpresa(): boolean {
    return this.misEmpresasLista.length > 1 || this.authService.esSuperAdmin();
  }

  get nombreEmpresaActual(): string {
    return this.authService.empresaActual()?.nombre || 'Modo superadministrador';
  }

  esEmpresaActual(empresaId: number): boolean {
    return this.authService.empresaActual()?.id === empresaId;
  }

  cambiarAEmpresa(empresaId: number) {
    if (this.esEmpresaActual(empresaId)) return;
    if (this.cajaAbierta) {
      this.alertService.advertencia('No puedes cambiar de empresa mientras la caja esté abierta. Cierra el turno primero.');
      return;
    }
    this.authService.cambiarEmpresa(empresaId).subscribe({
      next: () => (window.location.href = '/dashboard'),
      error: (err) => this.alertService.error('No se pudo cambiar de empresa: ' + (err.error?.error || err.message)),
    });
  }

  cambiarAModoSuperAdmin() {
    if (!this.authService.empresaActual()) return;
    if (this.cajaAbierta) {
      this.alertService.advertencia('No puedes cambiar de modo mientras la caja esté abierta. Cierra el turno primero.');
      return;
    }
    this.authService.cambiarEmpresa(null, true).subscribe({
      next: () => (window.location.href = '/empresas'),
      error: (err) => this.alertService.error('No se pudo entrar en modo superadministrador: ' + (err.error?.error || err.message)),
    });
  }

  // Bloquea el logout si la caja sigue abierta (misma regla que el sidebar)
  async cerrarSesion() {
    if (this.cajaAbierta) {
      this.alertService.advertencia('No puedes cerrar sesión mientras la caja esté abierta. Debes cerrar el turno primero.');
      return;
    }

    const confirmado = await this.alertService.confirmar('¿Deseas cerrar tu sesión?', 'Cerrar sesión');
    if (confirmado) {
      this.authService.logout();
    }
  }
}
