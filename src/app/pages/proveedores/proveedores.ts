import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-proveedores',
  standalone: false,
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.css',
})
export class Proveedores implements OnInit {
  tab: 'proveedores' | 'tipos' = 'proveedores';

  listaProveedores: any[] = [];
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;
  proveedorForm: any = this.formularioVacio();

  // --- Productos que vende el proveedor (checkboxes en el formulario) ---
  listaProductos: any[] = [];
  productosSeleccionados: Set<number> = new Set();

  // --- Tipos de documento (catálogo editable) ---
  tiposDocumento: any[] = [];        // activos, para el <select> de subida
  tiposDocumentoTodos: any[] = [];   // todos, para la pestaña de gestión
  nuevoTipoNombre: string = '';
  guardandoTipo: boolean = false;

  // --- Modal de documentos ---
  mostrarModalDocumentos: boolean = false;
  proveedorDocumentos: any = null;
  listaDocumentos: any[] = [];
  archivoSeleccionado: File | null = null;
  tipoDocumentoSeleccionado: string = '';

  constructor(
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarProductos();
    this.cargarTiposDocumento();
  }

  formularioVacio() {
    return {
      Id: null,
      RazonSocial: '',
      NIT: '',
      Telefono: '',
      Correo: '',
      Direccion: '',
      Contacto: '',
    };
  }

