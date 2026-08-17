import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Inventario } from './inventario';

const routes: Routes = [{ path: '', component: Inventario, data: { title: 'Inventario' } }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventarioRoutingModule {}
