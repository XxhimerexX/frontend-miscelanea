import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Proveedores } from './proveedores';
import { ProveedoresRoutingModule } from './proveedores-routing-module';

@NgModule({
  declarations: [Proveedores],
  imports: [CommonModule, FormsModule, ProveedoresRoutingModule]
})
export class ProveedoresModule {}
