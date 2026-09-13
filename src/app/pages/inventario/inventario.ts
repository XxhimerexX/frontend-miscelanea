import { ChangeDetectorRef, Component } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-inventario',
  standalone: false,
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario {
tab: 'productos' | 'categorias' | 'descuentos' = 'productos';
listaProductos: any[] = [];
listaCategorias: any[] = [];
nuevaCategoriaNombre: string = '';
guardandoCategoria: boolean = false;
modoEdicion: boolean = false;
mostrarModal: boolean = false;

// --- Descuentos / ofertas ---
listaDescuentos: any[] = [];
mostrarModalDescuento: boolean = false;
modoEdicionDescuento: boolean = false;
guardandoDescuento: boolean = false;
descuentoForm: any = this.descuentoVacio();
readonly tiposDescuento = [
  { valor: 'PORCENTAJE', etiqueta: 'Porcentaje (%)' },
  { valor: 'MONTO', etiqueta: 'Monto fijo ($)' },
  { valor: 'PRECIO_FIJO', etiqueta: 'Precio fijo ($)' },
];
productoForm: any = {
    Id: null,
    CodigoBarras: '',
    Nombre: '',
    PrecioCosto: 0,       // costo SIN IVA
    PorcentajeIva: 19,
    MargenGanancia: 30,
    Stock: 0,
    StockMinimo: 5,
    CategoriaId: null
  };

  // --- Imagen del producto ---
  imagenPreview: string | null = null;   // data URL o URL del backend, para previsualizar
  imagenBlob: Blob | null = null;        // imagen nueva ya reescalada, pendiente de subir
  imagenExistente: boolean = false;      // el producto en edición ya tenía imagen
  subiendoImagen: boolean = false;
  private imgVersion: Record<number, number> = {}; // cache-busting por producto

  constructor(private miscelaneaService: MiscelaneaService, private cdr: ChangeDetectorRef, private alertService: AlertService) {}

  urlImagen(prod: any): string {
    return this.miscelaneaService.urlImagenProducto(prod.Id, this.imgVersion[prod.Id] || 0);
  }

  ngOnInit(): void {
    this.cargarInventario();
    this.cargarCategorias();
    this.cargarDescuentos();
    this.cdr.detectChanges();
  }

  // ===================== DESCUENTOS / OFERTAS =====================

  descuentoVacio() {
    const hoy = new Date().toISOString().slice(0, 10);
    return {
      Id: null,
      Nombre: '',
      aplicaA: 'producto' as 'producto' | 'categoria',
      ProductoId: null,
      CategoriaId: null,
      TipoDescuento: 'PORCENTAJE',
      ValorDescuento: 0,
      FechaInicio: hoy,
      FechaFin: hoy,
      Activa: true,
    };
  }

  cargarDescuentos() {
    this.miscelaneaService.listarDescuentos().subscribe({
      next: (data) => {
        this.listaDescuentos = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar descuentos', err),
    });
  }

  abrirModalDescuentoNuevo() {
    this.descuentoForm = this.descuentoVacio();
    this.modoEdicionDescuento = false;
    this.mostrarModalDescuento = true;
  }

  editarDescuento(d: any) {
    this.descuentoForm = {
      Id: d.Id,
      Nombre: d.Nombre,
      aplicaA: d.CategoriaId != null ? 'categoria' : 'producto',
      ProductoId: d.ProductoId ?? null,
      CategoriaId: d.CategoriaId ?? null,
      TipoDescuento: d.TipoDescuento,
      ValorDescuento: d.ValorDescuento,
      FechaInicio: (d.FechaInicio || '').slice(0, 10),
      FechaFin: (d.FechaFin || '').slice(0, 10),
      Activa: !!d.Activa,
    };
    this.modoEdicionDescuento = true;
    this.mostrarModalDescuento = true;
  }

  cerrarModalDescuento() {
    this.mostrarModalDescuento = false;
    this.descuentoForm = this.descuentoVacio();
  }

  guardarDescuento() {
    const f = this.descuentoForm;
    if (!f.Nombre?.trim()) {
      this.alertService.advertencia('Ponle un nombre a la oferta.');
      return;
    }
    if (f.aplicaA === 'producto' && !f.ProductoId) {
      this.alertService.advertencia('Elige el producto al que aplica.');
      return;
    }
    if (f.aplicaA === 'categoria' && !f.CategoriaId) {
      this.alertService.advertencia('Elige la categoría a la que aplica.');
      return;
    }

    const payload = {
      nombre: f.Nombre.trim(),
      tipoDescuento: f.TipoDescuento,
      valorDescuento: Number(f.ValorDescuento) || 0,
      productoId: f.aplicaA === 'producto' ? Number(f.ProductoId) : null,
      categoriaId: f.aplicaA === 'categoria' ? Number(f.CategoriaId) : null,
      fechaInicio: `${f.FechaInicio}T00:00:00`,
      fechaFin: `${f.FechaFin}T23:59:59`,
      activa: !!f.Activa,
    };

    this.guardandoDescuento = true;
    const obs = this.modoEdicionDescuento
      ? this.miscelaneaService.actualizarDescuento(f.Id, payload)
      : this.miscelaneaService.crearDescuento(payload);

    obs.subscribe({
      next: () => {
        this.guardandoDescuento = false;
        this.alertService.exito(this.modoEdicionDescuento ? 'Oferta actualizada.' : 'Oferta creada.');
        this.cerrarModalDescuento();
        this.cargarDescuentos();
      },
      error: (err) => {
        this.guardandoDescuento = false;
        this.alertService.error('Error: ' + (err.error?.error || err.message));
      },
    });
  }

  async eliminarDescuento(d: any) {
    const confirmado = await this.alertService.confirmar(`¿Eliminar la oferta "${d.Nombre}"?`, 'Eliminar oferta');
    if (!confirmado) return;
    this.miscelaneaService.eliminarDescuento(d.Id).subscribe({
      next: () => {
        this.alertService.exito('Oferta eliminada.');
        this.cargarDescuentos();
      },
      error: (err) => this.alertService.error('Error: ' + (err.error?.error || err.message)),
    });
  }

  etiquetaTipoDescuento(valor: string): string {
    return this.tiposDescuento.find((t) => t.valor === valor)?.etiqueta || valor;
  }

  descripcionValorDescuento(d: any): string {
    if (d.TipoDescuento === 'PORCENTAJE') return `${d.ValorDescuento}%`;
    if (d.TipoDescuento === 'MONTO') return `- $${Number(d.ValorDescuento).toLocaleString()}`;
    return `$${Number(d.ValorDescuento).toLocaleString()}`;
  }

  cargarCategorias() {
    this.miscelaneaService.obtenerCategorias().subscribe({
      next: (data) => {
        this.listaCategorias = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  // ===================== CATEGORÍAS =====================

  crearCategoria() {
    const nombre = (this.nuevaCategoriaNombre || '').trim();
    if (!nombre) {
      this.alertService.advertencia('Escribe el nombre de la categoría.');
      return;
    }
    this.guardandoCategoria = true;
    this.miscelaneaService.crearCategoria(nombre).subscribe({
      next: () => {
        this.guardandoCategoria = false;
        this.nuevaCategoriaNombre = '';
        this.alertService.exito('Categoría creada.');
        this.cargarCategorias();
      },
      error: (err) => {
        this.guardandoCategoria = false;
        this.alertService.error('Error: ' + (err.error?.error || err.message));
      },
    });
  }

  async renombrarCategoria(cat: any) {
    const nombre = prompt('Nuevo nombre de la categoría:', cat.Nombre);
    if (nombre == null || !nombre.trim() || nombre.trim() === cat.Nombre) return;
    this.miscelaneaService.actualizarCategoria(cat.Id, nombre.trim()).subscribe({
      next: () => {
        this.alertService.exito('Categoría actualizada.');
        this.cargarCategorias();
        this.cargarInventario();
      },
      error: (err) => this.alertService.error('Error: ' + (err.error?.error || err.message)),
    });
  }

  async eliminarCategoria(cat: any) {
    const confirmado = await this.alertService.confirmar(`¿Eliminar la categoría "${cat.Nombre}"?`, 'Eliminar categoría');
    if (!confirmado) return;
    this.miscelaneaService.eliminarCategoria(cat.Id).subscribe({
      next: () => {
        this.alertService.exito('Categoría eliminada.');
        this.cargarCategorias();
      },
      error: (err) => this.alertService.error(err.error?.error || 'No se pudo eliminar.'),
    });
  }

  descargandoExcel: boolean = false;
  enviandoExcel: boolean = false;

  descargarInventarioExcel() {
    this.descargandoExcel = true;
    this.miscelaneaService.descargarInventarioExcel().subscribe({
      next: (blob) => {
        this.descargandoExcel = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.descargandoExcel = false;
        this.alertService.error('No se pudo generar el Excel.');
      },
    });
  }

  enviarInventarioExcel() {
    let sugerido = '';
    try {
      sugerido = JSON.parse(localStorage.getItem('usuario') || '{}').correo || '';
    } catch {}
    const correo = prompt('Correo al que enviar el inventario:', sugerido);
    if (!correo || !correo.trim()) return;

    this.enviandoExcel = true;
    this.miscelaneaService.enviarInventarioExcel(correo.trim()).subscribe({
      next: (r: any) => {
        this.enviandoExcel = false;
        this.alertService.exito(r?.mensaje || 'Inventario enviado.');
      },
      error: (err) => {
        this.enviandoExcel = false;
        this.alertService.error('No se pudo enviar: ' + (err.error?.error || err.message));
      },
    });
  }

  cargarInventario() {
    this.miscelaneaService.obtenerProductos().subscribe({
      next: (data) => {
        this.listaProductos = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar el inventario', err);
      }
    });
  }

  // Solo para mostrarlo en pantalla mientras el usuario escribe.
  // El valor que realmente se guarda lo calcula el backend: debe usar ESTA misma fórmula.
  //   1) el margen es % SOBRE EL PRECIO DE VENTA -> precio sin IVA = costo / (1 - margen)
  //      (ej. costo 70.000 con 30% de margen -> 70.000 / 0,70 = 100.000, ganancia 30.000)
  //   2) el IVA se aplica sobre ese precio con margen -> precio de venta final
  precioVentaCalculado(): number {
    const costo = Number(this.productoForm.PrecioCosto) || 0;
    let margen = (Number(this.productoForm.MargenGanancia) || 0) / 100;
    const iva = (Number(this.productoForm.PorcentajeIva) || 0) / 100;
    if (margen >= 0.99) margen = 0.99; // evita dividir por ~0 con márgenes inválidos
    const precioSinIva = costo / (1 - margen);
    return Math.round(precioSinIva * (1 + iva) * 100) / 100;
  }

  abrirModalNuevo() {
    this.resetFormulario();
    this.mostrarModal = true;
  }

  abrirModalEditar(producto: any) {
    this.productoForm = { ...producto };
    this.modoEdicion = true;
    this.imagenBlob = null;
    this.imagenExistente = producto.TieneImagen === 1 || producto.TieneImagen === true;
    this.imagenPreview = this.imagenExistente ? this.urlImagen(producto) : null;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.resetFormulario();
  }

  // Lee la imagen elegida y la reescala en el navegador a máx. 500px antes de subirla
  onImagenSeleccionada(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files && input.files[0];
    if (!archivo) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.alertService.advertencia('La imagen debe ser JPG, PNG o WEBP.');
      return;
    }

    this.reescalarImagen(archivo, 500)
      .then((blob) => {
        this.imagenBlob = blob;
        const lector = new FileReader();
        lector.onload = () => {
          this.imagenPreview = lector.result as string;
          this.cdr.detectChanges();
        };
        lector.readAsDataURL(blob);
      })
      .catch(() => this.alertService.error('No se pudo procesar la imagen.'));
  }

  quitarImagen() {
    // Si el producto ya tenía imagen guardada, la borra en el backend
    if (this.modoEdicion && this.imagenExistente && this.productoForm.Id) {
      this.miscelaneaService.eliminarImagenProducto(this.productoForm.Id).subscribe({
        next: () => {
          this.imagenExistente = false;
          this.bumpVersion(this.productoForm.Id);
          this.cargarInventario();
        },
        error: (err) => this.alertService.error('No se pudo quitar la imagen: ' + (err.error?.error || err.message)),
      });
    }
    this.imagenBlob = null;
    this.imagenPreview = null;
  }

  private reescalarImagen(archivo: File, max: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(archivo);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * escala);
        const h = Math.round(img.height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject();
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject()), 'image/jpeg', 0.82);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject();
      };
      img.src = url;
    });
  }

  private bumpVersion(id: number) {
    this.imgVersion[id] = (this.imgVersion[id] || 0) + 1;
  }

  guardarProducto() {
    if (!this.productoForm.Nombre || !this.productoForm.PrecioCosto || this.productoForm.PrecioCosto <= 0) {
      this.alertService.advertencia('Por favor completa los campos obligatorios (Nombre y Precio Costo sin IVA).');
      return;
    }

    if (this.modoEdicion) {
      this.miscelaneaService.actualizarProducto(this.productoForm.Id, this.productoForm).subscribe({
        next: () => this.trasGuardar(this.productoForm.Id, 'actualizado'),
        error: (err) => this.alertService.error('Error al actualizar el producto: ' + err.message),
      });
    } else {
      this.miscelaneaService.registrarProducto(this.productoForm).subscribe({
        next: (res: any) => this.trasGuardar(res.productoId, 'registrado'),
        error: (err) => this.alertService.error('Error al registrar el producto: ' + err.message),
      });
    }
  }

  // Sube la imagen pendiente (si hay) tras guardar el producto
  private trasGuardar(productoId: number, verbo: string) {
    const cerrarYRefrescar = () => {
      this.alertService.exito(`¡Producto ${verbo} con éxito!`);
      this.cerrarModal();
      this.cargarInventario();
    };

    if (this.imagenBlob && productoId) {
      this.subiendoImagen = true;
      this.miscelaneaService.subirImagenProducto(productoId, this.imagenBlob).subscribe({
        next: () => {
          this.subiendoImagen = false;
          this.bumpVersion(productoId);
          cerrarYRefrescar();
        },
        error: (err) => {
          this.subiendoImagen = false;
          this.alertService.error('El producto se guardó, pero falló la imagen: ' + (err.error?.error || err.message));
          this.cerrarModal();
          this.cargarInventario();
        },
      });
    } else {
      cerrarYRefrescar();
    }
  }

  async eliminarProducto(id: number) {
    const confirmado = await this.alertService.confirmar('¿Estás seguro de que deseas eliminar este producto?', 'Eliminar producto');
    if (!confirmado) return;

    this.miscelaneaService.eliminarProducto(id).subscribe({
      next: (res) => {
        this.alertService.exito('Producto eliminado correctamente.');
        this.cargarInventario();
      },
      error: (err) => this.alertService.error('Error al eliminar el producto: ' + err.message)
    });
  }

  resetFormulario() {
    this.productoForm = {
      Id: null,
      CodigoBarras: '',
      Nombre: '',
      PrecioCosto: 0,
      PorcentajeIva: 19,
      MargenGanancia: 30,
      Stock: 0,
      StockMinimo: 5,
      CategoriaId: null
    };
    this.modoEdicion = false;
    this.imagenPreview = null;
    this.imagenBlob = null;
    this.imagenExistente = false;
    this.subiendoImagen = false;
  }
}