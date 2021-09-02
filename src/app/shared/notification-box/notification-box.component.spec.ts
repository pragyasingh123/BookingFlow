import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';

import { NotificationBoxComponent } from './notification-box.component';

describe('Component: NotificationBox', () => {
  it('should create an instance', () => {
    let component = new NotificationBoxComponent();
    expect(component).toBeTruthy();
  });
});
