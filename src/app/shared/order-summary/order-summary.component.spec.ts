import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';

import { OrderSummaryComponent } from './order-summary.component';

describe('Component: OrderSummary', () => {
  it('should create an instance', () => {
    let component = new OrderSummaryComponent();
    expect(component).toBeTruthy();
  });
});
