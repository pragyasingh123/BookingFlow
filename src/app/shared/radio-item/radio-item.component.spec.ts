import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';

import { RadioItemComponent } from './radio-item.component';

describe('Component: RadioItem', () => {
  it('should create an instance', () => {
    let component = new RadioItemComponent();
    expect(component).toBeTruthy();
  });
});
