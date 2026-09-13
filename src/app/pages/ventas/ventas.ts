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

  // Muestra el ticket en una ventana de vista previa con un botón para
  // imprimir — a diferencia del POS (que imprime directo al cobrar), aquí
  // primero se revisa la factura y luego, si hace falta, se reimprime.
  verTicket(id: number) {
    this.miscelaneaService.descargarTicketImagen(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const ventana = window.open('', '_blank');
        if (!ventana) return;
        ventana.document.write(`
          <html>
            <head>
              <title>Ticket</title>
              <style>
                @page { size: 58mm auto; margin: 0; }
                body { margin: 0; padding: 20px; text-align: center; background: #f0f0f0; font-family: sans-serif; }
                img { width: 320px; max-width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
                .btn-imprimir { margin-top: 16px; padding: 10px 28px; font-size: 15px; font-weight: bold;
                  cursor: pointer; border: none; border-radius: 6px; background: #198754; color: #fff; }
                .btn-imprimir:hover { background: #157347; }
                @media print {
                  body { padding: 0; background: #fff; }
                  .btn-imprimir { display: none; }
                  img { width: 48mm; box-shadow: none; }
                }
              </style>
            </head>
            <body>
              <img src="${url}"><br>
              <button class="btn-imprimir" onclick="window.print()">🖨️ Imprimir Ticket</button>
            </body>
          </html>
        `);
        ventana.document.close();
      },
      error: () => this.alertService.error('No se pudo generar el ticket.')
    });
  }
}