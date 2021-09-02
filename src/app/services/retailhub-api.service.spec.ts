import { TestBed, async, inject } from '@angular/core/testing';
import { RetailhubApiService } from './retailhub-api.service';

describe('AnalyticsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RetailhubApiService]
    });
  });

  it('should ...', inject([RetailhubApiService], (service: RetailhubApiService) => {
    expect(service).toBeTruthy();
  }));
});
