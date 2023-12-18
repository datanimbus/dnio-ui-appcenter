import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
  selector: 'odp-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss']
})

export class BarComponent implements AfterViewInit, OnDestroy, OnChanges, OnInit {
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
  @ViewChild('barChart') barChart: ElementRef;
  constructor() { }

  ngOnInit(): void {
    this.chartStyle = {
      height: this.height || 300 + 'px',
      width: this.width || 300 + 'px',
    }
    this.testData()
  }
  ngAfterViewInit() {
    this.renderDoughnutChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.barChart && changes.dataArray) {
      this.updateDoughnutChart();
    }
  }
  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  renderDoughnutChart() {
    const barCtx = this.barChart.nativeElement.getContext('2d');
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
      id: barCtx,
      // beforeDatasetDraw: (chart, options) => {
      //   const ctx = chart.ctx;
      //   const xCor = chart.getDatasetMeta(0)?.data[0]?.x;
      //   const yCor = chart.getDatasetMeta(0)?.data[0]?.y;
      //   ctx.font = "14px 'Manrope'";
      //   ctx.textAlign = 'center';
      //   ctx.textBaseline = 'middle'
      //   ctx.fillText(this.innerText || '', xCor, yCor);
      // },
    }

    this.chart = new Chart(barCtx, {
      type: 'bar',
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

  testData(){
    this.labelArray = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    this.bgColorArray =  [
      'rgba(255, 99, 132, 0.2)',
      'rgba(255, 159, 64, 0.2)',
      'rgba(255, 205, 86, 0.2)',
      'rgba(75, 192, 192, 0.2)',
      'rgba(54, 162, 235, 0.2)',
      'rgba(153, 102, 255, 0.2)',
      'rgba(201, 203, 207, 0.2)'
    ]
    this.dataArray = [65, 59, 80, 81, 56, 55, 40];
// const data = {
//   labels: labels,
//   datasets: [{
//     label: 'My First Dataset',
//     data: [65, 59, 80, 81, 56, 55, 40],
//     backgroundColor: [
//       'rgba(255, 99, 132, 0.2)',
//       'rgba(255, 159, 64, 0.2)',
//       'rgba(255, 205, 86, 0.2)',
//       'rgba(75, 192, 192, 0.2)',
//       'rgba(54, 162, 235, 0.2)',
//       'rgba(153, 102, 255, 0.2)',
//       'rgba(201, 203, 207, 0.2)'
//     ],
//     borderColor: [
//       'rgb(255, 99, 132)',
//       'rgb(255, 159, 64)',
//       'rgb(255, 205, 86)',
//       'rgb(75, 192, 192)',
//       'rgb(54, 162, 235)',
//       'rgb(153, 102, 255)',
//       'rgb(201, 203, 207)'
//     ],
//     borderWidth: 1
//   }]
// };
  }
}

