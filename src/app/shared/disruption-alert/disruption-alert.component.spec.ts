import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';

import { DisruptionAlertComponent } from './disruption-alert.component';

describe('Component: DisruptionAlert', () => {
  it('should create an instance', () => {
    let component = new DisruptionAlertComponent();
    expect(component).toBeTruthy();
  });
});
