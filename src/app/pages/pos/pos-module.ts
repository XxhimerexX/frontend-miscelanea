import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pos } from './pos';
import { PosRoutingModule } from './pos-routing-module';

@NgModule({
  declarations: [Pos],
  imports: [CommonModule, FormsModule, PosRoutingModule]
})
export class PosModule {}
