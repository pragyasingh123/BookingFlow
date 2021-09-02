import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';

import { LoadingIndicatorComponent } from './loading-indicator.component';

describe('Component: LoadingIndicator', () => {
  it('should create an instance', () => {
    let component = new LoadingIndicatorComponent();
    expect(component).toBeTruthy();
  });
});
