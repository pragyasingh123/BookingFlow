/* tslint:disable:no-unused-variable */

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';
import { WindowTopGuard } from './window-top.guard';

describe('WindowTop Service', () => {
  beforeEachProviders(() => [WindowTopGuard]);

  it('should ...',
      inject([WindowTopGuard], (service: WindowTopGuard) => {
    expect(service).toBeTruthy();
  }));
});
