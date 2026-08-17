import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reportes } from './reportes';
import { ReportesRoutingModule } from './reportes-routing-module';

@NgModule({
  declarations: [Reportes],
  imports: [CommonModule, FormsModule, ReportesRoutingModule]
})
export class ReportesModule {}
