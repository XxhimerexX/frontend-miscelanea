import { ChangeDetectorRef, Component } from '@angular/core';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-ventas',
  standalone: false,
  templateUrl: './ventas.html',
  styleUrl: './ventas.css',
})
export class Ventas {
  listaVentas: any[] = [];
  ventaSeleccionada: any = null;

  constructor(public miscelaneaService: MiscelaneaService, private alertService: AlertService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarHistorialVentas();
  }

  // Cargar todas las facturas registradas
  cargarHistorialVentas() {
    this.miscelaneaService.obtenerVentas().subscribe({
      next: (data) => {
        this.listaVentas = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar el historial de ventas', err);
      }
    });
  }

  // Ver el detalle completo de una venta específica
  verDetalleVenta(id: number) {
    this.miscelaneaService.obtenerVentaPorId(id).subscribe({
      next: (data) => {
        this.ventaSeleccionada = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener el detalle de la venta', err);
        this.alertService.error('No se pudo cargar el detalle de la factura.');
      }
    });
  }

  // Anular una venta (opcional si deseas mantener la función de anulación existente)
  async anularVenta(id: number) {
    const confirmado = await this.alertService.confirmar(
      '¿Estás seguro de que deseas anular esta venta? Se restaurará el stock de los productos.',
      'Anular venta'
    );
    if (!confirmado) return;

    this.miscelaneaService.anularVenta(id).subscribe({
      next: (res) => {
        this.alertService.exito('Venta anulada con éxito y stock restaurado.');
        this.cargarHistorialVentas();
        this.ventaSeleccionada = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.alertService.error('Error al anular la venta: ' + (err.error?.error || err.message));
      }
    });
  }

  verTicket(id: number) {
    window.open(`/ticket/${id}`, '_blank');
  }
}
