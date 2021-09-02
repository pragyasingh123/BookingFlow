/* tslint:disable:no-unused-variable */

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';
import { BasketReadyGuard } from './basket-ready.guard';

describe('BasketReadyGuard Service', () => {
  beforeEachProviders(() => [BasketReadyGuard]);

  it('should ...',
      inject([BasketReadyGuard], (service: BasketReadyGuard) => {
    expect(service).toBeTruthy();
  }));
});
