import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empresas } from './empresas';
import { EmpresasRoutingModule } from './empresas-routing-module';

@NgModule({
  declarations: [Empresas],
  imports: [CommonModule, FormsModule, EmpresasRoutingModule]
})
export class EmpresasModule {}
