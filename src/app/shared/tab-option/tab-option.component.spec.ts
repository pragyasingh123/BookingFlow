import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';

import { TabOptionComponent } from './tab-option.component';

describe('Component: TabOption', () => {
  it('should create an instance', () => {
    let component = new TabOptionComponent();
    expect(component).toBeTruthy();
  });
});
