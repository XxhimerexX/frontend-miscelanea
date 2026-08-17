import { Component } from '@angular/core';
import { AuthService } from '../../services/auht-services';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-usuarios',
  standalone: false,
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios {
  listaUsuarios: any[] = [];
  listaRoles: any[] = [];
  modoEdicion: boolean = false;

  usuarioForm: any = {
    id: null,
    nombre: '',
    correo: '',
    contrasena: '',
    rolId: null,
    activo: true
  };

  constructor(public authService: AuthService, private alertService: AlertService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarRoles();
  }

  cargarUsuarios() {
    this.authService.listarUsuarios().subscribe({
      next: (data) => this.listaUsuarios = data,
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  cargarRoles() {
    this.authService.listarRoles().subscribe({
      next: (data) => this.listaRoles = data,
      error: (err) => console.error('Error al cargar roles', err)
    });
  }

  guardarUsuario() {
    if (this.modoEdicion) {
      const { id, nombre, rolId, activo } = this.usuarioForm;
      this.authService.actualizarUsuario(id, { nombre, rolId, activo }).subscribe({
        next: () => {
          this.alertService.exito('Usuario actualizado con éxito.');
          this.resetFormulario();
          this.cargarUsuarios();
        },
        error: (err) => this.alertService.error('Error al actualizar: ' + (err.error?.error || err.message))
      });
      return;
    }

    if (!this.usuarioForm.nombre || !this.usuarioForm.correo || !this.usuarioForm.contrasena || !this.usuarioForm.rolId) {
      this.alertService.advertencia('Completa todos los campos obligatorios.');
      return;
    }

    this.authService.registrarUsuario({
      nombre: this.usuarioForm.nombre,
      correo: this.usuarioForm.correo,
      contrasena: this.usuarioForm.contrasena,
      rolId: this.usuarioForm.rolId
    }).subscribe({
      next: () => {
        this.alertService.exito('Usuario creado con éxito.');
        this.resetFormulario();
        this.cargarUsuarios();
      },
      error: (err) => this.alertService.error('Error al crear el usuario: ' + (err.error?.error || err.message))
    });
  }

  seleccionarParaEditar(usuario: any) {
    this.usuarioForm = {
      id: usuario.Id,
      nombre: usuario.Nombre,
      correo: usuario.Correo,
      contrasena: '',
      rolId: usuario.RolId,
      activo: usuario.Activo
    };
    this.modoEdicion = true;
  }

  async alternarActivo(usuario: any) {
    const nuevoEstado = !usuario.Activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    const confirmado = await this.alertService.confirmar(`¿Confirmas ${accion} a ${usuario.Nombre}?`, 'Confirmar acción');
    if (!confirmado) return;

    this.authService.actualizarUsuario(usuario.Id, {
      nombre: usuario.Nombre,
      rolId: usuario.RolId,
      activo: nuevoEstado
    }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => this.alertService.error('Error: ' + (err.error?.error || err.message))
    });
  }

  resetFormulario() {
    this.usuarioForm = { id: null, nombre: '', correo: '', contrasena: '', rolId: null, activo: true };
    this.modoEdicion = false;
  }
}
