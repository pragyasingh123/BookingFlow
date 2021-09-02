import { TestBed, async, inject } from '@angular/core/testing';
import { JourneySelectionService } from './journey-selection-service';

describe('AnalyticsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JourneySelectionService]
    });
  });

  it('should ...', inject([JourneySelectionService], (service: JourneySelectionService) => {
    expect(service).toBeTruthy();
  }));
});
