import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from '../../services/auht-services';
import { AlertService } from '../../services/alert-service';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { EmpresaService } from '../../services/empresa-service';

interface PermisoItem {
  id: number;
  codigo: string;
  accion: string;
  accionLabel: string;
}
interface GrupoPermiso {
  clave: string;
  label: string;
  permisos: PermisoItem[];
}

@Component({
  selector: 'app-usuarios',
  standalone: false,
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios {
  tab: 'usuarios' | 'roles' | 'config' | 'empresa' = 'usuarios';

  listaUsuarios: any[] = [];
  listaRoles: any[] = [];
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;

  usuarioForm: any = {
    id: null,
    nombre: '',
    nombreUsuario: '',
    correo: '',
    contrasena: '',
    rolId: null,
    activo: true,
    recibeAlertasStock: false,
  };

  // --- Configuración de correo ---
  configCorreo: any = { host: '', puerto: 587, usuario: '', contrasena: '', remitente: '', activo: false, tienePassword: false };
  correoPrueba: string = '';
  guardandoConfig: boolean = false;
  probandoCorreo: boolean = false;

  // --- Datos de la empresa (para las facturas/tickets, sidebar y pestaña del navegador) ---
  empresaForm: any = { nombre: '', nombreComercial: '', nit: '', direccion: '', telefono: '', nombreMarca: '' };
  guardandoEmpresa: boolean = false;
  tieneLogo: boolean = false;
  subiendoLogo: boolean = false;

  // --- Roles y permisos ---
  rolesDetalle: any[] = [];
  permisos: any[] = [];
  gruposPermisos: GrupoPermiso[] = [];
  rolSeleccionado: any = null;
  rolNombreEdit: string = '';
  permisoIdsSeleccionados = new Set<number>();
  creandoRol: boolean = false;
  guardandoRol: boolean = false;

  private readonly MODULOS: Record<string, string> = {
    dashboard: 'Panel de control',
    ventas: 'Ventas / POS',
    productos: 'Inventario',
    clientes: 'Clientes',
    proveedores: 'Proveedores',
    compras: 'Compras',
    devoluciones: 'Devoluciones',
    reportes: 'Reportes',
    usuarios: 'Usuarios y roles',
    caja: 'Caja',
  };
  private readonly ACCIONES: Record<string, string> = {
    ver: 'Ver',
    crear: 'Crear',
    editar: 'Editar',
    eliminar: 'Eliminar',
    anular: 'Anular',
    recibir: 'Recibir',
    cancelar: 'Cancelar',
    autorizar: 'Autorizar',
    usar: 'Usar',
  };

  constructor(
    public authService: AuthService,
    private alertService: AlertService,
    private miscelaneaService: MiscelaneaService,
    private empresaService: EmpresaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarRoles();
    if (this.esAdmin) {
      this.cargarRolesDetalle();
      this.cargarPermisos();
      this.cargarConfigCorreo();
      this.cargarEmpresa();
      this.correoPrueba = this.authService.obtenerUsuario()?.correo || '';
    }
  }

  // ===================== DATOS DE LA EMPRESA =====================

  cargarEmpresa() {
    this.empresaService.obtenerActual().subscribe({
      next: (data) => {
        this.empresaForm = {
          nombre: data.Nombre,
          nombreComercial: data.NombreComercial || '',
          nit: data.NIT || '',
          direccion: data.Direccion || '',
          telefono: data.Telefono || '',
          nombreMarca: data.NombreMarca || '',
        };
        this.tieneLogo = !!data.TieneLogo;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar los datos de la empresa', err),
    });
  }

  guardarEmpresa() {
    this.guardandoEmpresa = true;
    this.empresaService
      .actualizarActual({
        nombreComercial: this.empresaForm.nombreComercial,
        nit: this.empresaForm.nit,
        direccion: this.empresaForm.direccion,
        telefono: this.empresaForm.telefono,
        nombreMarca: this.empresaForm.nombreMarca,
      })
      .subscribe({
        next: () => {
          this.guardandoEmpresa = false;
          this.alertService.exito('Datos de la empresa actualizados. Los próximos tickets y órdenes ya los usarán.');
          this.empresaService.notificarBrandingActualizada();
        },
        error: (err) => {
          this.guardandoEmpresa = false;
          this.alertService.error('Error: ' + (err.error?.error || err.message));
        },
      });
  }

  get logoUrl(): string {
    return this.empresaService.logoUrl();
  }

  subirLogo(evento: Event) {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    this.subiendoLogo = true;
    this.empresaService.subirLogo(archivo).subscribe({
      next: () => {
        this.subiendoLogo = false;
        this.tieneLogo = true;
        this.alertService.exito('Logo actualizado. Ya se ve en el sidebar y en los próximos tickets.');
        this.empresaService.notificarBrandingActualizada();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.subiendoLogo = false;
        this.alertService.error('Error al subir el logo: ' + (err.error?.error || err.message));
      },
    });
  }

  async eliminarLogo() {
    const confirmado = await this.alertService.confirmar('¿Quitar el logo de la empresa? Se usará el ícono por defecto.', 'Confirmar');
    if (!confirmado) return;

    this.empresaService.eliminarLogo().subscribe({
      next: () => {
        this.tieneLogo = false;
        this.alertService.exito('Logo eliminado.');
        this.empresaService.notificarBrandingActualizada();
        this.cdr.detectChanges();
      },
      error: (err) => this.alertService.error('Error: ' + (err.error?.error || err.message)),
    });
  }

  // ===================== CONFIGURACIÓN DE CORREO =====================

  cargarConfigCorreo() {
    this.miscelaneaService.obtenerConfigCorreo().subscribe({
      next: (data) => {
        this.configCorreo = { ...data, contrasena: '' };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar configuración de correo', err),
    });
  }

  guardarConfigCorreo() {
    this.guardandoConfig = true;
    this.miscelaneaService.guardarConfigCorreo(this.configCorreo).subscribe({
      next: () => {
        this.guardandoConfig = false;
        this.alertService.exito('Configuración de correo guardada.');
        this.cargarConfigCorreo();
      },
      error: (err) => {
        this.guardandoConfig = false;
        this.alertService.error('Error: ' + (err.error?.error || err.message));
      },
    });
  }

  probarCorreo() {
    if (!this.correoPrueba?.trim()) {
      this.alertService.advertencia('Escribe un correo de destino para la prueba.');
      return;
    }
    this.probandoCorreo = true;
    this.miscelaneaService.probarConfigCorreo(this.correoPrueba.trim()).subscribe({
      next: (r: any) => {
        this.probandoCorreo = false;
        this.alertService.exito(r?.mensaje || 'Correo de prueba enviado.');
      },
      error: (err) => {
        this.probandoCorreo = false;
        this.alertService.error('No se pudo enviar: ' + (err.error?.error || err.message));
      },
    });
  }

  get esAdmin(): boolean {
    return this.authService.esAdmin();
  }

  get usuarioActualId(): number | null {
    return this.authService.obtenerUsuario()?.id ?? null;
  }

  // ===================== USUARIOS =====================

  cargarUsuarios() {
    this.authService.listarUsuarios().subscribe({
      next: (data) => {
        this.listaUsuarios = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar usuarios', err),
    });
  }

  cargarRoles() {
    this.authService.listarRoles().subscribe({
      next: (data) => {
        this.listaRoles = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar roles', err),
    });
  }

  abrirModalNuevo() {
    this.resetFormulario();
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.resetFormulario();
  }

  guardarUsuario() {
    if (this.modoEdicion) {
      const { id, nombre, correo, rolId, activo, recibeAlertasStock } = this.usuarioForm;
      this.authService.actualizarUsuario(id, { nombre, correo, rolId, activo, recibeAlertasStock }).subscribe({
        next: () => {
          this.alertService.exito('Usuario actualizado con éxito.');
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: (err) => this.alertService.error('Error al actualizar: ' + (err.error?.error || err.message)),
      });
      return;
    }

    if (!this.usuarioForm.nombre || !this.usuarioForm.nombreUsuario || !this.usuarioForm.correo || !this.usuarioForm.contrasena || !this.usuarioForm.rolId) {
      this.alertService.advertencia('Completa todos los campos obligatorios.');
      return;
    }

    this.authService
      .registrarUsuario({
        nombre: this.usuarioForm.nombre,
        nombreUsuario: this.usuarioForm.nombreUsuario,
        correo: this.usuarioForm.correo,
        contrasena: this.usuarioForm.contrasena,
        rolId: this.usuarioForm.rolId,
        recibeAlertasStock: this.usuarioForm.recibeAlertasStock,
      })
      .subscribe({
        next: () => {
          this.alertService.exito('Usuario creado con éxito.');
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: (err) => this.alertService.error('Error al crear el usuario: ' + (err.error?.error || err.message)),
      });
  }

  seleccionarParaEditar(usuario: any) {
    this.usuarioForm = {
      id: usuario.Id,
      nombre: usuario.Nombre,
      nombreUsuario: usuario.NombreUsuario,
      correo: usuario.Correo,
      contrasena: '',
      rolId: usuario.RolId,
      activo: usuario.Activo,
      recibeAlertasStock: !!usuario.RecibeAlertasStock,
    };
    this.modoEdicion = true;
    this.mostrarModal = true;
  }

  async alternarActivo(usuario: any) {
    const nuevoEstado = !usuario.Activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    const confirmado = await this.alertService.confirmar(`¿Confirmas ${accion} a ${usuario.Nombre}?`, 'Confirmar acción');
    if (!confirmado) return;

    this.authService
      .actualizarUsuario(usuario.Id, {
        nombre: usuario.Nombre,
        correo: usuario.Correo,
        rolId: usuario.RolId,
        activo: nuevoEstado,
        recibeAlertasStock: !!usuario.RecibeAlertasStock,
      })
      .subscribe({
        next: () => this.cargarUsuarios(),
        error: (err) => this.alertService.error('Error: ' + (err.error?.error || err.message)),
      });
  }

  async forzarLogout(usuario: any) {
    const confirmado = await this.alertService.confirmar(
      `¿Cerrar la sesión de ${usuario.Nombre}? Tendrá que iniciar sesión otra vez.`,
      'Forzar cierre de sesión'
    );
    if (!confirmado) return;

    this.authService.forzarLogoutUsuario(usuario.Id).subscribe({
      next: () => this.alertService.exito('Sesión cerrada. El usuario deberá volver a iniciar sesión.'),
      error: (err) => this.alertService.error('Error: ' + (err.error?.error || err.message)),
    });
  }

  resetFormulario() {
    this.usuarioForm = { id: null, nombre: '', nombreUsuario: '', correo: '', contrasena: '', rolId: null, activo: true, recibeAlertasStock: false };
    this.modoEdicion = false;
  }

  // ===================== ROLES Y PERMISOS =====================

  cargarRolesDetalle() {
    this.authService.listarRolesDetalle().subscribe({
      next: (data) => {
        this.rolesDetalle = data;
        // mantiene la selección tras recargar
        if (this.rolSeleccionado && !this.creandoRol) {
          const actualizado = data.find((r) => r.Id === this.rolSeleccionado.Id);
          if (actualizado) this.rolSeleccionado = actualizado;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar roles', err),
    });
  }

  cargarPermisos() {
    this.authService.listarPermisos().subscribe({
      next: (data) => {
        this.permisos = data;
        this.construirGrupos();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar permisos', err),
    });
  }

  private cap(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  private construirGrupos() {
    const mapa = new Map<string, GrupoPermiso>();
    for (const p of this.permisos) {
      const [mod, acc] = String(p.Codigo).split('.');
      if (!mapa.has(mod)) {
        mapa.set(mod, { clave: mod, label: this.MODULOS[mod] || this.cap(mod), permisos: [] });
      }
      mapa.get(mod)!.permisos.push({
        id: p.Id,
        codigo: p.Codigo,
        accion: acc,
        accionLabel: this.ACCIONES[acc] || this.cap(acc),
      });
    }
    this.gruposPermisos = [...mapa.values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  nuevoRol() {
    this.creandoRol = true;
    this.rolSeleccionado = { Id: null, Nombre: '', EsAdmin: false };
    this.rolNombreEdit = '';
    this.permisoIdsSeleccionados = new Set<number>();
  }

  seleccionarRol(rol: any) {
    this.creandoRol = false;
    this.rolSeleccionado = rol;
    this.rolNombreEdit = rol.Nombre;

    if (rol.EsAdmin) {
      // El admin tiene todo; solo se muestra, no se edita
      this.permisoIdsSeleccionados = new Set<number>(this.permisos.map((p) => p.Id));
      return;
    }

    this.authService.permisosDeRol(rol.Id).subscribe({
      next: (ids) => {
        this.permisoIdsSeleccionados = new Set<number>(ids);
        this.cdr.detectChanges();
      },
      error: (err) => this.alertService.error('Error al cargar permisos del rol: ' + (err.error?.error || err.message)),
    });
  }

  get rolEsAdmin(): boolean {
    return this.rolSeleccionado?.EsAdmin === true;
  }

  tienePermiso(id: number): boolean {
    return this.permisoIdsSeleccionados.has(id);
  }

  togglePermiso(id: number) {
    if (this.rolEsAdmin) return;
    if (this.permisoIdsSeleccionados.has(id)) this.permisoIdsSeleccionados.delete(id);
    else this.permisoIdsSeleccionados.add(id);
  }

  moduloTodos(grupo: GrupoPermiso): boolean {
    return grupo.permisos.every((p) => this.permisoIdsSeleccionados.has(p.id));
  }

  moduloAlgunos(grupo: GrupoPermiso): boolean {
    return !this.moduloTodos(grupo) && grupo.permisos.some((p) => this.permisoIdsSeleccionados.has(p.id));
  }

  toggleModulo(grupo: GrupoPermiso) {
    if (this.rolEsAdmin) return;
    const todos = this.moduloTodos(grupo);
    for (const p of grupo.permisos) {
      if (todos) this.permisoIdsSeleccionados.delete(p.id);
      else this.permisoIdsSeleccionados.add(p.id);
    }
  }

  guardarRol() {
    const nombre = (this.rolNombreEdit || '').trim();
    if (!nombre) {
      this.alertService.advertencia('Ponle un nombre al rol.');
      return;
    }

    const payload = { nombre, permisoIds: [...this.permisoIdsSeleccionados] };
    this.guardandoRol = true;

    const obs = this.creandoRol
      ? this.authService.crearRol(payload)
      : this.authService.actualizarRol(this.rolSeleccionado.Id, payload);

    obs.subscribe({
      next: (res: any) => {
        this.guardandoRol = false;
        this.alertService.exito(res?.mensaje || 'Rol guardado.');
        this.creandoRol = false;
        this.rolSeleccionado = null;
        this.cargarRolesDetalle();
        this.cargarRoles(); // refresca el desplegable del formulario de usuario
      },
      error: (err) => {
        this.guardandoRol = false;
        this.alertService.error('Error al guardar el rol: ' + (err.error?.error || err.message));
      },
    });
  }

  async eliminarRol() {
    if (!this.rolSeleccionado?.Id || this.rolEsAdmin) return;
    const confirmado = await this.alertService.confirmar(
      `¿Eliminar el rol "${this.rolSeleccionado.Nombre}"?`,
      'Eliminar rol'
    );
    if (!confirmado) return;

    this.authService.eliminarRol(this.rolSeleccionado.Id).subscribe({
      next: () => {
        this.alertService.exito('Rol eliminado.');
        this.rolSeleccionado = null;
        this.cargarRolesDetalle();
        this.cargarRoles();
      },
      error: (err) => this.alertService.error('Error al eliminar: ' + (err.error?.error || err.message)),
    });
  }

  cancelarEdicionRol() {
    this.creandoRol = false;
    this.rolSeleccionado = null;
  }
}
