import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Nopagefound } from './pages/nopagefound/nopagefound';
import { FacturaTicket } from './pages/factura-ticket/factura-ticket';
import { authGuard } from './guards/auth-guard';
import { permisoGuard, superAdminGuard } from './guards/permiso-guard';
import { Register } from './pages/auth/register/register';
import { Login } from './pages/auth/login/login';
import { Pages } from './pages/pages';
import { Clientes } from './pages/clientes/clientes';

const routes: Routes = [
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
  // Fuera del layout de la app (sin sidebar/header) para que se pueda imprimir
  // el ticket sin que salga la interfaz alrededor.
  { path: 'ticket/:id', component: FacturaTicket, canActivate: [authGuard], data: { title: 'Factura' } },
  {
    path: '',
    component: Pages,
    canActivate: [authGuard], // protege TODAS las rutas hijas de una sola vez
    children: [
      { path: 'dashboard', canActivate: [permisoGuard], data: { permiso: 'dashboard.ver' }, loadChildren: () => import('./pages/dashboard/dashboard-module').then(m => m.DashboardModule) },
      { path: 'pos', canActivate: [permisoGuard], data: { permiso: 'ventas.crear' }, loadChildren: () => import('./pages/pos/pos-module').then(m => m.PosModule) },
      { path: 'inventario', canActivate: [permisoGuard], data: { permiso: 'productos.ver' }, loadChildren: () => import('./pages/inventario/inventario-module').then(m => m.InventarioModule) },
      { path: 'ventas', canActivate: [permisoGuard], data: { permiso: 'ventas.ver' }, loadChildren: () => import('./pages/ventas/ventas-module').then(m => m.VentasModule) },
      { path: 'usuarios', canActivate: [permisoGuard], data: { permiso: 'usuarios.ver' }, loadChildren: () => import('./pages/usuarios/usuarios-module').then(m => m.UsuariosModule) },
      { path: 'proveedores', canActivate: [permisoGuard], data: { permiso: 'proveedores.ver' }, loadChildren: () => import('./pages/proveedores/proveedores-module').then(m => m.ProveedoresModule) },
      { path: 'compras', canActivate: [permisoGuard], data: { permiso: 'compras.ver' }, loadChildren: () => import('./pages/compras/compras-module').then(m => m.ComprasModule) },
      { path: 'devoluciones', canActivate: [permisoGuard], data: { permiso: 'devoluciones.ver' }, loadChildren: () => import('./pages/devoluciones/devoluciones-module').then(m => m.DevolucionesModule) },
      { path: 'reportes', canActivate: [permisoGuard], data: { permiso: 'reportes.ver' }, loadChildren: () => import('./pages/reportes/reportes-module').then(m => m.ReportesModule) },
      { path: 'clientes', canActivate: [permisoGuard], data: { permiso: 'clientes.ver' }, loadChildren: () => import('./pages/clientes/clientes-module').then(m => m.ClientesModule) },
      { path: 'empresas', canActivate: [superAdminGuard], loadChildren: () => import('./pages/empresas/empresas-module').then(m => m.EmpresasModule) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
  { path: '**', component: Nopagefound }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
