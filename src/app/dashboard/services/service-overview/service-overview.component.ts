import { Component, OnInit } from '@angular/core';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { distinctUntilChanged } from 'rxjs/operators';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../../../service/app.service';
import { DashboardService } from '../../dashboard.service';
import * as _ from 'lodash'

@Component({
  selector: 'odp-service-overview',
  templateUrl: './service-overview.component.html',
  styleUrls: ['./service-overview.component.scss']
})
export class ServiceOverviewComponent implements OnInit {
  serviceRecordCounts: any;
  services: any;
  showLazyLoader: boolean;
  searchTerm: string;
  filter: any;
  breadcrumb: Array<any> = [];

  constructor(
    private commonService: CommonService,
    public appService: AppService,
    private dashboardService: DashboardService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    const self = this;
    self.services = [];
    this.route.data.subscribe(data => {
      if (data.breadcrumb.length > 0) {
        this.breadcrumb = _.cloneDeep(data.breadcrumb)
      }
      else {
        this.breadcrumb.push('Data Service')
      }
      this.breadcrumb.push('All Data Services')
      this.commonService.breadcrumbPush(this.breadcrumb)
    })
    self.serviceRecordCounts = null;
    self.showLazyLoader = true;
    self.getServices();
  }
  loadDataService(service: any) {
    this.appService.serviceId = service._id;
    this.dashboardService.selectedService.emit(service);

    this.router.navigateByUrl(['', this.commonService.app._id, 'services'].join('/')).then(() => {
      this.router.navigate(['/', this.commonService.app._id, 'services', service._id, 'list']);
    });

  }
  search(value) {
    const self = this;
    if (!value || !value.trim()) {
      return;
    }
    this.searchTerm = value.trim();
    self.services = [];
    self.serviceRecordCounts = null;
    self.showLazyLoader = true;
    self.getServices();
  }

  resetSearch() {
    const self = this;
    this.searchTerm = null;
    self.services = [];
    self.serviceRecordCounts = null;
    self.showLazyLoader = true;
    self.getServices();
  }


  getServices() {
    const self = this;
    const filter: any = { status: 'Active', app: self.commonService.app._id };
    if (self.searchTerm) {
      filter.name = '/' + self.searchTerm + '/';
    }
    if (!self.commonService.userDetails?.isSuperAdmin
      && self.commonService.servicesWithAccess?.length > 0 && !self.commonService.isAppAdmin()) {
      filter._id = {
        $in: self.commonService.servicesWithAccess
      };
    }
    const options: GetOptions = {
      count: -1,
      filter,
      select: 'name,_metadata.lastUpdated,definition,stateModel,workflowConfig',
      sort: 'name'
    };

    self.commonService
      .get('sm', `/${self.commonService.app._id}/service`, options)
      .pipe(distinctUntilChanged())
      .subscribe(res => {
        {
          self.services = res;
          self._getAllServiceRecords(res.map((e) => e._id)).subscribe(
            (counts: any) => {
              if (counts && counts.length > 0) {
                self.serviceRecordCounts = counts;
              }
              self.showLazyLoader = false;
            },
            (err) => {
              self.commonService.errorToast(
                err,
                'We are unable to fetch Data Service documents count, please try again later'
              );
              self.showLazyLoader = false;
            }
          );
        }
      });
  }

  _getAllServiceRecords(serviceIds: Array<string>) {
    const self = this;
    return self.commonService.get(
      'sm',
      `/${self.commonService.app._id}/service/utils/all/count`,
      {
        serviceIds: serviceIds.join(','),
        filter: { app: self.commonService.app._id },
      }
    );
  }

  totalAttributes(service) {
    const self = this;
    if (service?.definition) {
      return service.definition.length - 1;
    } else {
      return service.attributeCount;
    }
  }

  totalRecords(service) {
    const self = this;
    let serviceIndex = self.serviceRecordCounts?.findIndex(srvc => srvc._id == service._id)
    if (serviceIndex > -1) {
      return self.serviceRecordCounts?.[serviceIndex]?.count
    }
    else {
      return 0;
    }
  }

  lastUpdated(service) {
    const self = this;
    return moment(service._metadata.lastUpdated).format("MMM Do YY");
  }

}
