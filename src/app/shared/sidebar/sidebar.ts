import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AuthService } from '../../services/auht-services';
import { AlertService } from '../../services/alert-service';
import { LayoutService } from '../../services/layout-service';
import { EmpresaService } from '../../services/empresa-service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  cajaAbierta: boolean = false;
  turnoActual: any = null;
  mostrarPanelCierre: boolean = false;
  cerrandoCaja: boolean = false;

  // Campos del formulario de cierre (por ahora manuales)
  totalEfectivoSistema: number = 0;
  totalDigitalSistema: number = 0;
  montoFinalReal: number = 0;

  cargandoResumen: boolean = false;

  menuVisible: any[] = [];

  // --- Branding (nombre e ícono de la empresa activa, moldeables desde "Mi empresa") ---
  nombreMarca: string | null = null;
  logoUrl: string | null = null;

  constructor(
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService,
    public layout: LayoutService,
    private alertService: AlertService,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    this.empresaService.brandingActualizada$.subscribe(() => this.cargarBranding());

    if (this.modoSuperAdminSinEmpresa) return;

    this.cargarBranding();
    this.miscelaneaService.cajaAbierta$.subscribe((abierta) => {
      this.cajaAbierta = abierta;
      this.cdr.detectChanges();
    });
    this.miscelaneaService.turnoActual$.subscribe((turno) => {
      this.turnoActual = turno;
      this.cdr.detectChanges();
    });
    this.miscelaneaService.refrescarEstadoCaja();
    this.construirMenu();
  }

  private cargarBranding(): void {
    this.empresaService.obtenerActual().subscribe({
      next: (empresa) => {
        this.nombreMarca = empresa?.NombreMarca || null;
        this.logoUrl = empresa?.TieneLogo ? this.empresaService.logoUrl() : null;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  // Un superadministrador que aún no ha entrado a ninguna empresa no tiene
  // caja, turno ni menú de negocio: solo puede administrar empresas.
  get modoSuperAdminSinEmpresa(): boolean {
    return this.authService.esSuperAdmin() && !this.authService.empresaActual();
  }

    construirMenu(): void {
    this.miscelaneaService.obtenerMenu().subscribe({
      next: (items) => {
        this.menuVisible = items;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar el menú', err)
    });
  }

  // Muestra la advertencia nativa del navegador si intenta cerrar la pestaña con caja abierta
  @HostListener('window:beforeunload', ['$event'])
  avisarAntesDeSalir(event: BeforeUnloadEvent) {
    if (this.cajaAbierta) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  abrirPanelCierre() {
    this.mostrarPanelCierre = true;
    this.cargandoResumen = true;

    this.miscelaneaService.obtenerResumenTurno().subscribe({
      next: (data) => {
        this.totalEfectivoSistema = data.totalEfectivoSistema || 0;
        this.totalDigitalSistema = data.totalDigitalSistema || 0;
        this.cargandoResumen = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.alertService.error('No se pudo calcular el resumen de ventas del turno: ' + (err.error?.error || err.message));
        this.cargandoResumen = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarPanelCierre() {
    this.mostrarPanelCierre = false;
  }

  async confirmarCierreCaja() {
    if (!this.turnoActual?.Id) {
      this.alertService.advertencia('No se encontró el turno actual.');
      return;
    }

    const confirmado = await this.alertService.confirmar(
      '¿Confirmas el cierre de caja? Esta acción finalizará el turno actual.',
      'Cerrar caja'
    );
    if (!confirmado) {
      return;
    }

    const totalVentasGeneral = Number(this.totalEfectivoSistema) + Number(this.totalDigitalSistema);
    const baseInicial = Number(this.turnoActual.BaseInicial) || 0;
    const totalEsperadoEnCaja = baseInicial + Number(this.totalEfectivoSistema);
    const diferencia = Number(this.montoFinalReal) - totalEsperadoEnCaja;

    this.cerrandoCaja = true;
    this.miscelaneaService.cerrarCaja({
      turnoId: this.turnoActual.Id,
      totalEfectivoSistema: this.totalEfectivoSistema,
      totalDigitalSistema: this.totalDigitalSistema,
      totalVentasGeneral,
      montoFinalReal: this.montoFinalReal,
      diferencia
    }).subscribe({
      next: () => {
        this.cerrandoCaja = false;
        this.mostrarPanelCierre = false;
        this.alertService.exito(`Caja cerrada correctamente. Diferencia: $${diferencia.toLocaleString()}`);
        this.miscelaneaService.refrescarEstadoCaja();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cerrandoCaja = false;
        this.alertService.error('Error al cerrar la caja: ' + (err.error?.error || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  // Bloquea el logout si la caja sigue abierta
  async intentarCerrarSesion() {
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
