import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class MiscelaneaService {
  private apiUrl = environment.apiUrl;

  // Estado de caja compartido por toda la app (sidebar, POS, etc.)
  private cajaAbiertaSubject = new BehaviorSubject<boolean>(false);
  private cajaVerificadaSubject = new BehaviorSubject<boolean>(false);
  private turnoActualSubject = new BehaviorSubject<any>(null);

  cajaAbierta$ = this.cajaAbiertaSubject.asObservable();
  cajaVerificada$ = this.cajaVerificadaSubject.asObservable();
  turnoActual$ = this.turnoActualSubject.asObservable();


  constructor(private http: HttpClient) { }

  // --- PRODUCTOS ---

  // Obtener todos los productos o buscar por término
  obtenerProductos(busqueda: string = ''): Observable<any> {
    const url = busqueda ? `${this.apiUrl}/productos/${busqueda}` : `${this.apiUrl}/productos`;
    return this.http.get<any>(url);
  }

  // Registrar un nuevo producto
  registrarProducto(producto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/productos`, producto);
  }

  // Actualizar un producto existente
  actualizarProducto(id: number, producto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/productos/${id}`, producto);
  }

  // Eliminar un producto
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/productos/${id}`);
  }

  // Inventario en Excel
  descargarInventarioExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/productos/exportar/excel`, { responseType: 'blob' });
  }
  enviarInventarioExcel(para: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/productos/exportar/excel/enviar`, { para });
  }

  // --- IMAGEN DE PRODUCTO ---

  // Sube/reemplaza la imagen (ya reescalada en el navegador). `imagen` es un Blob/File.
  subirImagenProducto(id: number, imagen: Blob): Observable<any> {
    const fd = new FormData();
    fd.append('imagen', imagen, 'producto.jpg');
    return this.http.post<any>(`${this.apiUrl}/productos/${id}/imagen`, fd);
  }

  eliminarImagenProducto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/productos/${id}/imagen`);
  }

  // URL directa para usar en <img src>. Lleva el token en la query porque
  // <img> no puede mandar cabeceras. `v` fuerza recarga tras cambiar la imagen.
  urlImagenProducto(id: number, version?: number | string): string {
    const token = localStorage.getItem('token') || '';
    const v = version != null ? `&v=${version}` : '';
    return `${this.apiUrl}/productos/${id}/imagen?token=${encodeURIComponent(token)}${v}`;
  }

  // --- VENTAS ---

  // Registrar una nueva venta (procesar carrito y descontar stock)
  registrarVenta(datosVenta: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ventas`, datosVenta);
  }

  // Obtener historial de ventas
  obtenerVentas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ventas`);
  }

  // Obtener la lista de categorías para el select del inventario
  obtenerCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categorias`);
  }
  crearCategoria(nombre: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/categorias`, { nombre });
  }

  // --- CONFIGURACIÓN DE CORREO (solo admin) ---
  obtenerConfigCorreo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/configuracion/correo`);
  }
  guardarConfigCorreo(datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/configuracion/correo`, datos);
  }
  probarConfigCorreo(para: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/configuracion/correo/probar`, { para });
  }
  actualizarCategoria(id: number, nombre: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/categorias/${id}`, { nombre });
  }
  eliminarCategoria(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/categorias/${id}`);
  }

  // --- DESCUENTOS / OFERTAS ---
  listarDescuentos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/descuentos`);
  }
  descuentosVigentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/descuentos/vigentes`);
  }
  crearDescuento(datos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/descuentos`, datos);
  }
  actualizarDescuento(id: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/descuentos/${id}`, datos);
  }
  eliminarDescuento(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/descuentos/${id}`);
  }

  // Obtener una venta específica por su ID junto con sus ítems y productos
  obtenerVentaPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ventas/${id}`);
  }

  // Anular una venta por su ID (devuelve stock y elimina factura)
  anularVenta(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/ventas/${id}`);
  }

  // Obtener la URL del PDF para visualizar o descargar la factura en cualquier dispositivo
  obtenerUrlPdfFactura(id: number): string {
    return `${this.apiUrl}/ventas/ticket/${id}`;
  }

  descargarTicketPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/ventas/ticket/${id}`, { responseType: 'blob' });
  }

  // --- CAJA ---



  // Consultar si hay un turno de caja abierto actualmente
  obtenerEstadoCaja(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/caja/estado`);
  }

  // Abrir un nuevo turno de caja
  abrirCaja(datos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/caja/abrir`, datos);
  }

  // Cerrar el turno de caja actual
  cerrarCaja(datos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/caja/cerrar`, datos);
  }

  refrescarEstadoCaja(): void {
    this.obtenerEstadoCaja().subscribe({
      next: (data) => {
        this.cajaAbiertaSubject.next(!!data.abierta);
        this.turnoActualSubject.next(data.turno || null);
        this.cajaVerificadaSubject.next(true);
      },
      error: () => {
        this.cajaAbiertaSubject.next(false);
        this.turnoActualSubject.next(null);
        this.cajaVerificadaSubject.next(true);
      }
    });
  }

  obtenerResumenTurno(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/caja/resumen-turno`);
  }

  // --- DASHBOARD ---

  obtenerResumenDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/resumen`);
  }

  obtenerVentasPorPeriodo(periodo: string, fechaInicio: string, fechaFin: string): Observable<any> {
    const params = { periodo, fechaInicio, fechaFin };
    return this.http.get<any>(`${this.apiUrl}/dashboard/ventas-periodo`, { params });
  }

  // --- REPORTES ---

  obtenerReporteVentasPeriodo(periodo: string, fechaInicio: string, fechaFin: string): Observable<any> {
    const params = { periodo, fechaInicio, fechaFin };
    return this.http.get<any>(`${this.apiUrl}/reportes/ventas-periodo`, { params });
  }

  obtenerReporteVentasProductos(fechaInicio: string, fechaFin: string, agruparPor: string): Observable<any> {
    const params = { fechaInicio, fechaFin, agruparPor };
    return this.http.get<any>(`${this.apiUrl}/reportes/ventas-productos`, { params });
  }

  obtenerReporteMargenes(fechaInicio: string, fechaFin: string, agruparPor: string): Observable<any> {
    const params = { fechaInicio, fechaFin, agruparPor };
    return this.http.get<any>(`${this.apiUrl}/reportes/margenes`, { params });
  }

  obtenerReporteKardex(productoId: number, fechaInicio: string, fechaFin: string): Observable<any> {
    const params = { fechaInicio, fechaFin };
    return this.http.get<any>(`${this.apiUrl}/reportes/kardex/${productoId}`, { params });
  }

  obtenerReporteStockBajo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reportes/stock-bajo`);
  }

  obtenerReporteBajaRotacion(dias: number): Observable<any> {
    const params = { dias: String(dias) };
    return this.http.get<any>(`${this.apiUrl}/reportes/baja-rotacion`, { params });
  }

  // --- Reportes de administración (genéricos + Excel) ---
  listarReportesAdmin(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reportes/admin`);
  }
  obtenerReporteAdmin(tipo: string, params: Record<string, string>): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reportes/admin/${tipo}`, { params });
  }
  descargarReporteAdminExcel(tipo: string, params: Record<string, string>): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reportes/admin/${tipo}/excel`, { params, responseType: 'blob' });
  }

  // --- MENÚ ---

  obtenerMenu(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/menu`);
  }

  // --- PROVEEDORES ---

  obtenerProveedores(soloActivos: boolean = false): Observable<any[]> {
    const params: Record<string, string> = {};
    if (soloActivos) params['activos'] = 'true';
    return this.http.get<any[]>(`${this.apiUrl}/proveedores`, { params });
  }

  obtenerProveedorPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/proveedores/${id}`);
  }

  registrarProveedor(proveedor: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/proveedores`, proveedor);
  }

  actualizarProveedor(id: number, proveedor: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/proveedores/${id}`, proveedor);
  }

  cambiarEstadoProveedor(id: number, activo: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/proveedores/${id}/estado`, { activo });
  }

  // --- COMPRAS (ÓRDENES DE COMPRA) ---

  obtenerOrdenesCompra(estado: string = ''): Observable<any[]> {
    const params: Record<string, string> = {};
    if (estado) params['estado'] = estado;
    return this.http.get<any[]>(`${this.apiUrl}/compras`, { params });
  }

  obtenerOrdenCompraPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/compras/${id}`);
  }

  registrarOrdenCompra(orden: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/compras`, orden);
  }

  cancelarOrdenCompra(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/compras/${id}`);
  }

  recibirOrdenCompra(id: number, datosRecepcion: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/compras/${id}/recibir`, datosRecepcion);
  }

  // --- DEVOLUCIONES Y GARANTÍAS ---

  buscarVentaParaDevolucion(numeroFactura: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/devoluciones/buscar-venta/${numeroFactura}`);
  }

  registrarDevolucion(devolucion: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/devoluciones`, devolucion);
  }

  obtenerDevoluciones(filtros: { estado?: string; motivo?: string; fechaInicio?: string; fechaFin?: string } = {}): Observable<any[]> {
    const params: Record<string, string> = {};
    if (filtros.estado) params['estado'] = filtros.estado;
    if (filtros.motivo) params['motivo'] = filtros.motivo;
    if (filtros.fechaInicio) params['fechaInicio'] = filtros.fechaInicio;
    if (filtros.fechaFin) params['fechaFin'] = filtros.fechaFin;
    return this.http.get<any[]>(`${this.apiUrl}/devoluciones`, { params });
  }

  obtenerDevolucionPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/devoluciones/${id}`);
  }

  autorizarDevolucion(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/devoluciones/${id}/autorizar`, {});
  }

  rechazarDevolucion(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/devoluciones/${id}/rechazar`, {});
  }


  descargarOrdenCompraPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/compras/${id}/pdf`, { responseType: 'blob' });
  }

  
asociarProductosProveedor(proveedorId: number, productoIds: number[]): Observable<any> {
  return this.http.put(`${this.apiUrl}/proveedores/${proveedorId}/productos`, { productoIds });
}
 
obtenerProductosDeProveedor(proveedorId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/proveedores/${proveedorId}/productos`);
}
 
