import { TestBed, async, inject } from '@angular/core/testing';
import { JourneyService } from './journey.service';

describe('AnalyticsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JourneyService]
    });
  });

  it('should ...', inject([JourneyService], (service: JourneyService) => {
    expect(service).toBeTruthy();
  }));
});
