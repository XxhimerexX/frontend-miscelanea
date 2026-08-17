import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Compras } from './compras';

const routes: Routes = [{ path: '', component: Compras, data: { title: 'Compras' } }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComprasRoutingModule {}
