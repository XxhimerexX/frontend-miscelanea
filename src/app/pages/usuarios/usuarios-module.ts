import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuarios } from './usuarios';
import { UsuariosRoutingModule } from './usuarios-routing-module';

@NgModule({
  declarations: [Usuarios],
  imports: [CommonModule, FormsModule, UsuariosRoutingModule]
})
export class UsuariosModule {}
