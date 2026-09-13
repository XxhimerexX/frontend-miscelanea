import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { AlertService } from './alert-service';

// Cuando se publica una versión nueva, el service worker ya la descargó en
// segundo plano; sin este aviso, el usuario se quedaría viendo la versión
// vieja hasta que cierre y reabra la app por su cuenta.
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  constructor(private swUpdate: SwUpdate, private alertService: AlertService) {}

  iniciar(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((evento): evento is VersionReadyEvent => evento.type === 'VERSION_READY'))
      .subscribe(async () => {
        const confirmado = await this.alertService.confirmar(
          'Hay una versión nueva de la aplicación lista para usar.',
          'Actualización disponible'
        );
        if (confirmado) {
          document.location.reload();
        }
      });

    this.swUpdate.unrecoverable.subscribe(() => {
      this.alertService.advertencia('La aplicación necesita recargarse para seguir funcionando correctamente.');
      document.location.reload();
    });
  }
}
