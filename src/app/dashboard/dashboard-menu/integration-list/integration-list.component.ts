import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, switchMap } from 'rxjs/operators';
import { AppService } from 'src/app/service/app.service';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { DashboardService } from '../../dashboard.service';
import * as _ from 'lodash'

@Component({
  selector: 'odp-integration-list',
  templateUrl: './integration-list.component.html',
  styleUrls: ['./integration-list.component.scss']
})
export class IntegrationListComponent implements OnInit {

  subscriptions: any;
  showLazyLoader: boolean;
  records: Array<any>;
  allRecords: Array<any>;
  activeId: string;
  searchText: string;
  constructor(private appService: AppService,
    private commonService: CommonService,
    private dashboardService: DashboardService,
    private router: Router) {
    this.subscriptions = {};
    this.records = [];
    this.activeId = 'all';
  }

  ngOnInit(): void {
    this.setActiveId(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setActiveId(event.url)
    });
    this.getFlows();
    this.dashboardService.appChanged.subscribe(app => {
      this.getFlows();
    });
  }

  setActiveId(url: string) {
    const segments = url.split('/');
    if (segments.length > 2) {
      this.activeId = segments[3];
    }
  }

  getFlows() {
    const filter: any = {};
    const options: GetOptions = {
      filter,
      select: 'name app',
      sort: 'name',
    };

    if (!this.commonService.userDetails.isSuperAdmin
      && this.commonService.interationsWithAccess.length > 0 && !this.commonService.isAppAdmin()) {
      filter._id = {
        $in: this.commonService.interationsWithAccess
      };
    }
    this.showLazyLoader = true;
    if (this.subscriptions.getFlows) {
      this.subscriptions.getFlows.unsubscribe();
    }
   
    this.subscriptions.getFlows =  this.commonService.get('pm', `/${this.commonService.app._id}/flow/utils/count`).pipe(switchMap((count: any) => {
      return this.commonService.get('pm', `/${this.commonService.app._id}/flow`, {
        count: count,
        ...options
      });
    })).subscribe(res => {
      this.showLazyLoader = false;
      this.records = res;
      this.allRecords = res;
      // if (!this.activeId) {
      //   this.loadFlowInteractions(null);
      // }
    }, err => {
      console.error(err);
      this.showLazyLoader = false;
    });
  }

  loadFlowInteractions(interactionItem?: any, force?: boolean) {
    if (interactionItem && interactionItem._id) {
      this.appService.partnerId = interactionItem._id;
      this.router.navigate(['/', this.commonService.app._id, 'flow', interactionItem._id]);
    }
  }

  search(value) {
    const self = this;
    if (!value || !value.trim()) {
      return;
    }
    this.searchText = value.trim().toLowerCase();
    console.log(this.searchText);
    this.records = this.allRecords.filter(e => e.name.toLowerCase().includes(self.searchText));
    self.showLazyLoader = true;
  }

  resetSearch() {
    const self = this;
    this.records = _.cloneDeep(this.allRecords);
    this.searchText = null;
    self.showLazyLoader = true;
  }

}
