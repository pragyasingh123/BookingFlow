import { TestBed, async, inject } from '@angular/core/testing';
import { GtmHelperService } from './gtm-helper.service';

describe('GtmHelperServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GtmHelperService]
    });
  });

  it('should ...', inject([GtmHelperService], (service: GtmHelperService) => {
    expect(service).toBeTruthy();
  }));
});
