import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowsOverviewwComponent } from './flows-overview.component';

describe('FlowsOverviewwComponent', () => {
  let component: FlowsOverviewwComponent;
  let fixture: ComponentFixture<FlowsOverviewwComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlowsOverviewwComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowsOverviewwComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
