import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({name: 'safeAsHtml'})
export class SafeAsHtml implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  public transform(style) {
    return this.sanitizer.bypassSecurityTrustHtml(style);
  }
}
