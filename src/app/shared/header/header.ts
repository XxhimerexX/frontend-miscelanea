import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auht-services';
import { AlertService } from '../../services/alert-service';
import { MiscelaneaService } from '../../services/miscelanea-service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  cajaAbierta: boolean = false;

  constructor(
    public authService: AuthService,
    private alertService: AlertService,
    private miscelaneaService: MiscelaneaService
  ) {}

  ngOnInit(): void {
    this.miscelaneaService.cajaAbierta$.subscribe((abierta) => this.cajaAbierta = abierta);
  }

  // Bloquea el logout si la caja sigue abierta (misma regla que el sidebar)
  async cerrarSesion() {
    if (this.cajaAbierta) {
      this.alertService.advertencia('No puedes cerrar sesión mientras la caja esté abierta. Debes cerrar el turno primero.');
      return;
    }

    const confirmado = await this.alertService.confirmar('¿Deseas cerrar tu sesión?', 'Cerrar sesión');
    if (confirmado) {
      this.authService.logout();
    }
  }
}
