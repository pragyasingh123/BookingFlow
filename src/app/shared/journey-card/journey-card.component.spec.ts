import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';

import { JourneyCardComponent } from './journey-card.component';

describe('Component: JourneyCard', () => {
  it('should create an instance', () => {
    let component = new JourneyCardComponent();
    expect(component).toBeTruthy();
  });
});
