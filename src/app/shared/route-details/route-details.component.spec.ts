import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
    beforeEach, beforeEachProviders,
    describe, xdescribe,
    expect, it, xit,
    async, inject
} from '@angular/core/testing';

import { RouteDetailsComponent } from './route-details.component';
import {BasketService} from '../../services/basket.service';
