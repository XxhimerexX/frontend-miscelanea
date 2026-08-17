import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Inventario } from './inventario';
import { InventarioRoutingModule } from './inventario-routing-module';

@NgModule({
  declarations: [Inventario],
  imports: [CommonModule, FormsModule, InventarioRoutingModule]
})
export class InventarioModule {}
