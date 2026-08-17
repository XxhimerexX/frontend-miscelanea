import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Nopagefound } from './pages/nopagefound/nopagefound';
import { FacturaTicket } from './pages/factura-ticket/factura-ticket';
import { authGuard } from './guards/auth-guard';
import { Register } from './pages/auth/register/register';
import { Login } from './pages/auth/login/login';
import { Pages } from './pages/pages';

const routes: Routes = [
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
  {
    path: '',
    component: Pages,
    canActivate: [authGuard], // protege TODAS las rutas hijas de una sola vez
    children: [
      { path: 'dashboard', loadChildren: () => import('./pages/dashboard/dashboard-module').then(m => m.DashboardModule) },
      { path: 'pos', loadChildren: () => import('./pages/pos/pos-module').then(m => m.PosModule) },
      { path: 'inventario', loadChildren: () => import('./pages/inventario/inventario-module').then(m => m.InventarioModule) },
      { path: 'ventas', loadChildren: () => import('./pages/ventas/ventas-module').then(m => m.VentasModule) },
      { path: 'ticket/:id', component: FacturaTicket, data: { title: 'Factura' } },
      { path: 'usuarios', loadChildren: () => import('./pages/usuarios/usuarios-module').then(m => m.UsuariosModule) },
      { path: 'proveedores', loadChildren: () => import('./pages/proveedores/proveedores-module').then(m => m.ProveedoresModule) },
      { path: 'compras', loadChildren: () => import('./pages/compras/compras-module').then(m => m.ComprasModule) },
      { path: 'devoluciones', loadChildren: () => import('./pages/devoluciones/devoluciones-module').then(m => m.DevolucionesModule) },
      { path: 'reportes', loadChildren: () => import('./pages/reportes/reportes-module').then(m => m.ReportesModule) },
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
