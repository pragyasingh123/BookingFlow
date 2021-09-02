import { Directive, ElementRef, Input, Renderer } from '@angular/core';
import { Analytics } from '../../services/analytics.service';

@Directive({ selector: '[gtmTrackMessage]' })
export class GtmTrackMessageDirective {
    private _message: string = '';

    @Input() set message(value: string) {
        this._message = value;
    }

    constructor(private element: ElementRef, private renderer: Renderer, private analyticsService: Analytics) {}

    public ngAfterContentInit(): void {
        if (this._message == '') {
            this._message = this.element.nativeElement.innerHTML;
        }
        this.setMessage(this._message);
    }

    public setMessage(message: string): void {
        this.analyticsService.gtmTrackEvent({
            event: 'Impression',
            options: message
        });
    }
}
