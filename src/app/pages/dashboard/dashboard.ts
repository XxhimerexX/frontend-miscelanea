import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { MiscelaneaService } from '../../services/miscelanea-service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit {
  totalVentasDia: number = 0;
  productosStockBajo: number = 0;
  cajaAbierta: boolean = false;

  filtroPeriodo: string = 'mes';
  fechaInicio: string = '';
  fechaFin: string = '';

  public chart: any;

  constructor(private miscelaneaService: MiscelaneaService, private cdr: ChangeDetectorRef) {
    const hoy = new Date();
    const hace6Meses = new Date();
    hace6Meses.setMonth(hoy.getMonth() - 6);
    this.fechaFin = hoy.toISOString().substring(0, 10);
    this.fechaInicio = hace6Meses.toISOString().substring(0, 10);
  }

  ngOnInit(): void {
    // Usa el estado de caja COMPARTIDO en toda la app, no una copia propia
    this.miscelaneaService.cajaAbierta$.subscribe((abierta) => {
      this.cajaAbierta = abierta;
      this.cdr.detectChanges();
    });
    this.miscelaneaService.refrescarEstadoCaja();

    this.cargarResumen();
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.inicializarGrafico();
    this.cargarVentasPeriodo();
  }

  cargarResumen() {
    this.miscelaneaService.obtenerResumenDashboard().subscribe({
      next: (data) => {
        this.totalVentasDia = data.totalVentasDia;
        this.productosStockBajo = data.productosStockBajo;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar resumen del dashboard', err)
    });
  }

  inicializarGrafico() {
    const canvas = document.getElementById('ventasChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Ventas ($)',
          data: [],
          backgroundColor: 'rgba(97, 91, 216, 0.7)',
          borderColor: 'rgba(97, 91, 216, 1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  cargarVentasPeriodo() {
    this.miscelaneaService.obtenerVentasPorPeriodo(this.filtroPeriodo, this.fechaInicio, this.fechaFin).subscribe({
      next: (respuesta) => {
        this.chart.data.labels = respuesta.datos.map((d: any) => d.etiqueta);
        this.chart.data.datasets[0].data = respuesta.datos.map((d: any) => d.total);
        this.chart.update();
      },
      error: (err) => console.error('Error al cargar ventas por periodo', err)
    });
  }

  cambiarFiltroPeriodo() {
    this.cargarVentasPeriodo();
  }
}