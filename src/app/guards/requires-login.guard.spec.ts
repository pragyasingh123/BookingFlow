/* tslint:disable:no-unused-variable */

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';
import { RequiresLoginGuard } from './requires-login.guard';

describe('RequiresLogin Service', () => {
  beforeEachProviders(() => [RequiresLoginGuard]);

  it('should ...',
      inject([RequiresLoginGuard], (service: RequiresLoginGuard) => {
    expect(service).toBeTruthy();
  }));
});
