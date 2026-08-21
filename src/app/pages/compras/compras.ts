import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AlertService } from '../../services/alert-service';
import { AuthService } from '../../services/auht-services';

type Vista = 'lista' | 'crear' | 'detalle';

@Component({
  selector: 'app-compras',
  standalone: false,
  templateUrl: './compras.html',
  styleUrl: './compras.css',
})
export class Compras implements OnInit {
  vista: Vista = 'lista';

  // --- Listado ---
  listaOrdenes: any[] = [];
  filtroEstado: string = '';

  // --- Catálogos de apoyo ---
  listaProveedores: any[] = [];
  listaProductos: any[] = [];
  listaProductosFiltrada: any[] = [];
  proveedorSinProductosAsignados: boolean = false;

  // --- Formulario de creación (carrito de compra) ---
  nuevaOrden: any = this.ordenVacia();
  itemActual: any = this.itemVacio();

  // --- Detalle / recepción ---
  ordenSeleccionada: any = null;
  lineasRecepcion: any[] = [];
  observacionesRecepcion: string = '';

  constructor(
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarOrdenes();
    this.cargarProveedores();
    this.cargarProductos();
  }

  ordenVacia() {
    return { proveedorId: null, fechaEsperada: '', observaciones: '', items: [] as any[] };
  }

  itemVacio() {
    return { productoId: null, cantidadPedida: 1, costoUnitario: 0, descuentoPorcentaje: 0, observacion: '' };
  }

  // --- Carga de datos ---

