import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AlertService } from '../../services/alert-service';
import { AuthService } from '../../services/auht-services';

type Vista = 'lista' | 'nueva' | 'detalle';

@Component({
  selector: 'app-devoluciones',
  standalone: false,
  templateUrl: './devoluciones.html',
  styleUrl: './devoluciones.css',
})
export class Devoluciones implements OnInit {
  vista: Vista = 'lista';

  motivos = [
    { codigo: 'DEFECTUOSO', etiqueta: 'Producto defectuoso' },
    { codigo: 'NO_ERA_LO_ESPERADO', etiqueta: 'No era lo esperado' },
    { codigo: 'GARANTIA', etiqueta: 'Garantía' },
    { codigo: 'OTRO', etiqueta: 'Otro' },
  ];

  // --- Listado ---
  listaDevoluciones: any[] = [];
  filtroEstado: string = '';

  // --- Búsqueda / creación ---
  numeroFactura: string = '';
  buscandoVenta: boolean = false;
  ventaEncontrada: any = null;
  lineasDevolucion: any[] = [];
  observaciones: string = '';
  listaProductos: any[] = [];

  // --- Detalle ---
  devolucionSeleccionada: any = null;

  constructor(
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDevoluciones();
    this.cargarProductos();
  }

  cargarDevoluciones() {
    this.miscelaneaService.obtenerDevoluciones({ estado: this.filtroEstado }).subscribe({
      next: (data) => {
        this.listaDevoluciones = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar devoluciones', err)
    });
  }

  cargarProductos() {
    this.miscelaneaService.obtenerProductos().subscribe({
      next: (data) => {
        this.listaProductos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  cambiarFiltro(estado: string) {
    this.filtroEstado = estado;
    this.cargarDevoluciones();
  }

  // --- Búsqueda / creación ---

  mostrarFormularioNueva() {
    this.numeroFactura = '';
    this.ventaEncontrada = null;
    this.lineasDevolucion = [];
    this.observaciones = '';
    this.vista = 'nueva';
  }

  buscarVenta() {
    if (!this.numeroFactura.trim()) {
      this.alertService.advertencia('Ingresa un número de factura.');
      return;
    }

    this.buscandoVenta = true;
    this.miscelaneaService.buscarVentaParaDevolucion(this.numeroFactura.trim()).subscribe({
      next: (venta) => {
        this.buscandoVenta = false;
        if (venta.Estado !== 'ACTIVO') {
          this.ventaEncontrada = null;
          this.lineasDevolucion = [];
          this.alertService.advertencia('Esta factura no está activa (fue anulada), no se puede generar una devolución sobre ella.');
          return;
        }

        this.ventaEncontrada = venta;
        this.lineasDevolucion = venta.items
          .filter((item: any) => item.CantidadPendiente > 0)
          .map((item: any) => ({
            detalleVentaId: item.Id,
            productoId: item.ProductoId,
            productoNombre: item.ProductoNombre,
            cantidadPendiente: item.CantidadPendiente,
            cantidadADevolver: 0,
            motivoCodigo: '',
            reingresaStock: false,
            tipoResolucion: 'REEMBOLSO',
            productoReemplazoId: null
          }));

        if (this.lineasDevolucion.length === 0) {
          this.alertService.advertencia('Esta factura ya fue devuelta en su totalidad, no queda nada pendiente.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.buscandoVenta = false;
        this.ventaEncontrada = null;
        this.lineasDevolucion = [];
        this.alertService.error(err.error?.mensaje || 'No se encontró ninguna factura con ese número.');
      }
    });
  }

  guardarDevolucion() {
    const items = this.lineasDevolucion.filter((linea) => Number(linea.cantidadADevolver) > 0);

    if (items.length === 0) {
      this.alertService.advertencia('Indica la cantidad a devolver en al menos una línea.');
      return;
    }

    for (const linea of items) {
      if (Number(linea.cantidadADevolver) > linea.cantidadPendiente) {
        this.alertService.advertencia(`No puedes devolver más de lo pendiente para "${linea.productoNombre}" (pendiente: ${linea.cantidadPendiente}).`);
        return;
      }
      if (!linea.motivoCodigo) {
        this.alertService.advertencia(`Selecciona un motivo para "${linea.productoNombre}".`);
        return;
      }
      if (linea.tipoResolucion === 'CAMBIO' && !linea.productoReemplazoId) {
        this.alertService.advertencia(`Selecciona el producto de reemplazo para "${linea.productoNombre}".`);
        return;
      }
    }

    const payload = {
      ventaId: this.ventaEncontrada.Id,
      observaciones: this.observaciones,
      items: items.map((linea) => ({
        detalleVentaId: linea.detalleVentaId,
        productoId: linea.productoId,
        cantidad: Number(linea.cantidadADevolver),
        motivoCodigo: linea.motivoCodigo,
        reingresaStock: linea.reingresaStock,
        tipoResolucion: linea.tipoResolucion,
        productoReemplazoId: linea.tipoResolucion === 'CAMBIO' ? linea.productoReemplazoId : null
      }))
    };

    this.miscelaneaService.registrarDevolucion(payload).subscribe({
      next: () => {
        this.alertService.exito('Devolución registrada con éxito. Queda pendiente de autorización.');
        this.vista = 'lista';
        this.cargarDevoluciones();
      },
      error: (err) => this.alertService.error('Error al registrar la devolución: ' + (err.error?.error || err.error?.mensaje || err.message))
    });
  }

  // --- Detalle ---

  verDetalle(id: number) {
    this.miscelaneaService.obtenerDevolucionPorId(id).subscribe({
      next: (data) => {
        this.devolucionSeleccionada = data;
        this.vista = 'detalle';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener el detalle de la devolución', err);
        this.alertService.error('No se pudo cargar el detalle de la devolución.');
      }
    });
  }

  volverALista() {
    this.vista = 'lista';
    this.devolucionSeleccionada = null;
    this.cargarDevoluciones();
  }

  async autorizar() {
    const confirmado = await this.alertService.confirmar(
      '¿Autorizar esta devolución? Se moverá el stock de los productos involucrados.',
      'Autorizar devolución'
    );
    if (!confirmado) return;

    this.miscelaneaService.autorizarDevolucion(this.devolucionSeleccionada.Id).subscribe({
      next: () => {
        this.alertService.exito('Devolución autorizada con éxito. Stock actualizado.');
        this.verDetalle(this.devolucionSeleccionada.Id);
      },
      error: (err) => this.alertService.error('Error al autorizar la devolución: ' + (err.error?.error || err.message))
    });
  }

  async rechazar() {
    const confirmado = await this.alertService.confirmar(
      '¿Rechazar esta devolución? No se realizará ningún movimiento de stock.',
      'Rechazar devolución'
    );
    if (!confirmado) return;

    this.miscelaneaService.rechazarDevolucion(this.devolucionSeleccionada.Id).subscribe({
      next: () => {
        this.alertService.exito('Devolución rechazada.');
        this.verDetalle(this.devolucionSeleccionada.Id);
      },
      error: (err) => this.alertService.error('Error al rechazar la devolución: ' + (err.error?.error || err.message))
    });
  }
}
