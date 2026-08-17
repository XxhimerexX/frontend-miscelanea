import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Compras } from './compras';
import { ComprasRoutingModule } from './compras-routing-module';

@NgModule({
  declarations: [Compras],
  imports: [CommonModule, FormsModule, ComprasRoutingModule]
})
export class ComprasModule {}
