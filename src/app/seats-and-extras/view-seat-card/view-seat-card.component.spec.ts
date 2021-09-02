import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';

import { ViewSeatCardComponent } from './view-seat-card.component';

describe('Component: SeatCard', () => {
  it('should create an instance', () => {
    let component = new ViewSeatCardComponent();
    expect(component).toBeTruthy();
  });
});
