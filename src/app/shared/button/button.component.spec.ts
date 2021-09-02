import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { addProviders, async, inject, expect, it, describe } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('Component: Button', () => {
  it('should create an instance', () => {
    let component = new ButtonComponent();
    expect(component).toBeTruthy();
  });
});
