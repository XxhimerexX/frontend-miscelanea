import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Reportes } from './reportes';

const routes: Routes = [{ path: '', component: Reportes, data: { title: 'Reportes' } }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportesRoutingModule {}
