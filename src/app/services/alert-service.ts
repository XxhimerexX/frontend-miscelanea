import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {

  exito(mensaje: string, titulo: string = '¡Listo!'): void {
    Swal.fire({ icon: 'success', title: titulo, html: this.conSaltos(mensaje) });
  }

  error(mensaje: string, titulo: string = 'Error'): void {
    Swal.fire({ icon: 'error', title: titulo, html: this.conSaltos(mensaje) });
  }

  advertencia(mensaje: string, titulo: string = 'Atención'): void {
    Swal.fire({ icon: 'warning', title: titulo, html: this.conSaltos(mensaje) });
  }

  confirmar(mensaje: string, titulo: string = '¿Estás seguro?'): Promise<boolean> {
    return Swal.fire({
      icon: 'question',
      title: titulo,
      html: this.conSaltos(mensaje),
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((r) => r.isConfirmed);
  }

  private conSaltos(mensaje: string): string {
    return mensaje.replace(/\n/g, '<br>');
  }
}
