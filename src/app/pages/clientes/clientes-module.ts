import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Clientes } from './clientes';
import { ClientesRoutingModule } from './clientes-routing-module';
 
@NgModule({
  declarations: [Clientes],
  imports: [CommonModule, FormsModule, ClientesRoutingModule]
})
export class ClientesModule {}
 