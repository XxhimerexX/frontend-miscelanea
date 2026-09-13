import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AlertService } from '../../services/alert-service';
import { AuthService } from '../../services/auht-services';
import { precioUnitarioConDescuento, ReglaDescuento } from '../../services/descuentos-util';

@Component({
  selector: 'app-pos',
  standalone: false,
  templateUrl: './pos.html',
  styleUrl: './pos.css',
})
export class Pos implements OnInit {

  terminoBusqueda: string = '';
  productos: any[] = [];          // catálogo completo
  categorias: any[] = [];
  categoriaActivaId: number | null = null; // null = Todos

  carrito: any[] = [];
  subtotalPagar: number = 0;
  impuestosPagar: number = 0;
  descuentoPagar: number = 0;
  totalPagar: number = 0;

  descuentosVigentes: ReglaDescuento[] = [];

  // Panel expandible del lado del pedido: 'ninguno' | 'cliente' | 'pago'
  panelActivo: 'ninguno' | 'cliente' | 'pago' = 'ninguno';

  metodoPagoId: number = 1;
  montoRecibido: number = 0;
  listaMetodosPago: any[] = [
    { Id: 1, Nombre: 'Efectivo' },
    { Id: 2, Nombre: 'Transferencia (Nequi/Daviplata)' },
    { Id: 3, Nombre: 'Tarjeta Débito / Crédito' }
  ];

  // --- Cliente / tipo de venta ---
  listaClientes: any[] = [];
  clienteSeleccionadoId: number | null = null;
  clienteSeleccionado: any = null;

  // --- Control de estado de caja ---
  verificandoCaja: boolean = true;
  cajaAbierta: boolean = false;
  baseInicialApertura: number = 0;
  abriendoCaja: boolean = false;

  constructor(
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.miscelaneaService.cajaVerificada$.subscribe((v) => {
      this.verificandoCaja = !v;
      this.cdr.detectChanges();
    });

    this.miscelaneaService.cajaAbierta$.subscribe((abierta) => {
      this.cajaAbierta = abierta;
      if (abierta) {
        this.cargarTodosLosProductos();
        this.cargarCategorias();
        this.cargarClientes();
        this.cargarDescuentos();
      }
      this.cdr.detectChanges();
    });

    this.miscelaneaService.refrescarEstadoCaja();
  }

  async confirmarAperturaCaja() {
    const base = Number(this.baseInicialApertura) || 0;

    if (base <= 0) {
      this.alertService.advertencia('Ingresa un monto de base inicial válido para abrir la caja.');
      return;
    }

    const confirmado = await this.alertService.confirmar(
      `¿Confirmas abrir la caja con una base inicial de $${base.toLocaleString()}?`,
      'Abrir caja'
    );
    if (!confirmado) return;

    this.abriendoCaja = true;
    this.miscelaneaService.abrirCaja({ baseInicial: base }).subscribe({
      next: () => {
        this.abriendoCaja = false;
        this.baseInicialApertura = 0;
        this.miscelaneaService.refrescarEstadoCaja();
      },
      error: (err) => {
        this.abriendoCaja = false;
        this.alertService.error(`No se pudo abrir la caja: ${err.error?.error || err.message}`);
      }
    });
  }

