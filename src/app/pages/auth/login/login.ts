import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from '../../../services/auht-services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  correo: string = '';
  contrasena: string = '';
  cargando: boolean = false;
  errorMensaje: string = '';

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  iniciarSesion() {
    if (!this.correo || !this.contrasena) {
      this.errorMensaje = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    this.authService.login(this.correo, this.contrasena).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje = err.error?.error || 'Error al iniciar sesión.';
        this.cdr.detectChanges();
      }
    });
  }
}
