import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams, IAfterGuiAttachedParams } from 'ag-grid-community';
import * as moment from 'moment';

@Component({
  selector: 'odp-interaction-grid-cell',
  templateUrl: './interaction-grid-cell.component.html',
  styleUrls: ['./interaction-grid-cell.component.scss']
})
export class InteractionGridCellComponent implements OnInit, ICellRendererAngularComp {

  params: any;
  data: any;
  id: string;
  value: any;
  rawValue: any;
  field: string;
  direction: string;
  styleClass: string;
  // inputType: string;
  // outputType: string;
  reDownloadAvaiable: boolean;
  constructor() {
    this.styleClass = 'text-muted';
  }

  ngOnInit(): void {
  }

  agInit(params: ICellRendererParams): void {
    const self = this;
    self.params = params;
    self.field = params.colDef.field;
    self.data = params.data || {};
    self.id = self.data._id;
    self.value = params.value;
    if (self.data && self.data.flowData) {
      self.direction = self.data.flowData.direction;
      if (!self.direction) {
        self.direction = 'Inbound';
      }
      if (self.data.redownloadMeta && self.data.status === 'ERROR') {
        self.reDownloadAvaiable = true;
      }
      self.rawValue = self.value;
      // self.inputType = self.data.flowData.inputType;
      // self.outputType = self.data.flowData.outputType;
      if (self.field === 'flowData.inputType') {
        self.value = self.inputType + '-' + self.outputType;
      } else if (self.field === 'duration') {
        self.value = '...';
        self.calculateDuration();
      } else if (self.field === 'status') {
        self.calculateStatus();
      }
    }
  }

  calculateDuration() {
    const self = this;
    let createdTime;
    let completedTime;
    if (self.data.createTimestamp) {
      createdTime = new Date(self.data.createTimestamp).getTime();
    }
    if (self.data.completedTimestamp) {
      completedTime = new Date(self.data.completedTimestamp).getTime();
    }
    if (createdTime && completedTime) {
      const interval = Math.abs(completedTime - createdTime);
      const duration = moment.duration(interval);
      self.value = duration.minutes() + ' min, ' + duration.seconds() + ' sec, ' + duration.milliseconds() + ' ms';
      if (duration.hours() > 0) {
        self.value = `${duration.hours()} hr, ` + self.value;
      }
    }
  }

  calculateStatus() {
    if (Array.isArray(this.rawValue)) {
      if (this.rawValue.indexOf('SUCCESS') > -1) {
        this.value = 'Successful';
        this.styleClass = 'text-success';
      } else if (this.rawValue.indexOf('ERROR') > -1) {
        this.value = 'Failed';
        this.styleClass = 'text-danger';
      } else if (this.rawValue.indexOf('UNKNOWN') > -1) {
        this.value = 'Unknown';
        this.styleClass = 'text-warning';
      } else if (this.rawValue.indexOf('PENDING') > -1) {
        this.value = 'Pending';
        this.styleClass = 'text-warning';
      } else if (this.rawValue.indexOf('QUEUED') > -1) {
        this.value = 'Queued';
        this.styleClass = 'text-queued';
      }
    } else {
      switch (this.rawValue) {
        case 'SUCCESS':
          this.value = 'Successful';
          this.styleClass = 'text-success';
          break;
        case 'ERROR':
          this.value = 'Failed';
          this.styleClass = 'text-danger';
          break;
        case 'PENDING':
          this.value = 'Pending';
          this.styleClass = 'text-warning';
          break;
        case 'QUEUED':
          this.value = 'Queued';
          this.styleClass = 'text-queued';
          break;
        case 'UNKNOWN':
          this.value = 'Unknown';
          this.styleClass = 'text-warning';
          break;
        default:
          this.rawValue = 'QUEUED';
          this.value = 'Queued';
          this.styleClass = 'text-queued';
      }
    }
  }

  refresh(params: any): boolean {
    const self = this;
    return true;
  }

  afterGuiAttached(params?: IAfterGuiAttachedParams): void {
    const self = this;
  }

  get inputType() {
    const self = this;
    if (self.data && self.data.flowData) {
      return self.data.flowData.inputType;
    }
  }

  get outputType() {
    const self = this;
    if (self.data && self.data.flowData) {
      return self.data.flowData.outputType;
    }
  }

  get showCompletionTime() {
    const self = this;
    if (self.data && (self.data.status === 'ERROR' || self.data.status === 'SUCCESS')) {
      return true;
    }
    return false;
  }
}
