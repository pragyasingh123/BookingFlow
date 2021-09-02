import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
    beforeEach, beforeEachProviders,
    describe, xdescribe,
    expect, it, xit,
    async, inject
} from '@angular/core/testing';

import { RouteFacilitiesComponent } from './route-facilities.component';

describe('Component: RouteFeatures', () => {
  it('should create an instance', () => {
    let component = new RouteFacilitiesComponent();
    expect(component).toBeTruthy();
  });
});
