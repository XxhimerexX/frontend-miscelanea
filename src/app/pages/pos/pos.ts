import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-pos',
  standalone: false,
  templateUrl: './pos.html',
  styleUrl: './pos.css',
})
export class Pos implements OnInit {

  terminoBusqueda: string = '';
  productosEncontrados: any[] = [];
  carrito: any[] = [];
  totalPagar: number = 0;

  metodoPagoId: number = 1;
  montoRecibido: number = 0;
  listaMetodosPago: any[] = [
    { Id: 1, Nombre: 'Efectivo' },
    { Id: 2, Nombre: 'Transferencia (Nequi/Daviplata)' },
    { Id: 3, Nombre: 'Tarjeta Débito / Crédito' }
  ];

  // --- Control de estado de caja ---
  verificandoCaja: boolean = true;
  cajaAbierta: boolean = false;
  baseInicialApertura: number = 0;
  abriendoCaja: boolean = false;

  constructor(private miscelaneaService: MiscelaneaService, private cdr: ChangeDetectorRef, private alertService: AlertService) {}

  ngOnInit(): void {
    this.miscelaneaService.cajaVerificada$.subscribe((v) => {
    this.verificandoCaja = !v;
    this.cdr.detectChanges();
  });

  this.miscelaneaService.cajaAbierta$.subscribe((abierta) => {
    this.cajaAbierta = abierta;
    if (abierta) {
      this.cargarTodosLosProductos();
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
  if (!confirmado) {
    return;
  }

  this.abriendoCaja = true;
  this.miscelaneaService.abrirCaja({ usuarioId: 1, baseInicial: base }).subscribe({
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
        this.productosEncontrados = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  buscar() {
    if (!this.terminoBusqueda.trim()) {
      this.cargarTodosLosProductos();
      return;
    }
    this.miscelaneaService.obtenerProductos(this.terminoBusqueda).subscribe({
      next: (data) => {
        this.productosEncontrados = Array.isArray(data) ? data : [data];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Producto no encontrado', err);
        this.productosEncontrados = [];
      }
    });
  }

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
      this.carrito.push({
        Id: producto.Id,
        Nombre: producto.Nombre,
        PrecioVenta: producto.PrecioVenta,
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

  calcularTotal() {
    this.totalPagar = this.carrito.reduce((acc, item) => acc + (item.PrecioVenta * item.Cantidad), 0);
  }

  calcularCambio(): number {
    const recibido = Number(this.montoRecibido) || 0;
    const cambio = recibido - this.totalPagar;
    return cambio > 0 ? cambio : 0;
  }

  procesarVenta() {
    // Segunda barrera de seguridad, por si el estado quedó desincronizado
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
        this.alertService.advertencia('El dinero recibido en efectivo es menor al total a pagar.');
        return;
      }
    }

    const fechaActual = new Date();
    const facturaGenerada = `FAC-${fechaActual.getFullYear()}${(fechaActual.getMonth()+1).toString().padStart(2, '0')}${fechaActual.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const itemsPlanos = this.carrito.map(item => ({
      productoId: item.Id,
      cantidad: item.Cantidad,
      precioUnitario: item.PrecioVenta,
      subtotal: item.PrecioVenta * item.Cantidad
    }));

    const payloadVenta = {
      numeroFactura: facturaGenerada,
      usuarioId: 1,
      metodoPagoId: Number(this.metodoPagoId),
      subtotal: this.totalPagar,
      impuestos: 0,
      total: this.totalPagar,
      montoRecibido: this.metodoPagoId == 1 ? Number(this.montoRecibido) : this.totalPagar,
      cambioDevuelto: this.metodoPagoId == 1 ? this.calcularCambio() : 0,
      items: itemsPlanos
    };

    this.miscelaneaService.registrarVenta(payloadVenta).subscribe({
      next: (res: any) => {
        this.alertService.confirmar(
          `Factura: ${res.numeroFactura || facturaGenerada}\n\n¿Desea abrir e imprimir el ticket ahora?`,
          '¡Venta procesada con éxito!'
        ).then((deseaImprimir) => {
          if (deseaImprimir && res.ventaId) {
            this.abrirTicket(res.ventaId);
          }
        });

        this.carrito = [];
        this.totalPagar = 0;
        this.montoRecibido = 0;
        this.metodoPagoId = 1;
        this.cargarTodosLosProductos();
      },
      error: (err) => {
        console.error('Error al procesar la venta', err);
        this.alertService.error(`Error en el servidor: ${err.error?.error || err.message}`);
      }
    });
  }

  abrirTicket(id: number) {
    window.open(`/ticket/${id}`, '_blank');
  }
}