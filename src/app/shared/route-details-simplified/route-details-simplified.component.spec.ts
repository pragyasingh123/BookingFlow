import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
    beforeEach, beforeEachProviders,
    describe, xdescribe,
    expect, it, xit,
    async, inject
} from '@angular/core/testing';

import { RouteDetailsSimplifiedComponent } from './route-details-simplified.component';
import {BasketService} from '../../services/basket.service';
