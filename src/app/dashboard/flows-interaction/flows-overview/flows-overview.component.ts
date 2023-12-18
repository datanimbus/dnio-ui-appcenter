import { Component, OnInit } from '@angular/core';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash'

@Component({
  selector: 'odp-flows-overview',
  templateUrl: './flows-overview.component.html',
  styleUrls: ['./flows-overview.component.scss']
})
export class FlowsOverviewwComponent implements OnInit {

  showLazyLoader: boolean;
  searchTerm: string;
  services: any;
  ogServices: any;
  serviceData: Array<any> = [];
  breadcrumb: Array<any> = [];
  subscriptions: any ={};
  records: Array<any> = [];
  allRecords: Array<any> = [];
  constructor(
    private commonService: CommonService,
    private route: ActivatedRoute,
    private router: Router
  ) { }


  ngOnInit(): void {
    const self = this;
    self.records = [];
    self.allRecords = [];
    self.showLazyLoader = true;
    self.route.data.subscribe(data => {
      if (data.breadcrumb.length > 0) {
        this.breadcrumb = _.cloneDeep(data.breadcrumb)
      }
      else {
        this.breadcrumb.push('Workflows')
      }
      this.breadcrumb.push('All Workfkows')
      this.commonService.breadcrumbPush(this.breadcrumb)
    })
    self.getFlows();
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
    })).subscribe({
      next: (res: any) => {
          this.showLazyLoader = false;
          this.records = res;
          this.allRecords = res;
          if (res.length > 0) {
            res.forEach(ele => {
              this.getFlowDetails(ele)
            })
          }
          // if (!this.activeId) {
          //   this.loadFlowInteractions(null);
          // }
      },
      error: (err: any) => {
        console.error(err);
        this.showLazyLoader = false;
      }
    })
  }

  getFlowDetails(flow) {
     flow['counts'] = {}
    return this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${flow._id}`,{sort: '-_metadata.lastUpdated'}).subscribe({
      next : (res) => {
        flow['counts']['success']=res.length > 0 ? res.filter(ele => ele.status === 'SUCCESS').length : 0;
        flow['counts']['error']=res.length > 0 ? res.filter(ele => ele.status === 'ERROR').length : 0;
        flow['counts']['pending']=res.length > 0 ? res.filter(ele => ele.status === 'PENDING').length : 0;
        flow['counts']['total']=res.length ;
        flow['lastInvoked']=res.length > 0 ? res[0]._metadata.lastUpdated : null;
      }
    }
    )
  }
  search(value) {
    const self = this;
    if (!value || !value.trim()) {
      self.records = self.allRecords
      return;
    }
    this.searchTerm = value.trim();
    self.records = [];
    // self.showLazyLoader = true;
    self.records = self.allRecords.filter(ele => ele.name.toLowerCase().indexOf(this.searchTerm) > -1);
  }

  resetSearch() {
    const self = this;
    this.searchTerm = null;
    self.records = [];
    // self.showLazyLoader = true;
    self.records = self.allRecords
    // self.getFlows();
  }

  navigate(flow) {
    this.router.navigate(['/', this.commonService.app._id, 'flow', flow._id]);
  }
}