  cargarOrdenes() {
    this.miscelaneaService.obtenerOrdenesCompra(this.filtroEstado).subscribe({
      next: (data) => {
        this.listaOrdenes = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar las órdenes de compra', err)
    });
  }

  cargarProveedores() {
    this.miscelaneaService.obtenerProveedores(true).subscribe({
      next: (data) => {
        this.listaProveedores = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar proveedores', err)
    });
  }

  cargarProductos() {
    this.miscelaneaService.obtenerProductos().subscribe({
      next: (data) => {
        this.listaProductos = data;
        this.listaProductosFiltrada = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  // Cuando cambia el proveedor seleccionado, filtra el catálogo a solo los
  // productos que ese proveedor vende. Si el proveedor no tiene productos
  // asignados todavía, muestra el catálogo completo (para no bloquear el flujo).
  onProveedorSeleccionado() {
    if (!this.nuevaOrden.proveedorId) {
      this.listaProductosFiltrada = this.listaProductos;
      this.proveedorSinProductosAsignados = false;
      return;
    }

    this.miscelaneaService.obtenerProductosDeProveedor(this.nuevaOrden.proveedorId).subscribe({
      next: (productosDelProveedor) => {
        if (productosDelProveedor.length === 0) {
          this.listaProductosFiltrada = this.listaProductos;
          this.proveedorSinProductosAsignados = true;
        } else {
          const idsProveedor = new Set(productosDelProveedor.map((p: any) => p.Id));
          this.listaProductosFiltrada = this.listaProductos.filter((p: any) => idsProveedor.has(p.Id));
          this.proveedorSinProductosAsignados = false;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al filtrar productos por proveedor', err);
        this.listaProductosFiltrada = this.listaProductos;
      }
    });
  }

  cambiarFiltro(estado: string) {
    this.filtroEstado = estado;
    this.cargarOrdenes();
  }

  // --- Vista: crear orden ---

  mostrarFormularioCrear() {
    this.nuevaOrden = this.ordenVacia();
    this.itemActual = this.itemVacio();
    this.vista = 'crear';
  }

  // Subtotal en vivo del ítem que se está armando, ya con el descuento aplicado.
  subtotalItemActual(): number {
    const cantidad = Number(this.itemActual.cantidadPedida) || 0;
    const costo = Number(this.itemActual.costoUnitario) || 0;
    const descuento = Number(this.itemActual.descuentoPorcentaje) || 0;
    return Math.round(cantidad * costo * (1 - descuento / 100) * 100) / 100;
  }

  agregarItemOrden() {
    const producto = this.listaProductos.find((p) => p.Id === Number(this.itemActual.productoId));
    if (!producto) {
      this.alertService.advertencia('Selecciona un producto.');
      return;
    }
    const cantidad = Number(this.itemActual.cantidadPedida);
    const costo = Number(this.itemActual.costoUnitario);
    const descuento = Number(this.itemActual.descuentoPorcentaje) || 0;

    if (!cantidad || cantidad <= 0) {
      this.alertService.advertencia('La cantidad pedida debe ser mayor a cero.');
      return;
    }
    if (isNaN(costo) || costo < 0) {
      this.alertService.advertencia('El costo unitario no puede ser negativo.');
      return;
    }
    if (isNaN(descuento) || descuento < 0 || descuento > 100) {
      this.alertService.advertencia('El descuento debe estar entre 0 y 100%.');
      return;
    }

    this.nuevaOrden.items.push({
      productoId: producto.Id,
      productoNombre: producto.Nombre,
      cantidadPedida: cantidad,
      costoUnitario: costo,
      descuentoPorcentaje: descuento,
      observacion: (this.itemActual.observacion || '').trim()
    });

    this.itemActual = this.itemVacio();
  }

  eliminarItemOrden(index: number) {
    this.nuevaOrden.items.splice(index, 1);
  }

  subtotalItem(item: any): number {
    return Math.round(item.cantidadPedida * item.costoUnitario * (1 - (item.descuentoPorcentaje || 0) / 100) * 100) / 100;
  }

  totalNuevaOrden(): number {
    return this.nuevaOrden.items.reduce((acc: number, item: any) => acc + this.subtotalItem(item), 0);
  }

  guardarOrden() {
    if (!this.nuevaOrden.proveedorId) {
      this.alertService.advertencia('Selecciona un proveedor.');
      return;
    }
    if (this.nuevaOrden.items.length === 0) {
      this.alertService.advertencia('Agrega al menos un producto a la orden.');
      return;
    }

    this.miscelaneaService.registrarOrdenCompra(this.nuevaOrden).subscribe({
      next: () => {
        this.alertService.exito('¡Orden de compra registrada con éxito!');
        this.vista = 'lista';
        this.cargarOrdenes();
      },
      error: (err) => this.alertService.error('Error al registrar la orden: ' + (err.error?.error || err.error?.mensaje || err.message))
    });
  }

  // --- Vista: detalle / recepción ---

  verDetalleOrden(id: number) {
    this.miscelaneaService.obtenerOrdenCompraPorId(id).subscribe({
      next: (data) => {
        this.ordenSeleccionada = data;
        this.observacionesRecepcion = '';
        this.lineasRecepcion = data.items.map((item: any) => ({
          detalleOrdenCompraId: item.Id,
          productoNombre: item.ProductoNombre,
          cantidadPedida: item.CantidadPedida,
          cantidadRecibida: item.CantidadRecibida,
          pendiente: item.CantidadPedida - item.CantidadRecibida,
          costoUnitario: item.CostoUnitario,
          cantidadARecibir: 0
        }));
        this.vista = 'detalle';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener el detalle de la orden', err);
        this.alertService.error('No se pudo cargar el detalle de la orden.');
      }
    });
  }

  volverALista() {
    this.vista = 'lista';
    this.ordenSeleccionada = null;
    this.cargarOrdenes();
  }

  esOrdenReceptable(): boolean {
    return this.ordenSeleccionada && ['PENDIENTE', 'RECIBIDA_PARCIAL'].includes(this.ordenSeleccionada.Estado);
  }

  registrarRecepcion() {
    const items = this.lineasRecepcion
      .filter((linea) => Number(linea.cantidadARecibir) > 0)
      .map((linea) => ({
        detalleOrdenCompraId: linea.detalleOrdenCompraId,
        cantidadRecibida: Number(linea.cantidadARecibir),
        costoUnitario: Number(linea.costoUnitario)
      }));

    if (items.length === 0) {
      this.alertService.advertencia('Indica la cantidad recibida en al menos una línea.');
      return;
    }

    const excedida = this.lineasRecepcion.find((linea) => Number(linea.cantidadARecibir) > linea.pendiente);
    if (excedida) {
      this.alertService.advertencia(`No puedes recibir más de lo pendiente para "${excedida.productoNombre}" (pendiente: ${excedida.pendiente}).`);
      return;
    }

    this.miscelaneaService.recibirOrdenCompra(this.ordenSeleccionada.Id, {
      observaciones: this.observacionesRecepcion,
      items
    }).subscribe({
      next: () => {
        this.alertService.exito('¡Recepción registrada con éxito! Stock y costo del producto actualizados.');
        this.verDetalleOrden(this.ordenSeleccionada.Id);
      },
      error: (err) => this.alertService.error('Error al registrar la recepción: ' + (err.error?.error || err.error?.mensaje || err.message))
    });
  }

  async cancelarOrdenActual() {
    const confirmado = await this.alertService.confirmar(
      '¿Estás seguro de que deseas cancelar esta orden de compra?',
      'Cancelar orden'
    );
    if (!confirmado) return;

    this.miscelaneaService.cancelarOrdenCompra(this.ordenSeleccionada.Id).subscribe({
      next: () => {
        this.alertService.exito('Orden de compra cancelada con éxito.');
        this.verDetalleOrden(this.ordenSeleccionada.Id);
      },
      error: (err) => this.alertService.error('Error al cancelar la orden: ' + (err.error?.error || err.message))
    });
  }

  descargarPdfOrden() {
    this.miscelaneaService.descargarOrdenCompraPdf(this.ordenSeleccionada.Id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => this.alertService.error('No se pudo generar el PDF de la orden de compra.')
    });
  }
}