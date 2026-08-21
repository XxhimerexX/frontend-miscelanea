import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { MiscelaneaService } from '../../services/miscelanea-service';

Chart.register(...registerables);

type TabReporte = 'periodo' | 'productos' | 'margenes' | 'kardex' | 'stock';

@Component({
  selector: 'app-reportes',
  standalone: false,
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  tabActiva: TabReporte = 'periodo';

  // --- Rango de fechas compartido ---
  fechaInicio: string = '';
  fechaFin: string = '';

  // --- Ventas por período ---
  filtroPeriodo: 'dia' | 'semana' | 'mes' = 'dia';
  datosPeriodo: any[] = [];
  chartPeriodo: any;

  // --- Ventas por producto/categoría ---
  agruparProductos: 'producto' | 'categoria' = 'producto';
  datosProductos: any[] = [];
  chartProductos: any;

  // --- Márgenes de ganancia ---
  agruparMargenes: 'producto' | 'categoria' = 'producto';
  datosMargenes: any[] = [];

  // --- Kardex ---
  listaProductos: any[] = [];
  productoKardexId: number | null = null;
  datosKardex: any[] = [];

  // --- Stock bajo / baja rotación ---
  datosStockBajo: any[] = [];
  datosBajaRotacion: any[] = [];
  diasBajaRotacion: number = 30;

  constructor(private miscelaneaService: MiscelaneaService, private cdr: ChangeDetectorRef) {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    this.fechaFin = hoy.toISOString().substring(0, 10);
    this.fechaInicio = hace30Dias.toISOString().substring(0, 10);
  }

  ngOnInit(): void {
    this.miscelaneaService.obtenerProductos().subscribe({
      next: (data) => {
        this.listaProductos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar productos', err),
    });
    this.cambiarTab('periodo');
  }

  // --- Navegación de pestañas ---
  cambiarTab(tab: TabReporte): void {
    this.tabActiva = tab;
    this.cdr.detectChanges();

    if (tab === 'periodo') this.cargarVentasPeriodo();
    else if (tab === 'productos') this.cargarVentasProductos();
    else if (tab === 'margenes') this.cargarMargenes();
    else if (tab === 'kardex' && this.productoKardexId) this.cargarKardex();
    else if (tab === 'stock') {
      this.cargarStockBajo();
      this.cargarBajaRotacion();
    }
  }

  // --- Atajos de fecha ---
  aplicarRangoHoy(): void {
    const hoy = new Date().toISOString().substring(0, 10);
    this.fechaInicio = hoy;
    this.fechaFin = hoy;
    this.recargarTabActiva();
  }

  aplicarRangoSemana(): void {
    const hoy = new Date();
    const hace7Dias = new Date();
    hace7Dias.setDate(hoy.getDate() - 7);
    this.fechaFin = hoy.toISOString().substring(0, 10);
    this.fechaInicio = hace7Dias.toISOString().substring(0, 10);
    this.recargarTabActiva();
  }

  aplicarRangoMes(): void {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    this.fechaFin = hoy.toISOString().substring(0, 10);
    this.fechaInicio = hace30Dias.toISOString().substring(0, 10);
    this.recargarTabActiva();
  }

  recargarTabActiva(): void {
    if (this.tabActiva === 'periodo') this.cargarVentasPeriodo();
    else if (this.tabActiva === 'productos') this.cargarVentasProductos();
    else if (this.tabActiva === 'margenes') this.cargarMargenes();
    else if (this.tabActiva === 'kardex' && this.productoKardexId) this.cargarKardex();
  }

  // --- Ventas por período ---
  cargarVentasPeriodo(): void {
    this.miscelaneaService.obtenerReporteVentasPeriodo(this.filtroPeriodo, this.fechaInicio, this.fechaFin).subscribe({
      next: (respuesta) => {
        this.datosPeriodo = respuesta.datos;
        this.actualizarChartPeriodo();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar ventas por período', err),
    });
  }

  get totalVendidoPeriodo(): number {
    return this.datosPeriodo.reduce((acc, d) => acc + Number(d.totalVendido), 0);
  }

  get facturasPeriodo(): number {
    return this.datosPeriodo.reduce((acc, d) => acc + Number(d.numFacturas), 0);
  }

  get ticketPromedioPeriodo(): number {
    return this.facturasPeriodo > 0 ? this.totalVendidoPeriodo / this.facturasPeriodo : 0;
  }

  actualizarChartPeriodo(): void {
    const canvas = document.getElementById('chartVentasPeriodo') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartPeriodo) {
      this.chartPeriodo.destroy();
    }

    this.chartPeriodo = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.datosPeriodo.map((d) => d.etiqueta),
        datasets: [
          {
            label: 'Total vendido ($)',
            data: this.datosPeriodo.map((d) => d.totalVendido),
            backgroundColor: 'rgba(97, 91, 216, 0.7)',
            borderColor: 'rgba(97, 91, 216, 1)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  // --- Ventas por producto/categoría ---
  cargarVentasProductos(): void {
    this.miscelaneaService
      .obtenerReporteVentasProductos(this.fechaInicio, this.fechaFin, this.agruparProductos)
      .subscribe({
        next: (respuesta) => {
          this.datosProductos = respuesta.datos;
          this.actualizarChartProductos();
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al cargar ventas por producto/categoría', err),
      });
  }

  actualizarChartProductos(): void {
    const canvas = document.getElementById('chartVentasProductos') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartProductos) {
      this.chartProductos.destroy();
    }

    const top10 = this.datosProductos.slice(0, 10);
    this.chartProductos = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: top10.map((d) => d.Producto || d.Categoria),
        datasets: [
          {
            label: 'Total vendido ($)',
            data: top10.map((d) => d.TotalVendido),
            backgroundColor: 'rgba(40, 167, 105, 0.7)',
            borderColor: 'rgba(40, 167, 105, 1)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  // --- Márgenes ---
  cargarMargenes(): void {
    this.miscelaneaService.obtenerReporteMargenes(this.fechaInicio, this.fechaFin, this.agruparMargenes).subscribe({
      next: (respuesta) => {
        this.datosMargenes = respuesta.datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar márgenes de ganancia', err),
    });
  }

  // --- Kardex ---
  cargarKardex(): void {
    if (!this.productoKardexId) return;
    this.miscelaneaService.obtenerReporteKardex(this.productoKardexId, this.fechaInicio, this.fechaFin).subscribe({
      next: (respuesta) => {
        this.datosKardex = respuesta.datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar kardex', err),
    });
  }

  // --- Stock bajo / baja rotación ---
  cargarStockBajo(): void {
    this.miscelaneaService.obtenerReporteStockBajo().subscribe({
      next: (respuesta) => {
        this.datosStockBajo = respuesta.datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar stock bajo', err),
    });
  }

  cargarBajaRotacion(): void {
    this.miscelaneaService.obtenerReporteBajaRotacion(this.diasBajaRotacion).subscribe({
      next: (respuesta) => {
        this.datosBajaRotacion = respuesta.datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar baja rotación', err),
    });
  }
}
