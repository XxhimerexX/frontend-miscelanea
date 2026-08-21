import { AfterViewInit, ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AuthService } from '../../services/auht-services';
import { AlertService } from '../../services/alert-service';

declare var $: any;

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements AfterViewInit {
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

  constructor(
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
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

    construirMenu(): void {
    this.miscelaneaService.obtenerMenu().subscribe({
      next: (items) => {
        this.menuVisible = items;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar el menú', err)
    });
  }

  // El plugin jQuery que despliega el submenú (AdminMenu, en sidebarmenu.js) se ejecuta
  // normalmente una sola vez en el "document ready" global (custom.js). Como el sidebar
  // se crea recién después del login (sin recargar la página), ese init global ya pasó
  // y nunca engancha los elementos de este componente. Por eso se reinicializa aquí,
  // cada vez que el DOM del sidebar realmente existe.
  ngAfterViewInit(): void {
    $('#sidebarnav').AdminMenu();
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
