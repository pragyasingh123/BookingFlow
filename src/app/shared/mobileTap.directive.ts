import { Directive, HostListener, Renderer, ElementRef, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Directive({
  selector: '[tap]',
})
export class MobileTapDirective {
  @Input() public tap: string;
  @Input() public tapCallback: () => void;

  constructor(private elementRef: ElementRef, private renderer: Renderer) {}

  @HostListener('click')
  public onTap(): void {
    Observable.timer(0, 200)
      .take(2)
      .subscribe((tick: number) => {
        switch (tick) {
          case 0:
            this.renderer.setElementClass(this.elementRef.nativeElement, this.tap, true);
            break;
          case 1:
            if (this.tapCallback) {
              this.tapCallback();
            }
            this.renderer.setElementClass(this.elementRef.nativeElement, this.tap, false);
            break;
          default:
            break;
        }
      });
  }
}
