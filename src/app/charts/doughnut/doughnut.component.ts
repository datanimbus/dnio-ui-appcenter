import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';
import * as _ from 'lodash'



@Component({
  selector: 'odp-doughnut',
  templateUrl: './doughnut.component.html',
  styleUrls: ['./doughnut.component.scss']
})
export class Doughnut implements AfterViewInit, OnDestroy, OnChanges, OnInit {
  chart: any;
  chartStyle: any;
  @Input() config: any;
  @Input() label: string;
  @Input() chartTitle: string;
  @Input() labelArray: Array<string>;
  @Input() bgColorArray: Array<string>;
  @Input() dataArray: Array<number>;
  @Input() aspectRatio: number;
  @Input() innerText: string;
  @Input() height: number;
  @Input() width: number;
  @ViewChild('doughnutChart') doughnutChart: ElementRef;
  constructor() { }

  ngOnInit(): void {
    this.chartStyle = {
      height: this.height || 300 + 'px',
      width: this.width || 300 + 'px',
    }
  }
  ngAfterViewInit() {
    this.renderDoughnutChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.doughnutChart && changes.dataArray) {
      this.updateDoughnutChart();
    }
  }
  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  renderDoughnutChart() {
    const doughnutCtx = this.doughnutChart.nativeElement.getContext('2d');
    const data = {
      labels: this.labelArray || ['Red', 'Yellow', 'Blue'],
      datasets: [{
        data: this.dataArray || [300, 50, 100],
        backgroundColor: this.bgColorArray || ['red', 'yellow', 'blue'],
      }],
    };

    const options: any = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title:{
          display: this.chartTitle ? true : false,
          text: this.chartTitle,
          position: 'bottom',
          color: 'black',
          font: {
            size: 14,
            weight: 500,
            fanily: 'Manrope'
          }
        },
        tooltips: {
          enabled: false, 
          callbacks: {
            label: (tooltipItem, data) => {
              const datasetLabel = data.datasets[tooltipItem.datasetIndex].label || '';
              return `${datasetLabel}: ${tooltipItem.yLabel}`;
            },
          },
        },
      }
    }

    const pluginsData = {
      id: doughnutCtx,
      beforeDatasetDraw: (chart, options) => {
        const ctx = chart.ctx;
        const xCor = chart.getDatasetMeta(0)?.data[0]?.x;
        const yCor = chart.getDatasetMeta(0)?.data[0]?.y;
        ctx.font = "14px 'Manrope'";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'
        ctx.fillText(this.innerText || '', xCor, yCor);
      },
    }

    this.chart = new Chart(doughnutCtx, {
      type: 'doughnut',
      data: data,
      options: options,
      plugins: [pluginsData]
    });
  }

  updateDoughnutChart() {
    if (this.chart) {
      // Update the chart with new data
      this.chart.data.datasets[0].data = this.dataArray;
      this.chart.data.labels = this.labelArray;
      this.chart.data.backgroundColor = this.bgColorArray;

      this.chart.update();
    }
  }
}
