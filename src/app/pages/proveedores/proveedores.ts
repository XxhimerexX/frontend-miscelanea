import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AlertService } from '../../services/alert-service';

const TIPOS_DOCUMENTO = [
  { valor: 'RUT', etiqueta: 'RUT' },
  { valor: 'CAMARA_COMERCIO', etiqueta: 'Cámara de Comercio' },
  { valor: 'LISTA_PRECIOS', etiqueta: 'Lista de Precios' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

@Component({
  selector: 'app-proveedores',
  standalone: false,
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.css',
})
export class Proveedores implements OnInit {
  listaProveedores: any[] = [];
  modoEdicion: boolean = false;
  proveedorForm: any = this.formularioVacio();

  // --- Productos que vende el proveedor (checkboxes en el formulario) ---
  listaProductos: any[] = [];
  productosSeleccionados: Set<number> = new Set();

  // --- Modal de documentos ---
  tiposDocumento = TIPOS_DOCUMENTO;
  mostrarModalDocumentos: boolean = false;
  proveedorDocumentos: any = null; // proveedor sobre el que se está gestionando documentos
  listaDocumentos: any[] = [];
  archivoSeleccionado: File | null = null;
  tipoDocumentoSeleccionado: string = 'RUT';

  constructor(
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarProductos();
  }

  formularioVacio() {
    return {
      Id: null,
      RazonSocial: '',
      NIT: '',
      Telefono: '',
      Correo: '',
      Direccion: '',
      Contacto: ''
    };
  }

  cargarProveedores() {
    this.miscelaneaService.obtenerProveedores().subscribe({
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
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  toggleProducto(productoId: number) {
    if (this.productosSeleccionados.has(productoId)) {
      this.productosSeleccionados.delete(productoId);
    } else {
      this.productosSeleccionados.add(productoId);
    }
  }

  guardarProveedor() {
    if (!this.proveedorForm.RazonSocial || !this.proveedorForm.NIT) {
      this.alertService.advertencia('Por favor completa los campos obligatorios (Razón Social y NIT).');
      return;
    }

    if (this.modoEdicion) {
      this.miscelaneaService.actualizarProveedor(this.proveedorForm.Id, this.proveedorForm).subscribe({
        next: () => this.guardarProductosDelProveedor(this.proveedorForm.Id, '¡Proveedor actualizado con éxito!'),
        error: (err) => this.alertService.error('Error al actualizar el proveedor: ' + (err.error?.mensaje || err.message))
      });
    } else {
      this.miscelaneaService.registrarProveedor(this.proveedorForm).subscribe({
        next: (res: any) => this.guardarProductosDelProveedor(res.proveedorId, '¡Proveedor registrado con éxito!'),
        error: (err) => this.alertService.error('Error al registrar el proveedor: ' + (err.error?.mensaje || err.message))
      });
    }
  }

  // Después de crear/actualizar el proveedor, guarda qué productos vende
  // (siempre reemplaza la lista completa por la selección actual de checkboxes).
  private guardarProductosDelProveedor(proveedorId: number, mensajeExito: string) {
    const productoIds = Array.from(this.productosSeleccionados);
    this.miscelaneaService.asociarProductosProveedor(proveedorId, productoIds).subscribe({
      next: () => {
        this.alertService.exito(mensajeExito);
        this.resetFormulario();
        this.cargarProveedores();
      },
      error: (err) => this.alertService.error('El proveedor se guardó, pero hubo un error asociando sus productos: ' + (err.error?.mensaje || err.message))
    });
  }

  seleccionarParaEditar(proveedor: any) {
    this.proveedorForm = { ...proveedor };
    this.modoEdicion = true;
    this.productosSeleccionados = new Set();

    this.miscelaneaService.obtenerProductosDeProveedor(proveedor.Id).subscribe({
      next: (productos) => {
        this.productosSeleccionados = new Set(productos.map((p: any) => p.Id));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar los productos del proveedor', err)
    });
  }

  async cambiarEstado(proveedor: any) {
    const accion = proveedor.Activo ? 'desactivar' : 'activar';
    const confirmado = await this.alertService.confirmar(`¿Deseas ${accion} al proveedor "${proveedor.RazonSocial}"?`, 'Confirmar');
    if (!confirmado) return;

    this.miscelaneaService.cambiarEstadoProveedor(proveedor.Id, !proveedor.Activo).subscribe({
      next: () => {
        this.alertService.exito(`Proveedor ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente.`);
        this.cargarProveedores();
      },
      error: (err) => this.alertService.error('Error al cambiar el estado del proveedor: ' + (err.error?.error || err.message))
    });
  }

  resetFormulario() {
    this.proveedorForm = this.formularioVacio();
    this.productosSeleccionados = new Set();
    this.modoEdicion = false;
  }

  // --- Modal de documentos ---

  abrirModalDocumentos(proveedor: any) {
    this.proveedorDocumentos = proveedor;
    this.archivoSeleccionado = null;
    this.tipoDocumentoSeleccionado = 'RUT';
    this.mostrarModalDocumentos = true;
    this.cargarDocumentos();
  }

  cerrarModalDocumentos() {
    this.mostrarModalDocumentos = false;
    this.proveedorDocumentos = null;
    this.listaDocumentos = [];
  }

  cargarDocumentos() {
    this.miscelaneaService.listarDocumentosProveedor(this.proveedorDocumentos.Id).subscribe({
      next: (data) => {
        this.listaDocumentos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar documentos', err)
    });
  }

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  subirDocumento() {
    if (!this.archivoSeleccionado) {
      this.alertService.advertencia('Selecciona un archivo (PDF, XLS o XLSX).');
      return;
    }

    this.miscelaneaService.subirDocumentoProveedor(
      this.proveedorDocumentos.Id, this.archivoSeleccionado, this.tipoDocumentoSeleccionado
    ).subscribe({
      next: () => {
        this.alertService.exito('Documento subido con éxito.');
        this.archivoSeleccionado = null;
        this.cargarDocumentos();
      },
      error: (err) => this.alertService.error('Error al subir el documento: ' + (err.error?.mensaje || err.message))
    });
  }

  descargarDocumento(doc: any) {
    this.miscelaneaService.descargarDocumentoProveedor(doc.Id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.NombreOriginal;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.alertService.error('No se pudo descargar el documento.')
    });
  }

  async eliminarDocumento(doc: any) {
    const confirmado = await this.alertService.confirmar(`¿Eliminar el documento "${doc.NombreOriginal}"?`, 'Eliminar documento');
    if (!confirmado) return;

    this.miscelaneaService.eliminarDocumentoProveedor(doc.Id).subscribe({
      next: () => {
        this.alertService.exito('Documento eliminado.');
        this.cargarDocumentos();
      },
      error: () => this.alertService.error('No se pudo eliminar el documento.')
    });
  }

  etiquetaTipoDocumento(valor: string): string {
    return this.tiposDocumento.find(t => t.valor === valor)?.etiqueta || valor;
  }
}