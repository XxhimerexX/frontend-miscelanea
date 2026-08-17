import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Pos } from './pos';

const routes: Routes = [{ path: '', component: Pos, data: { title: 'Punto de Venta' } }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PosRoutingModule {}
