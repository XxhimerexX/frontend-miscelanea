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
listaProductos: any[] = [];
listaCategorias: any[] = [];
modoEdicion: boolean = false;
mostrarModal: boolean = false;
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

  constructor(private miscelaneaService: MiscelaneaService, private cdr: ChangeDetectorRef, private alertService: AlertService) {}

  ngOnInit(): void {
    this.cargarInventario();
    this.cargarCategorias();
    this.cdr.detectChanges();
  }

  cargarCategorias() {
    this.miscelaneaService.obtenerCategorias().subscribe({
      next: (data) => this.listaCategorias = data,
      error: (err) => console.error('Error al cargar categorías', err)
    });
    this.cdr.detectChanges();
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
  // El valor que realmente se guarda lo calcula el backend (misma fórmula).
  precioVentaCalculado(): number {
    const costo = Number(this.productoForm.PrecioCosto) || 0;
    const margen = (Number(this.productoForm.MargenGanancia) || 0) / 100;
    const iva = (Number(this.productoForm.PorcentajeIva) || 0) / 100;
    return Math.round(costo * (1 + margen + iva) * 100) / 100;
  }

  abrirModalNuevo() {
    this.resetFormulario();
    this.mostrarModal = true;
  }

  abrirModalEditar(producto: any) {
    this.productoForm = { ...producto };
    this.modoEdicion = true;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.resetFormulario();
  }

  guardarProducto() {
    if (!this.productoForm.Nombre || !this.productoForm.PrecioCosto || this.productoForm.PrecioCosto <= 0) {
      this.alertService.advertencia('Por favor completa los campos obligatorios (Nombre y Precio Costo sin IVA).');
      return;
    }

    if (this.modoEdicion) {
      this.miscelaneaService.actualizarProducto(this.productoForm.Id, this.productoForm).subscribe({
        next: (res) => {
          this.alertService.exito('¡Producto actualizado con éxito!');
          this.cerrarModal();
          this.cargarInventario();
        },
        error: (err) => this.alertService.error('Error al actualizar el producto: ' + err.message)
      });
    } else {
      this.miscelaneaService.registrarProducto(this.productoForm).subscribe({
        next: (res) => {
          this.alertService.exito('¡Producto registrado con éxito!');
          this.cerrarModal();
          this.cargarInventario();
        },
        error: (err) => this.alertService.error('Error al registrar el producto: ' + err.message)
      });
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
  }
}