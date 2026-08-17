import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Devoluciones } from './devoluciones';

const routes: Routes = [{ path: '', component: Devoluciones, data: { title: 'Devoluciones y Garantías' } }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DevolucionesRoutingModule {}
