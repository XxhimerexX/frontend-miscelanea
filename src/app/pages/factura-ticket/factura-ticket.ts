import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-factura-ticket',
  standalone: false,
  templateUrl: './factura-ticket.html',
  styleUrl: './factura-ticket.css',
})
export class FacturaTicket {
  @Input() datosFactura: any = null;

  imprimirFactura() {
    window.print();
  }
}
