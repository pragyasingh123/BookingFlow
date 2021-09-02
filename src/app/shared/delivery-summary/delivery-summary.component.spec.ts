import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import {
  addProviders, async, inject,
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit
} from '@angular/core/testing';
import { DeliverySummaryComponent } from './delivery-summary.component';

describe('Component: DeliverySummary', () => {
  it('should create an instance', () => {
    let component = new DeliverySummaryComponent();
    expect(component).toBeTruthy();
  });
});
