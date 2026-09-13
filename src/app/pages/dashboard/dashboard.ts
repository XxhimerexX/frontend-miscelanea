import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { MiscelaneaService } from '../../services/miscelanea-service';
import { AuthService } from '../../services/auht-services';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit {
  kpis: any = { ventasHoy: 0, facturasHoy: 0, ventasMes: 0, utilidadMes: 0, ticketPromedioHoy: 0 };
  cajaAbierta: boolean = false;
  productosStockBajoCount: number = 0;
  stockBajo: any[] = [];
  topProductos: any[] = [];
  ultimasVentas: any[] = [];
  metodosHoy: any[] = [];

  filtroPeriodo: string = 'mes';
  fechaInicio: string = '';
  fechaFin: string = '';
  public chart: any;

  // --- Accesos directos personalizables ---
  menuDisponible: any[] = []; // todas las secciones a las que el usuario tiene acceso
  accesos: any[] = []; // las que eligió mostrar
  accesosSel = new Set<string>();
  mostrarModalAccesos: boolean = false;

  constructor(
    private miscelaneaService: MiscelaneaService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    const hoy = new Date();
    const hace6Meses = new Date();
    hace6Meses.setMonth(hoy.getMonth() - 6);
    this.fechaFin = hoy.toISOString().substring(0, 10);
    this.fechaInicio = hace6Meses.toISOString().substring(0, 10);
  }

  ngOnInit(): void {
    this.miscelaneaService.cajaAbierta$.subscribe((abierta) => {
      this.cajaAbierta = abierta;
      this.cdr.detectChanges();
    });
    this.miscelaneaService.refrescarEstadoCaja();

    this.cargarResumen();
    this.cargarMenu();
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.inicializarGrafico();
    this.cargarVentasPeriodo();
  }

  // ===================== RESUMEN =====================

  cargarResumen() {
    this.miscelaneaService.obtenerResumenDashboard().subscribe({
      next: (data) => {
        this.kpis = data.kpis || this.kpis;
        this.productosStockBajoCount = data.productosStockBajo ?? 0;
        this.stockBajo = data.stockBajo || [];
        this.topProductos = data.topProductos || [];
        this.ultimasVentas = data.ultimasVentas || [];
        this.metodosHoy = data.metodosHoy || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar resumen del dashboard', err),
    });
  }

  // ===================== ACCESOS DIRECTOS =====================

  private get claveAccesos(): string {
    const uid = this.authService.obtenerUsuario()?.id ?? 'x';
    return `mp-accesos-${uid}`;
  }

  cargarMenu() {
    this.miscelaneaService.obtenerMenu().subscribe({
      next: (items) => {
        this.menuDisponible = (items || []).filter((i) => i.Ruta && i.Ruta !== 'dashboard');
        this.inicializarAccesos();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar el menú', err),
    });
  }

  private inicializarAccesos() {
    let rutas: string[] = [];
    try {
      rutas = JSON.parse(localStorage.getItem(this.claveAccesos) || '[]');
    } catch {
      rutas = [];
    }
    if (!rutas.length) {
      // Por defecto: las secciones operativas más comunes a las que tenga acceso
      const preferidas = ['pos', 'inventario', 'ventas', 'reportes'];
      rutas = this.menuDisponible.filter((m) => preferidas.includes(m.Ruta)).map((m) => m.Ruta);
      if (!rutas.length) rutas = this.menuDisponible.slice(0, 4).map((m) => m.Ruta);
    }
    this.accesos = rutas
      .map((r) => this.menuDisponible.find((m) => m.Ruta === r))
      .filter(Boolean);
  }

  abrirModalAccesos() {
    this.accesosSel = new Set(this.accesos.map((a) => a.Ruta));
    this.mostrarModalAccesos = true;
  }

  toggleAcceso(ruta: string) {
    if (this.accesosSel.has(ruta)) this.accesosSel.delete(ruta);
    else this.accesosSel.add(ruta);
  }

  guardarAccesos() {
    // conserva el orden del menú
    const rutas = this.menuDisponible.filter((m) => this.accesosSel.has(m.Ruta)).map((m) => m.Ruta);
    try {
      localStorage.setItem(this.claveAccesos, JSON.stringify(rutas));
    } catch {}
    this.accesos = rutas.map((r) => this.menuDisponible.find((m) => m.Ruta === r)).filter(Boolean);
    this.mostrarModalAccesos = false;
  }

  // ===================== GRÁFICO =====================

  inicializarGrafico() {
    const canvas = document.getElementById('ventasChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Ventas',
            data: [],
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,.15)',
            pointBackgroundColor: '#2563eb',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } },
      },
    });
  }

  cargarVentasPeriodo() {
    this.miscelaneaService.obtenerVentasPorPeriodo(this.filtroPeriodo, this.fechaInicio, this.fechaFin).subscribe({
      next: (respuesta) => {
        if (!this.chart) return;
        this.chart.data.labels = respuesta.datos.map((d: any) => d.etiqueta);
        this.chart.data.datasets[0].data = respuesta.datos.map((d: any) => d.total);
        this.chart.update();
      },
      error: (err) => console.error('Error al cargar ventas por periodo', err),
    });
  }

  cambiarFiltroPeriodo() {
    this.cargarVentasPeriodo();
  }
}