  cargarTodosLosProductos() {
    this.miscelaneaService.obtenerProductos().subscribe({
      next: (data) => {
        this.productos = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  cargarCategorias() {
    this.miscelaneaService.obtenerCategorias().subscribe({
      next: (data) => {
        this.categorias = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  cargarClientes() {
    this.miscelaneaService.obtenerClientes(true).subscribe({
      next: (data) => {
        this.listaClientes = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  cargarDescuentos() {
    this.miscelaneaService.descuentosVigentes().subscribe({
      next: (data) => {
        this.descuentosVigentes = data || [];
        this.recalcularPreciosCarrito();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar descuentos', err)
    });
  }

  // Catálogo filtrado por categoría + término de búsqueda (nombre o código de barras)
  get productosVisibles(): any[] {
    const term = this.terminoBusqueda.trim().toLowerCase();
    return this.productos.filter((p) => {
      const porCategoria = this.categoriaActivaId == null || p.CategoriaId === this.categoriaActivaId;
      if (!porCategoria) return false;
      if (!term) return true;
      return (
        String(p.Nombre || '').toLowerCase().includes(term) ||
        String(p.CodigoBarras || '').toLowerCase().includes(term)
      );
    });
  }

  seleccionarCategoria(id: number | null) {
    this.categoriaActivaId = id;
  }

  trackId = (_: number, item: any) => item.Id;

  urlImagen(p: any): string {
    return this.miscelaneaService.urlImagenProducto(p.Id);
  }

  // Stock disponible descontando lo que ya está en el carrito
  stockRestante(p: any): number {
    const enCarrito = this.carrito.find((i) => i.Id === p.Id)?.Cantidad || 0;
    return (Number(p.Stock) || 0) - enCarrito;
  }

  iconoCategoria(p: any): string {
    const nombre = String(p.Categoria || '').toLowerCase();
    if (nombre.includes('bebida')) return '🥤';
    if (nombre.includes('aliment') || nombre.includes('comida')) return '🍞';
    if (nombre.includes('postre') || nombre.includes('dulce')) return '🍰';
    if (nombre.includes('aseo') || nombre.includes('limpie')) return '🧴';
    if (nombre.includes('licor') || nombre.includes('cerveza')) return '🍺';
    return '📦';
  }

  // --- Cliente / precios ---
  onClienteSeleccionado() {
    this.clienteSeleccionado = this.clienteSeleccionadoId
      ? this.listaClientes.find(c => c.Id === Number(this.clienteSeleccionadoId))
      : null;
    this.recalcularPreciosCarrito();
    this.calcularTotal();
  }

  esVentaMayorista(): boolean {
    return this.clienteSeleccionado?.TipoCliente === 'MAYORISTA';
  }

  // Cálculo de precio (oferta + mayorista) para un producto del catálogo
  ofertaDe(p: any) {
    return precioUnitarioConDescuento(p, this.descuentosVigentes, this.esVentaMayorista());
  }

  // Precio final a cobrar por unidad (ya con oferta / mayorista)
  precioMostrar(p: any): number {
    return this.ofertaDe(p).precioFinal;
  }

  // Vuelve a calcular los precios de lo que ya está en el carrito (al cambiar
  // el cliente o al llegar los descuentos vigentes).
  private recalcularPreciosCarrito() {
    this.carrito.forEach((item) => {
      const calc = precioUnitarioConDescuento(
        {
          Id: item.Id,
          CategoriaId: item.CategoriaId,
          PrecioVenta: item.PrecioVentaDetal,
          PrecioVentaMayorista: item.PrecioVentaMayorista,
        },
        this.descuentosVigentes,
        this.esVentaMayorista()
      );
      item.PrecioVenta = calc.precioFinal;
      item.PrecioNormal = calc.precioNormal;
      item.DescuentoUnitario = calc.descuentoUnitario;
    });
  }

  // --- Carrito ---
  agregarAlCarrito(producto: any) {
    if (producto.Stock <= 0) {
      this.alertService.advertencia('¡El producto no tiene stock disponible!');
      return;
    }

    const itemExistente = this.carrito.find(item => item.Id === producto.Id);
    if (itemExistente) {
      if (itemExistente.Cantidad < producto.Stock) {
        itemExistente.Cantidad++;
      } else {
        this.alertService.advertencia('Has alcanzado el límite del stock disponible.');
      }
    } else {
      const calc = this.ofertaDe(producto);
      this.carrito.push({
        Id: producto.Id,
        Nombre: producto.Nombre,
        CategoriaId: producto.CategoriaId,
        PrecioVentaDetal: producto.PrecioVenta,
        PrecioVentaMayorista: producto.PrecioVentaMayorista ?? null,
        PrecioVenta: calc.precioFinal,
        PrecioNormal: calc.precioNormal,
        DescuentoUnitario: calc.descuentoUnitario,
        PorcentajeIva: producto.PorcentajeIva ?? 19,
        Cantidad: 1,
        StockMaximo: producto.Stock
      });
    }

    this.calcularTotal();
  }

  actualizarCantidad(item: any, cambio: number) {
    const nuevaCantidad = item.Cantidad + cambio;
    if (nuevaCantidad > 0 && nuevaCantidad <= item.StockMaximo) {
      item.Cantidad = nuevaCantidad;
      this.calcularTotal();
    }
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  // Total = suma de líneas (el precio YA incluye IVA). Subtotal e impuestos se
  // desglosan solo para mostrarlos; la venta se guarda con el total sin cambios.
  calcularTotal() {
    let subtotal = 0;
    let descuento = 0;
    this.totalPagar = this.carrito.reduce((acc, item) => {
      const totalLinea = item.PrecioVenta * item.Cantidad;
      const iva = Number(item.PorcentajeIva) || 0;
      subtotal += totalLinea / (1 + iva / 100);
      descuento += (Number(item.DescuentoUnitario) || 0) * item.Cantidad;
      return acc + totalLinea;
    }, 0);
    this.subtotalPagar = Math.round(subtotal);
    this.impuestosPagar = Math.round(this.totalPagar - this.subtotalPagar);
    this.descuentoPagar = Math.round(descuento);
  }

  calcularCambio(): number {
    const recibido = Number(this.montoRecibido) || 0;
    const cambio = recibido - this.totalPagar;
    return cambio > 0 ? cambio : 0;
  }

  get cantidadItems(): number {
    return this.carrito.reduce((acc, i) => acc + i.Cantidad, 0);
  }

  togglePanel(panel: 'cliente' | 'pago') {
    this.panelActivo = this.panelActivo === panel ? 'ninguno' : panel;
  }

  vaciarCarrito() {
    this.carrito = [];
    this.calcularTotal();
  }

  procesarVenta() {
    if (!this.cajaAbierta) {
      this.alertService.advertencia('No hay una caja abierta. Debes abrir turno antes de vender.');
      return;
    }

    if (this.carrito.length === 0) {
      this.alertService.advertencia('El carrito está vacío.');
      return;
    }

    if (this.metodoPagoId == 1) {
      const recibido = Number(this.montoRecibido) || 0;
      if (recibido < this.totalPagar) {
        this.panelActivo = 'pago';
        this.alertService.advertencia('Ingresa el dinero recibido en efectivo (debe cubrir el total).');
        return;
      }
    }

    const itemsPlanos = this.carrito.map(item => ({
      productoId: item.Id,
      cantidad: item.Cantidad,
      precioUnitario: item.PrecioVenta,
      subtotal: item.PrecioVenta * item.Cantidad
    }));

    const payloadVenta = {
      // el número de factura y el usuarioId los asigna el backend
      usuarioId: this.authService.obtenerUsuario()?.id,
      metodoPagoId: Number(this.metodoPagoId),
      subtotal: this.totalPagar,
      impuestos: 0,
      total: this.totalPagar,
      montoRecibido: this.metodoPagoId == 1 ? Number(this.montoRecibido) : this.totalPagar,
      cambioDevuelto: this.metodoPagoId == 1 ? this.calcularCambio() : 0,
      clienteId: this.clienteSeleccionadoId || null,
      tipoVenta: this.esVentaMayorista() ? 'MAYORISTA' : 'DETAL',
      items: itemsPlanos
    };

    this.miscelaneaService.registrarVenta(payloadVenta).subscribe({
      next: (res: any) => {
        this.alertService.confirmar(
          `Factura: ${res.numeroFactura || '(generada)'}\n\n¿Desea abrir e imprimir el ticket ahora?`,
          '¡Venta procesada con éxito!'
        ).then((deseaImprimir) => {
          if (deseaImprimir && res.ventaId) {
            this.abrirTicket(res.ventaId);
          }
        });

        this.carrito = [];
        this.subtotalPagar = 0;
        this.impuestosPagar = 0;
        this.descuentoPagar = 0;
        this.totalPagar = 0;
        this.montoRecibido = 0;
        this.metodoPagoId = 1;
        this.clienteSeleccionadoId = null;
        this.clienteSeleccionado = null;
        this.panelActivo = 'ninguno';
        this.cargarTodosLosProductos();
      },
      error: (err) => {
        console.error('Error al procesar la venta', err);
        this.alertService.error(`Error en el servidor: ${err.error?.error || err.message}`);
      }
    });
  }

  abrirTicket(id: number) {
    this.miscelaneaService.descargarTicketImagen(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const ventana = window.open('', '_blank');
        if (!ventana) return;
        ventana.document.write(`
          <html>
            <head>
              <title>Ticket</title>
              <style>
                @page { size: 58mm auto; margin: 0; }
                body { margin: 0; }
                img { width: 48mm; display: block; }
              </style>
            </head>
            <body>
              <img src="${url}" onload="window.print(); setTimeout(() => window.close(), 500);">
            </body>
          </html>
        `);
        ventana.document.close();
      },
      error: () => this.alertService.error('No se pudo generar el ticket para imprimir.')
    });
  }
}
