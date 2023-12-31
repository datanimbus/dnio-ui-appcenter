import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { Observable, Subject, merge, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { NgbModal, NgbModalRef, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';

import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { FilterModel } from './search-for/search-for-field/search-for-field.component';
import { SessionService } from 'src/app/service/session.service';
// import { ListAgGridService } from '../list-ag-grid/list-ag-grid.service';
import * as _ from 'lodash'
import { FlowsInteractionService } from '../flows-interaction.service';

interface FilterData {
  _id?: string;
  serviceId: string;
  name: string;
  private?: boolean;
  value: string;
  app: string;
  createdBy: string;
  type: string;
  hasOptions?: boolean;
}

interface ColFilter {
  colOrder?: [{ fieldName: any, index: number }];
  searchForQuery?: string;
  sortOrder?: [{ fieldName: any, sortType: any }];
}

@Component({
  selector: 'odp-flows-filters',
  templateUrl: './flows-filters.component.html',
  styleUrls: ['./flows-filters.component.scss']
})

export class FlowsFiltersComponent implements OnInit {
  @ViewChild('inputInstance', { static: false }) inputInstance: NgbTypeahead;
  @ViewChild('confirmDeleteModal', { static: false }) confirmDeleteModal: TemplateRef<HTMLElement>;
  @ViewChild('filtereModal', { static: false }) filtereModal: TemplateRef<HTMLElement>;
  @Input() allColumns: any;
  @Input() allFilters: any;
  @Input() appliedFilter: any;
  @Output() refine: EventEmitter<any>;
  @Output() filterCleared: EventEmitter<boolean>;

  name: string;
  confirmDeleteModalRef: NgbModalRef;
  filterModalRef: NgbModalRef;
  queryObject: any;
  selectedColOrder: Array<any>;
  sortingColumns: Array<any>;
  trackIndex: number;
  filterPayload:any= {};
  invalidFilterName: boolean;
  showSaveDiv: boolean;
  placeHolderText: string;
  showFilterList: boolean;
  filterId: string;
  filterCreatedBy: string;
  saveOrEditText: string;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  deleteModal: {
    title: string,
    message: string
  };
  filterModel: Array<FilterModel>;
  noFilterObject: boolean;
  filterApplied$: Subscription;
  showSeparateCreateBtn: boolean;
  hasOptions = true;
  showColumnsWindow: boolean;
  searchTerm: string;
  constructor(private ts: ToastrService,
    private appService: AppService,
    private modalService: NgbModal,
    private commonService: CommonService,
    private flowsService: FlowsInteractionService,
    private sessionService: SessionService) {
    const self = this;
    self.allColumns = [];
    self.allFilters = [];
    self.filterModel = [];
    self.selectedColOrder = [];
    self.sortingColumns = [];
    self.trackIndex = 0;
    self.refine = new EventEmitter<any>();
    self.queryObject = {
      select: null,
      filter: null,
      sort: '-_metadata.createdAt'
    };
    self.filterPayload = {
      serviceId: self.appService.serviceId,
      name: '',
      private: true,
      value: '',
      app: self.commonService.app._id,
      createdBy: self.sessionService.getUser(true)._id,
      type: 'dataService'
    };
    self.invalidFilterName = false;
    self.showSaveDiv = false;
    self.placeHolderText = 'Select Filter';
    self.showFilterList = false;
    self.filterId = null;
    self.saveOrEditText = '+Save As New View';
    self.showSeparateCreateBtn = false;
    self.deleteModal = {
      title: 'Delete column',
      message: 'Are you sure you want to delete this column?'
    };
    self.filterCleared = new EventEmitter<boolean>();
  }

  ngOnInit() {
    const self = this;
    if (self.appService.completeFilterModel) {
      const model = self.appService.completeFilterModel
      this.queryObject['filter'] = model.filter && model.filter['$and']?.map(ele => {
        return this.procesFilter(ele)
      })
      this.queryObject['select'] = model.select
      this.queryObject['sort'] = model.sort;
      this.filterModel = this.queryObject['filter']
    }
    if (self.appService.existingFilter) {
      setTimeout(() => {
        self.selectFilter(self.appService.existingFilter);
      }, 400);
    } else {
      self.placeHolderText = 'Select Filter';
    }
    self.filterApplied$ = self.appService.filterApplied.subscribe(() => {
      self.selectFilter(self.appService.existingFilter);
    });
    if (self.allColumns && self.allColumns.length > 0) {
      const index = self.allColumns.findIndex(e => e.key === '_checkbox');
      if (index > -1) {
        self.allColumns.splice(index, 1);
      }
    }
    this.selectedColOrder = _.cloneDeep(this.allColumns);


    this.flowsService.filterSubject.subscribe(data => {
      this.clearFilter(true);
    })
  }

  search = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.inputInstance.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map(term => (term === '' ? this.allColumns
        : this.allColumns.filter(v => v.key.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 10))
    );
  }

  formatter = (x: any) => x.properties.label ? x.properties.label : x.properties.name

  selectItem(val: any) {
    const self = this;
    const index = self.selectedColOrder.findIndex(e => e.key === val.key);
    if (index === -1) {
      self.selectedColOrder.push(val);
    } else {
      this.removeItem(index);
    }
    self.name = '';
  }

  removeAllItems() {
    this.selectedColOrder = []
  }

  isColumnSelected(val: any) {
    const index = this.selectedColOrder.findIndex(e => e.key === val.key);
    return index > -1;
  }

  showFilter() {
    const self = this;
    self.filterModalRef = self.modalService.open(self.filtereModal, { centered: true, size: 'lg' });
    self.filterModalRef.result.then(close => {
      if (close) {
        self.applyFilter();
      }
      else {
      }
    }, dismiss => { });
  }

  removeItem(index) {
    const self = this;
    self.selectedColOrder.splice(index, 1);
    if (self.selectedColOrder.length === 0) {
      this.queryObject['select'] = '';
      this.appliedFilter.value['select'] = ''
      this.applyFilter();
    }
  }

  addColForSort() {
    const self = this;
    if (self.sortingColumns.length === self.selectedColOrder.length) {
      return;
    } else if (self.selectedColOrder[self.trackIndex]) {
      self.sortingColumns.push(self.appService.cloneObject({
        name: '',
        sortingOptions: [{
          name: 'Ascending',
          value: '1'
        }, {
          name: 'Descending',
          value: '-1'
        }],
        selectedOption: '1'
      }));
      self.trackIndex++;
    }
  }

  removeSortCols(index) {
    const self = this;
    self.confirmDeleteModalRef = self.modalService.open(self.confirmDeleteModal, { centered: true });
    self.confirmDeleteModalRef.result.then(close => {
      if (close) {
        self.sortingColumns.splice(index, 1);
        self.trackIndex--;
      }
    }, dismiss => { });
  }

  createFilter(e) {
    const self = this;
    if (self.noFilterObject && self.filterId) {
      self.saveFilter();
    }
    if (e.length > 0) {
      self.queryObject.filter = e;
    } else {
      self.queryObject.filter = '';
    }
    if (Array.isArray(self.queryObject.filter)) {
      self.appService.dataKeyForSelectedCols = self.queryObject.filter.map(filterObj => filterObj.dataKey);
    }
  }

  createQueryString() {
    const self = this;
    self.queryObject.select = self.selectedColOrder.map(e => e.key).join(',') || self.appliedFilter?.value?.select;
    self.queryObject.sort = self.flowsService.sortModel;
  }

  clearFilter(triggered = false) {
    const self = this;
    // self.selectedColOrder = [];
    self.sortingColumns = [];
    self.queryObject = {sort: '-_metadata.createdAt'};
    self.filterModel = [];
    self.filterId = null;
    self.filterPayload.name = '';
    self.filterPayload.private = true;
    self.placeHolderText = 'Select Filter';
    self.saveOrEditText = '+Save As New View';
    self.showSeparateCreateBtn = false;
    self.appService.existingFilter = null;
    self.appService.dataKeyForSelectedCols = [];
    self.hasOptions = true;
    this.appService.setFilterModel({})
    if (!triggered) {
      this.filterCleared.emit(true)
    }
  }

  applyFilter(close?: boolean, fromParent = false) {
    const self = this;
    self.createQueryString();
    if ((self.queryObject.sort && self.queryObject.sort.length > 1)
      || self.queryObject.select || self.queryObject.filter) {
      self.appService.existingFilter = {
        value: JSON.stringify(self.queryObject)
      };
    } else {
      self.appService.existingFilter = null;
    }
    self.appService.filterName = self.filterPayload.name;
    if (!fromParent) {
      self.refine.emit({ query: self.queryObject, close, refresh: false });
    }
  }

  checkFilterName() {
    const self = this;
    self.invalidFilterName = !(self.filterPayload.name && self.filterPayload.name.length > 0);
  }

  selectFilter(filterValue: any, fromParent = false) {
    const self = this;
    let filterVal;
    self.appService.existingFilter = filterValue;
    if (filterValue) {
      self.hasOptions = filterValue?.hasOptions;
      if (filterValue?.value) {
        self.filterId = filterValue?._id;
        self.filterCreatedBy = filterValue?.createdBy;
        self.saveOrEditText = this.filterId ? '+Edit View' : '+Save As New View';
        self.showSeparateCreateBtn = this.filterId ? true : false;
        if (filterValue?.name) {
          self.placeHolderText = filterValue?.name || 'Select Filter';
        }
        self.filterPayload.name = filterValue?.name || '';
        self.appService.filterName = filterValue?.name || '';
        self.filterPayload.private = filterValue?.private;
        self.filterPayload.value = filterValue?.value;
        if (typeof filterValue?.value === 'string') {
          filterVal = JSON.parse(filterValue?.value);
        } else {
          filterVal = (filterValue?.value);
        }
      } else {
        self.filterId = '';
        self.saveOrEditText = '+Save As New View';
        self.showSeparateCreateBtn = false;
        self.placeHolderText = 'Select Filter';
        self.filterPayload.name = '';
        self.appService.filterName = '';
        self.filterPayload.private = true;
        filterVal = filterValue;
      }
      self.filterModel = _.cloneDeep(filterVal.filter) || [];
      self.filterModel.forEach((item, i) => {
        if (item.filterObject.hasOwnProperty('$or') && Array.isArray(item.filterObject['$or'])) {
          const dk = Object.keys(item.filterObject['$or'][0])[0].split('.');
          item.dataKey = dk[0];
        } else if (Array.isArray(item.filterObject)) {
          const temp = new Date(item.filterValue);
          if (temp.toString() !== 'Invalid Date') {
            item.dataKey = Object.keys(item.filterObject[0])[0];
          }
        }
      });
      self.queryObject = {
        filter: self.filterModel
      };
      self.createQueryString();
      if (self.filterModel && self.filterModel.length > 0) {
        self.noFilterObject = !self.filterModel.every(e => e.filterObject);
      }
      const selectItems = filterVal.select ? filterVal.select.split(',') : [];
      self.selectedColOrder = [];
      selectItems.forEach(e => {
        const index = self.allColumns.findIndex(col => col.key === e);
        if (index > -1) {
          self.selectedColOrder.push(self.allColumns[index]);
        }
      });
      self.sortingColumns = [];
      self.sortingColumns = filterVal.sort;
      self.showFilterList = false;
      if (self.filterApplied$) {
        self.filterApplied$.unsubscribe();
      }
      self.applyFilter(null, fromParent);
    }
  }

  saveFilter() {
    const self = this;
    if (true) {
      if (
        (!self.queryObject['filter'] || !self.queryObject['filter'].length) &&
        (!self.selectedColOrder || !self.selectedColOrder.length) &&
        (!self.sortingColumns || !self.sortingColumns.length)
      ) {
        self.ts.warning('Filter Appears empty');
      } else {
        self.invalidFilterName = false;
        self.createQueryString();
        const currentUser = self.sessionService.getUser(true);
        self.filterPayload.value = JSON.stringify(self.queryObject);
        let request: Observable<any>;
        if (self.filterId && (self.filterCreatedBy === currentUser._id)) {
          request = self.commonService.put('user', `/data/filter/${self.filterId}`, self.filterPayload);
        } else if ((self.filterId && (self.filterCreatedBy !== currentUser._id)) || (self.filterId === null || self.filterId === '' || self.filterId === undefined)) {
          self.filterId = null;
          request = self.commonService.post('user', '/data/filter/', self.filterPayload);
        }
        request.subscribe(res => {
          self.showSaveDiv = false;
          self.applyFilter();
          self.filterId = res._id;
          res.hasOptions = res.createdBy === currentUser._id;
          self.selectFilter(res);
          self.refine.emit({ query: res, refresh: true });
          self.saveOrEditText = '+Edit View';
          self.showSeparateCreateBtn = true;
          if (self.filterCreatedBy === currentUser._id) {
            self.ts.success('Filter Saved Successfully');
          } else {
            self.ts.success('New Filter created Successfully');
          }
        }, err => self.commonService.errorToast(err));
      }
    } else {
      self.invalidFilterName = true;
      return;
    }
  }

  duplicateView() {
    this.filterPayload = {
      serviceId: this.appService.serviceId,
      name: '',
      private: true,
      value: '',
      app: this.commonService.app._id,
      createdBy: this.sessionService.getUser(true)._id,
      type: 'dataService'
    };
    this.invalidFilterName = false;
    this.showSaveDiv = true;
    this.placeHolderText = 'Select Filter';
    this.showFilterList = false;
    this.filterId = null;
  }

  ngOnDestroy() {
    const self = this;
    if (self.confirmDeleteModalRef) {
      self.confirmDeleteModalRef.close();
    }
  }

  get checkAllColumn() {
    return this.selectedColOrder.length == this.allColumns.filter(ele => ele.key !== '_checkbox').length;
  }

  set checkAllColumn(flag: boolean) {
    if (flag) {
      this.selectedColOrder = _.cloneDeep(this.allColumns)
      this.selectedColOrder = this.selectedColOrder.filter(ele => ele.key !== '_checkbox')
    }
    else {
      this.queryObject['select'] = '';
      // this.appliedFilter.value['select'] = ''
      this.removeAllItems()
    }
  }

  get filterList() {
    return this.queryObject.filter

  }
  set filterList(val) {
    this.queryObject.filter = val

  }
  procesFilter(data) {
    const obj = {}
    const filterData = data['$or'] ? data['$or'][0] : data['$and'] ? data['$and'][0] : data;
    const key = Object.keys(filterData)[0].replace(/._id/, '');
    const value = Object.values(filterData)[0];
    const ele = {};
    ele[key] = value
    obj['filterObject'] = filterData;
    obj['key'] = Object.keys(ele)[0]
    obj['filterValue'] = Object.values(ele)[0]
    if (typeof obj['filterValue'] === 'string') {
      if (obj['filterValue'].charAt(0) === '/') {
        obj['filterType'] = 'contains';
        obj['filterValue'] = obj['filterValue'].slice(1, -1)
      }
      else {
        obj['filterType'] = 'equals';
      }
    }
    else if (typeof obj['filterValue'] === 'boolean') {
      obj['filterType'] = true ? 'yes' : 'no'
      obj['filterValue'] = null
    }
    else if (obj['filterValue']['$gt']) {
      obj['filterType'] = 'greaterThan'
      obj['filterValue'] = obj['filterValue']['$gt']
    }
    else if (obj['filterValue']['$lt']) {
      obj['filterType'] = 'lessThan'
      obj['filterValue'] = obj['filterValue']['$lt']
    }
    else if (obj['filterValue']['$gte'] === obj['filterValue']['$lte']) {
      obj['filterType'] = 'equals'
      obj['filterValue'] = obj['filterValue']['$gte']
    }
    else if (obj['filterValue']['$gte'] && obj['filterValue']['$lte']) {
      obj['filterType'] = 'inRange'
      obj['filterValue'] = `["${obj['filterValue']['$gte']}", "${obj['filterValue']['$lte']}"]`
    }
    else {
      if (obj['filterValue']['$ne']) {
        const value = obj['filterValue']['$ne'];
        if (typeof value === 'boolean') {
          obj['filterType'] = true ? 'yes' : 'no'
          obj['filterValue'] = null
        }
        else {
          if (obj['filterValue']['$ne'].charAt(0) === '/') {
            obj['filterType'] = 'notContains';
            obj['filterValue'] = obj['filterValue'].slice(1, -1)
          }
          else {
            obj['filterType'] = 'notEqual';
          }
        }
        obj['filterValue'] = obj['filterValue']['$ne']
      }
    }
    return obj
  }

}
