import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auht-services';
import { PlataformaService } from '../../../services/plataforma-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  usuario: string = '';
  contrasena: string = '';
  cargando: boolean = false;
  errorMensaje: string = '';

  // --- Selección de empresa (solo si el usuario pertenece a varias) ---
  mostrarSeleccionEmpresa: boolean = false;
  empresasDisponibles: any[] = [];
  permiteSuperAdmin: boolean = false;
  private preToken: string = '';

  // --- Branding de la plataforma (una sola pantalla de login para todas las empresas) ---
  nombreApp: string = 'Miscelánea POS';
  imagenLoginUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private plataformaService: PlataformaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.plataformaService.obtenerBranding().subscribe({
      next: (branding) => {
        this.nombreApp = branding?.nombrePlataforma || 'Miscelánea POS';
        this.imagenLoginUrl = branding?.tieneImagenLogin ? this.plataformaService.imagenLoginUrl() : null;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  iniciarSesion() {
    if (!this.usuario || !this.contrasena) {
      this.errorMensaje = 'Ingresa tu usuario y contraseña.';
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    this.authService.login(this.usuario, this.contrasena).subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res?.requiereSeleccion) {
          this.preToken = res.preToken;
          this.empresasDisponibles = res.empresas || [];
          this.permiteSuperAdmin = !!res.permiteSuperAdmin;
          this.mostrarSeleccionEmpresa = true;
          this.cdr.detectChanges();
          return;
        }
        this.irSegunSesion();
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje = err.error?.error || 'Error al iniciar sesión.';
        this.cdr.detectChanges();
      },
    });
  }

  elegirEmpresa(empresaId: number) {
    this.cargando = true;
    this.authService.seleccionarEmpresa(this.preToken, empresaId).subscribe({
      next: () => {
        this.cargando = false;
        this.irSegunSesion();
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje = err.error?.error || 'No se pudo entrar a esa empresa.';
        this.cdr.detectChanges();
      },
    });
  }

  elegirModoSuperAdmin() {
    this.cargando = true;
    this.authService.seleccionarEmpresa(this.preToken, null, true).subscribe({
      next: () => {
        this.cargando = false;
        this.irSegunSesion();
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje = err.error?.error || 'No se pudo entrar en modo superadministrador.';
        this.cdr.detectChanges();
      },
    });
  }

  volverALogin() {
    this.mostrarSeleccionEmpresa = false;
    this.contrasena = '';
    this.errorMensaje = '';
  }

  // El modo superadministrador (sin empresa activa) solo tiene sentido en /empresas.
  private irSegunSesion() {
    if (this.authService.esSuperAdmin() && !this.authService.empresaActual()) {
      this.router.navigate(['/empresas']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
