import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dashboard } from './dashboard';
import { DashboardRoutingModule } from './dashboard-routing-module';

@NgModule({
  declarations: [Dashboard],
  imports: [CommonModule, FormsModule, DashboardRoutingModule]
})
export class DashboardModule {}
