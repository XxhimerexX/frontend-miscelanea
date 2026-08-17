import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Devoluciones } from './devoluciones';
import { DevolucionesRoutingModule } from './devoluciones-routing-module';

@NgModule({
  declarations: [Devoluciones],
  imports: [CommonModule, FormsModule, DevolucionesRoutingModule]
})
export class DevolucionesModule {}
