import { TestBed, async, inject } from '@angular/core/testing';
import { BasketService } from './basket.service';

describe('AnalyticsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BasketService]
    });
  });

  it('should ...', inject([BasketService], (service: BasketService) => {
    expect(service).toBeTruthy();
  }));
});
