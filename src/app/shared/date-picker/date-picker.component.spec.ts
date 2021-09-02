import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';

import { DatePickerComponent } from './date-picker.component';

describe('Component: DatePicker', () => {
  it('should create an instance', () => {
    let component = new DatePickerComponent();
    expect(component).toBeTruthy();
  });
});
