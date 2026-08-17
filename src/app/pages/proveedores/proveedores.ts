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
  listaProveedores: any[] = [];
  modoEdicion: boolean = false;
  proveedorForm: any = this.formularioVacio();

  constructor(
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
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

  guardarProveedor() {
    if (!this.proveedorForm.RazonSocial || !this.proveedorForm.NIT) {
      this.alertService.advertencia('Por favor completa los campos obligatorios (Razón Social y NIT).');
      return;
    }

    if (this.modoEdicion) {
      this.miscelaneaService.actualizarProveedor(this.proveedorForm.Id, this.proveedorForm).subscribe({
        next: () => {
          this.alertService.exito('¡Proveedor actualizado con éxito!');
          this.resetFormulario();
          this.cargarProveedores();
        },
        error: (err) => this.alertService.error('Error al actualizar el proveedor: ' + (err.error?.mensaje || err.message))
      });
    } else {
      this.miscelaneaService.registrarProveedor(this.proveedorForm).subscribe({
        next: () => {
          this.alertService.exito('¡Proveedor registrado con éxito!');
          this.resetFormulario();
          this.cargarProveedores();
        },
        error: (err) => this.alertService.error('Error al registrar el proveedor: ' + (err.error?.mensaje || err.message))
      });
    }
  }

  seleccionarParaEditar(proveedor: any) {
    this.proveedorForm = { ...proveedor };
    this.modoEdicion = true;
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
    this.modoEdicion = false;
  }
}
