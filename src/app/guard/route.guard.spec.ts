import { TestBed, async, inject } from '@angular/core/testing';

import { RouteGuard } from 'src/app/guard/route.guard';

describe('RouteGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RouteGuard]
    });
  });

  it('should ...', inject([RouteGuard], (guard: RouteGuard) => {
    expect(guard).toBeTruthy();
  }));
});
