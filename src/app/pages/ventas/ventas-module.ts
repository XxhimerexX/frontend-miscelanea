import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ventas } from './ventas';
import { VentasRoutingModule } from './ventas-routing-module';

@NgModule({
  declarations: [Ventas],
  imports: [CommonModule, FormsModule, VentasRoutingModule]
})
export class VentasModule {}
