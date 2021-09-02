import { TestBed, async, inject } from '@angular/core/testing';
import { Analytics } from './analytics.service';

describe('AnalyticsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Analytics]
    });
  });

  it('should ...', inject([Analytics], (service: Analytics) => {
    expect(service).toBeTruthy();
  }));
});
