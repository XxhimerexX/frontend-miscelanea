import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Clientes } from './clientes';
 
const routes: Routes = [{ path: '', component: Clientes }];
 
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientesRoutingModule {}