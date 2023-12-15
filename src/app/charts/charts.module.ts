import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Doughnut } from './doughnut/doughnut.component';



@NgModule({
  declarations: [
    Doughnut
  ],
  imports: [
    CommonModule
  ],
  exports: [
    Doughnut
  ]
})
export class ChartsModule { }
