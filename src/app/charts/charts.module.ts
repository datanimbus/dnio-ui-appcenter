import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Doughnut } from './doughnut/doughnut.component';
import { BarComponent } from './bar/bar.component';



@NgModule({
  declarations: [
    Doughnut,
    BarComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    Doughnut,
    BarComponent
  ]
})
export class ChartsModule { }
