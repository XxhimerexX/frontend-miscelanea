import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EmpresaService } from '../../services/empresa-service';
import { PlataformaService } from '../../services/plataforma-service';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-empresas',
  standalone: false,
  templateUrl: './empresas.html',
  styleUrl: './empresas.css',
})
export class Empresas implements OnInit {
  listaEmpresas: any[] = [];
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;
  guardando: boolean = false;

  empresaForm: any = this.formularioVacio();

  // --- Asignar un usuario existente como miembro de una empresa ---
  mostrarModalAsignar: boolean = false;
  empresaParaAsignar: any = null;
  identificadorAsignar: string = '';
  asignando: boolean = false;

  // --- Configuración de la plataforma (login compartido por todas las empresas) ---
  nombrePlataforma: string = '';
  tieneImagenLogin: boolean = false;
  guardandoPlataforma: boolean = false;
  subiendoImagenLogin: boolean = false;

  constructor(
    private empresaService: EmpresaService,
    private plataformaService: PlataformaService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEmpresas();
    this.cargarPlataforma();
  }

  // ===================== CONFIGURACIÓN DE LA PLATAFORMA =====================

  cargarPlataforma() {
    this.plataformaService.obtenerBranding().subscribe({
      next: (data) => {
        this.nombrePlataforma = data?.nombrePlataforma || '';
        this.tieneImagenLogin = !!data?.tieneImagenLogin;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar el branding de la plataforma', err),
    });
  }

  guardarNombrePlataforma() {
    this.guardandoPlataforma = true;
    this.plataformaService.actualizarBranding(this.nombrePlataforma).subscribe({
      next: () => {
        this.guardandoPlataforma = false;
        this.alertService.exito('Nombre de la plataforma actualizado.');
      },
      error: (err) => {
        this.guardandoPlataforma = false;
        this.alertService.error('Error: ' + (err.error?.error || err.message));
      },
    });
  }

  subirImagenLogin(evento: Event) {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    this.subiendoImagenLogin = true;
    this.plataformaService.subirImagenLogin(archivo).subscribe({
      next: () => {
        this.subiendoImagenLogin = false;
        this.alertService.exito('Imagen de login actualizada.');
        this.cargarPlataforma();
      },
      error: (err) => {
        this.subiendoImagenLogin = false;
        this.alertService.error('Error al subir la imagen: ' + (err.error?.error || err.message));
      },
    });
  }

  async eliminarImagenLogin() {
    const confirmado = await this.alertService.confirmar('¿Quitar la imagen de login? Se usará la imagen por defecto.', 'Confirmar');
    if (!confirmado) return;

    this.plataformaService.eliminarImagenLogin().subscribe({
      next: () => {
        this.alertService.exito('Imagen de login eliminada.');
        this.cargarPlataforma();
      },
      error: (err) => this.alertService.error('Error: ' + (err.error?.error || err.message)),
    });
  }

  get imagenLoginUrl(): string {
    return this.plataformaService.imagenLoginUrl();
  }

  formularioVacio() {
    return {
      Id: null,
      nombre: '',
      nombreComercial: '',
      nit: '',
      direccion: '',
      telefono: '',
      activa: true,
      admin: {
        modo: 'nuevo' as 'nuevo' | 'existente',
        identificador: '',
        nombre: '',
        nombreUsuario: '',
        correo: '',
        contrasena: '',
      },
    };
  }

  cargarEmpresas() {
    this.empresaService.listarTodas().subscribe({
      next: (data) => {
        this.listaEmpresas = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar las empresas', err),
    });
  }

  abrirModalNueva() {
    this.empresaForm = this.formularioVacio();
    this.modoEdicion = false;
    this.mostrarModal = true;
  }

  abrirModalEditar(empresa: any) {
    this.empresaForm = {
      Id: empresa.Id,
      nombre: empresa.Nombre,
      nombreComercial: empresa.NombreComercial || '',
      nit: empresa.NIT || '',
      direccion: empresa.Direccion || '',
      telefono: empresa.Telefono || '',
      activa: !!empresa.Activa,
      admin: this.formularioVacio().admin,
    };
    this.modoEdicion = true;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarEmpresa() {
    if (!this.empresaForm.nombre?.trim()) {
      this.alertService.advertencia('El nombre (razón social) de la empresa es obligatorio.');
      return;
    }

    if (this.modoEdicion) {
      this.guardando = true;
      this.empresaService
        .actualizar(this.empresaForm.Id, {
          nombre: this.empresaForm.nombre,
          nombreComercial: this.empresaForm.nombreComercial,
          nit: this.empresaForm.nit,
          direccion: this.empresaForm.direccion,
          telefono: this.empresaForm.telefono,
          activa: this.empresaForm.activa,
        })
        .subscribe({
          next: () => {
            this.guardando = false;
            this.alertService.exito('Empresa actualizada con éxito.');
            this.cerrarModal();
            this.cargarEmpresas();
          },
          error: (err) => {
            this.guardando = false;
            this.alertService.error('Error: ' + (err.error?.error || err.message));
          },
        });
      return;
    }

    if (this.empresaForm.admin.modo === 'existente' && !this.empresaForm.admin.identificador?.trim()) {
      this.alertService.advertencia('Indica el usuario o correo del administrador existente.');
      return;
    }
    if (
      this.empresaForm.admin.modo === 'nuevo' &&
      (!this.empresaForm.admin.nombre || !this.empresaForm.admin.nombreUsuario || !this.empresaForm.admin.correo || !this.empresaForm.admin.contrasena)
    ) {
      this.alertService.advertencia('Completa todos los datos del nuevo administrador.');
      return;
    }

    this.guardando = true;
    this.empresaService
      .crear({
        nombre: this.empresaForm.nombre,
        nombreComercial: this.empresaForm.nombreComercial,
        nit: this.empresaForm.nit,
        direccion: this.empresaForm.direccion,
        telefono: this.empresaForm.telefono,
        admin: this.empresaForm.admin,
      })
      .subscribe({
        next: () => {
          this.guardando = false;
          this.alertService.exito('Empresa creada con éxito.');
          this.cerrarModal();
          this.cargarEmpresas();
        },
        error: (err) => {
          this.guardando = false;
          this.alertService.error('Error al crear la empresa: ' + (err.error?.error || err.message));
        },
      });
  }

  async alternarActiva(empresa: any) {
    const nuevoEstado = !empresa.Activa;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    const confirmado = await this.alertService.confirmar(
      `¿Confirmas ${accion} la empresa "${empresa.NombreComercial || empresa.Nombre}"?`,
      'Confirmar acción'
    );
    if (!confirmado) return;

    this.empresaService
      .actualizar(empresa.Id, {
        nombre: empresa.Nombre,
        nombreComercial: empresa.NombreComercial,
        nit: empresa.NIT,
        direccion: empresa.Direccion,
        telefono: empresa.Telefono,
        activa: nuevoEstado,
      })
      .subscribe({
        next: () => this.cargarEmpresas(),
        error: (err) => this.alertService.error('Error: ' + (err.error?.error || err.message)),
      });
  }

  abrirModalAsignar(empresa: any) {
    this.empresaParaAsignar = empresa;
    this.identificadorAsignar = '';
    this.mostrarModalAsignar = true;
  }

  cerrarModalAsignar() {
    this.mostrarModalAsignar = false;
    this.empresaParaAsignar = null;
  }

  confirmarAsignar() {
    if (!this.identificadorAsignar.trim()) {
      this.alertService.advertencia('Indica el usuario o correo a asignar.');
      return;
    }
    this.asignando = true;
    this.empresaService.asignarUsuario(this.empresaParaAsignar.Id, this.identificadorAsignar.trim()).subscribe({
      next: (res: any) => {
        this.asignando = false;
        this.alertService.exito(res?.mensaje || 'Usuario asignado con éxito.');
        this.cerrarModalAsignar();
        this.cargarEmpresas();
      },
      error: (err) => {
        this.asignando = false;
        this.alertService.error('Error: ' + (err.error?.error || err.message));
      },
    });
  }
}
