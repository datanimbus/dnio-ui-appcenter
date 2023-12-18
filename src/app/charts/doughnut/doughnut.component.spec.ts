import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Doughnut } from './doughnut.component';

describe('Doughnut', () => {
  let component: Doughnut;
  let fixture: ComponentFixture<Doughnut>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Doughnut]
    });
    fixture = TestBed.createComponent(Doughnut);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
