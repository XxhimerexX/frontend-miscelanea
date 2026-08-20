import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MiscelaneaService } from '../../services/miscelanea-service';

@Component({
  selector: 'app-factura-ticket',
  standalone: false,
  templateUrl: './factura-ticket.html',
  styleUrl: './factura-ticket.css',
})
export class FacturaTicket implements OnInit {
  datosFactura: any = null;
  cargando: boolean = true;
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private miscelaneaService: MiscelaneaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.cargando = false;
      this.error = true;
      this.cdr.detectChanges();
      return;
    }

    this.miscelaneaService.obtenerVentaPorId(id).subscribe({
      next: (data) => {
        this.datosFactura = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar la factura para el ticket', err);
        this.cargando = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  imprimirFactura() {
    window.print();
  }

  // Formatea un número como pesos colombianos: punto como separador de miles,
  // sin decimales (ej. 24501 -> "24.501").
  formatearPesos(valor: number): string {
    return Math.round(valor || 0).toLocaleString('es-CO');
  }
}