  cargarProveedores() {
    this.miscelaneaService.obtenerProveedores().subscribe({
      next: (data) => {
        this.listaProveedores = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar proveedores', err),
    });
  }

  cargarProductos() {
    this.miscelaneaService.obtenerProductos().subscribe({
      next: (data) => {
        this.listaProductos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar productos', err),
    });
  }

  cargarTiposDocumento() {
    this.miscelaneaService.listarTiposDocumentoProveedor().subscribe({
      next: (data) => {
        this.tiposDocumentoTodos = data || [];
        this.tiposDocumento = this.tiposDocumentoTodos.filter((t) => t.Activo);
        if (!this.tipoDocumentoSeleccionado && this.tiposDocumento.length) {
          this.tipoDocumentoSeleccionado = this.tiposDocumento[0].Codigo;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar tipos de documento', err),
    });
  }

  toggleProducto(productoId: number) {
    if (this.productosSeleccionados.has(productoId)) {
      this.productosSeleccionados.delete(productoId);
    } else {
      this.productosSeleccionados.add(productoId);
    }
  }

  // --- Modal crear / editar proveedor ---

  abrirModalNuevo() {
    this.resetFormulario();
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.resetFormulario();
  }

  guardarProveedor() {
    if (!this.proveedorForm.RazonSocial || !this.proveedorForm.NIT) {
      this.alertService.advertencia('Por favor completa los campos obligatorios (Razón Social y NIT).');
      return;
    }

    if (this.modoEdicion) {
      this.miscelaneaService.actualizarProveedor(this.proveedorForm.Id, this.proveedorForm).subscribe({
        next: () => this.guardarProductosDelProveedor(this.proveedorForm.Id, '¡Proveedor actualizado con éxito!'),
        error: (err) => this.alertService.error('Error al actualizar el proveedor: ' + (err.error?.mensaje || err.message)),
      });
    } else {
      this.miscelaneaService.registrarProveedor(this.proveedorForm).subscribe({
        next: (res: any) => this.guardarProductosDelProveedor(res.proveedorId, '¡Proveedor registrado con éxito!'),
        error: (err) => this.alertService.error('Error al registrar el proveedor: ' + (err.error?.mensaje || err.message)),
      });
    }
  }

  private guardarProductosDelProveedor(proveedorId: number, mensajeExito: string) {
    const productoIds = Array.from(this.productosSeleccionados);
    this.miscelaneaService.asociarProductosProveedor(proveedorId, productoIds).subscribe({
      next: () => {
        this.alertService.exito(mensajeExito);
        this.cerrarModal();
        this.cargarProveedores();
      },
      error: (err) =>
        this.alertService.error('El proveedor se guardó, pero hubo un error asociando sus productos: ' + (err.error?.mensaje || err.message)),
    });
  }

  seleccionarParaEditar(proveedor: any) {
    this.proveedorForm = { ...proveedor };
    this.modoEdicion = true;
    this.mostrarModal = true;
    this.productosSeleccionados = new Set();

    this.miscelaneaService.obtenerProductosDeProveedor(proveedor.Id).subscribe({
      next: (productos) => {
        this.productosSeleccionados = new Set(productos.map((p: any) => p.Id));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar los productos del proveedor', err),
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
      error: (err) => this.alertService.error('Error al cambiar el estado del proveedor: ' + (err.error?.error || err.message)),
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
    if (this.tiposDocumento.length) this.tipoDocumentoSeleccionado = this.tiposDocumento[0].Codigo;
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
      error: (err) => console.error('Error al cargar documentos', err),
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
    if (!this.tipoDocumentoSeleccionado) {
      this.alertService.advertencia('Selecciona un tipo de documento.');
      return;
    }

    this.miscelaneaService
      .subirDocumentoProveedor(this.proveedorDocumentos.Id, this.archivoSeleccionado, this.tipoDocumentoSeleccionado)
      .subscribe({
        next: () => {
          this.alertService.exito('Documento subido con éxito.');
          this.archivoSeleccionado = null;
          this.cargarDocumentos();
        },
        error: (err) => this.alertService.error('Error al subir el documento: ' + (err.error?.mensaje || err.message)),
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
      error: () => this.alertService.error('No se pudo descargar el documento.'),
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
      error: () => this.alertService.error('No se pudo eliminar el documento.'),
    });
  }

  etiquetaTipoDocumento(codigo: string): string {
    return this.tiposDocumentoTodos.find((t) => t.Codigo === codigo)?.Nombre || codigo;
  }

  // --- Pestaña: tipos de documento ---

  crearTipo() {
    const nombre = (this.nuevoTipoNombre || '').trim();
    if (!nombre) {
      this.alertService.advertencia('Escribe el nombre del tipo de documento.');
      return;
    }
    this.guardandoTipo = true;
    this.miscelaneaService.crearTipoDocumentoProveedor(nombre).subscribe({
      next: () => {
        this.guardandoTipo = false;
        this.nuevoTipoNombre = '';
        this.alertService.exito('Tipo de documento creado.');
        this.cargarTiposDocumento();
      },
      error: (err) => {
        this.guardandoTipo = false;
        this.alertService.error('Error: ' + (err.error?.mensaje || err.message));
      },
    });
  }

  toggleActivoTipo(t: any) {
    this.miscelaneaService.actualizarTipoDocumentoProveedor(t.Id, { nombre: t.Nombre, activo: !t.Activo }).subscribe({
      next: () => this.cargarTiposDocumento(),
      error: (err) => this.alertService.error('Error: ' + (err.error?.mensaje || err.message)),
    });
  }

  async renombrarTipo(t: any) {
    const nombre = prompt('Nuevo nombre para el tipo de documento:', t.Nombre);
    if (nombre == null || !nombre.trim() || nombre.trim() === t.Nombre) return;
    this.miscelaneaService.actualizarTipoDocumentoProveedor(t.Id, { nombre: nombre.trim(), activo: t.Activo }).subscribe({
      next: () => {
        this.alertService.exito('Nombre actualizado.');
        this.cargarTiposDocumento();
      },
      error: (err) => this.alertService.error('Error: ' + (err.error?.mensaje || err.message)),
    });
  }

  async eliminarTipo(t: any) {
    const confirmado = await this.alertService.confirmar(`¿Eliminar el tipo "${t.Nombre}"?`, 'Eliminar tipo');
    if (!confirmado) return;
    this.miscelaneaService.eliminarTipoDocumentoProveedor(t.Id).subscribe({
      next: () => {
        this.alertService.exito('Tipo eliminado.');
        this.cargarTiposDocumento();
      },
      error: (err) => this.alertService.error(err.error?.mensaje || 'No se pudo eliminar.'),
    });
  }
}
