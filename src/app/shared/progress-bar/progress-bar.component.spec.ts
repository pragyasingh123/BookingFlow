import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
    beforeEach, beforeEachProviders,
    describe, xdescribe,
    expect, it, xit,
    async, inject
} from '@angular/core/testing';

import { ProgressBarComponent } from './progress-bar.component';

describe('Component: ProgressBar', () => {
  it('should create an instance', () => {
    let component = new ProgressBarComponent();
    expect(component).toBeTruthy();
  });
});