subirDocumentoProveedor(proveedorId: number, archivo: File, tipoDocumento: string): Observable<any> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('tipoDocumento', tipoDocumento);
  return this.http.post(`${this.apiUrl}/proveedores/${proveedorId}/documentos`, formData);
}
 
listarDocumentosProveedor(proveedorId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/proveedores/${proveedorId}/documentos`);
}
 
descargarDocumentoProveedor(documentoId: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/proveedores/documentos/${documentoId}/descargar`, { responseType: 'blob' });
}
 
eliminarDocumentoProveedor(documentoId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/proveedores/documentos/${documentoId}`);
}

// --- Tipos de documento de proveedor (catálogo editable) ---
listarTiposDocumentoProveedor(soloActivos: boolean = false): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/proveedores/tipos-documento${soloActivos ? '?activos=true' : ''}`);
}
crearTipoDocumentoProveedor(nombre: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/proveedores/tipos-documento`, { nombre });
}
actualizarTipoDocumentoProveedor(id: number, datos: { nombre: string; activo: boolean }): Observable<any> {
  return this.http.put(`${this.apiUrl}/proveedores/tipos-documento/${id}`, datos);
}
eliminarTipoDocumentoProveedor(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/proveedores/tipos-documento/${id}`);
}

obtenerClientes(soloActivos: boolean = false): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/clientes${soloActivos ? '?activos=true' : ''}`);
}
 
obtenerClientePorId(id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/clientes/${id}`);
}
 
registrarCliente(datos: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/clientes`, datos);
}
 
actualizarCliente(id: number, datos: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/clientes/${id}`, datos);
}
 
cambiarEstadoCliente(id: number, activo: boolean): Observable<any> {
  return this.http.patch(`${this.apiUrl}/clientes/${id}/estado`, { activo });
}

descargarTicketImagen(id: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/ventas/${id}/ticket-imagen`, { responseType: 'blob' });
}

}



