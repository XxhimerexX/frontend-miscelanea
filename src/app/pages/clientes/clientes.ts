import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-clientes',
  standalone: false,
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  listaClientes: any[] = [];
  modoEdicion: boolean = false;
  clienteForm: any = this.formularioVacio();

  constructor(
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  formularioVacio() {
    return {
      Id: null,
      TipoCliente: 'DETAL',
      RazonSocial: '',
      NIT: '',
      Telefono: '',
      Correo: '',
      Direccion: ''
    };
  }

  cargarClientes() {
    this.miscelaneaService.obtenerClientes().subscribe({
      next: (data) => {
        this.listaClientes = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  guardarCliente() {
    if (!this.clienteForm.RazonSocial) {
      this.alertService.advertencia('Por favor completa el campo obligatorio (Razón Social / Nombre).');
      return;
    }

    if (this.modoEdicion) {
      this.miscelaneaService.actualizarCliente(this.clienteForm.Id, this.clienteForm).subscribe({
        next: () => {
          this.alertService.exito('¡Cliente actualizado con éxito!');
          this.resetFormulario();
          this.cargarClientes();
        },
        error: (err) => this.alertService.error('Error al actualizar el cliente: ' + (err.error?.mensaje || err.message))
      });
    } else {
      this.miscelaneaService.registrarCliente(this.clienteForm).subscribe({
        next: () => {
          this.alertService.exito('¡Cliente registrado con éxito!');
          this.resetFormulario();
          this.cargarClientes();
        },
        error: (err) => this.alertService.error('Error al registrar el cliente: ' + (err.error?.mensaje || err.message))
      });
    }
  }

  seleccionarParaEditar(cliente: any) {
    this.clienteForm = { ...cliente };
    this.modoEdicion = true;
  }

  async cambiarEstado(cliente: any) {
    const accion = cliente.Activo ? 'desactivar' : 'activar';
    const confirmado = await this.alertService.confirmar(`¿Deseas ${accion} al cliente "${cliente.RazonSocial}"?`, 'Confirmar');
    if (!confirmado) return;

    this.miscelaneaService.cambiarEstadoCliente(cliente.Id, !cliente.Activo).subscribe({
      next: () => {
        this.alertService.exito(`Cliente ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente.`);
        this.cargarClientes();
      },
      error: (err) => this.alertService.error('Error al cambiar el estado del cliente: ' + (err.error?.error || err.message))
    });
  }

  resetFormulario() {
    this.clienteForm = this.formularioVacio();
    this.modoEdicion = false;
  }
}