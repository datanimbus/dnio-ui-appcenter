import { Component, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  chartIds: Array<string> = [];
  generateUUID() {
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestampString = Date.now().toString(36).substring(2);
    return `${timestampString}-${randomString}`;
  }

  getId() {
    let id = this.generateUUID();
    if (this.chartIds.includes(id)) {
      id = this.generateUUID()
    } else {
      return id
    }
  }
}