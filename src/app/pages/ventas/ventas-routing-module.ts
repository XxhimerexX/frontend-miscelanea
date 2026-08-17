import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Ventas } from './ventas';

const routes: Routes = [{ path: '', component: Ventas, data: { title: 'Historial de Ventas' } }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VentasRoutingModule {}
