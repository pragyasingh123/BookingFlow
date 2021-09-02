/* tslint:disable:no-unused-variable */

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';
import { BasketNotEmptyGuard } from './basket-not-empty.guard';

describe('BasketNotEmpty Service', () => {
  beforeEachProviders(() => [ BasketNotEmptyGuard ]);

  it('should ...',
    inject([ BasketNotEmptyGuard ], (service: BasketNotEmptyGuard) => {
      expect(service).toBeTruthy();
    }));
});
