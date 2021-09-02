import { Output, Input, ElementRef, ViewChild, Component, OnInit, HostBinding, Renderer, HostListener } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  styleUrls: ['progress-bar.component.scss'],
  templateUrl: 'progress-bar.component.html'
})
export class ProgressBarComponent implements OnInit {
  @Input() public current: any = 1;
  @Input() public numbers: boolean = true;

  public steps: ProgressBarStep[] = Array();
  public max: number = 0;
  public itemWidth: number;
  public barWidth: number;

  @ViewChild('content') public content: ElementRef;
  @ViewChild('bar') public bar: ElementRef;

  private defSteps: string[] = ['Tickets', 'Extras', 'Delivery', 'Review', 'Payment'];
  private processed: boolean = false;
  private el: HTMLElement;

  constructor(el?: ElementRef, public renderer?: Renderer) {}

  @HostListener('window:resize', ['$event.target'])
  public onResize(event) {
    this.setBarLength();
  }

  public ngOnInit(): void {
    this.setBarLength();
    this.processLightDom( this.content );
    if (this.steps.length === 0) {
      var steps = new Array<ProgressBarStep>();
      for (var i = 0; i < this.defSteps.length; i++) {
        steps.push( new ProgressBarStep( this.defSteps[i], (this.numbers) ? (i + 1).toString() : ''));
      }
      this.steps = steps;
    }
    this.resetStepsTo( this.current );
    this.max = this.steps.length;
  }

  public setBarLength(): void {
    let itemWidth = window.innerWidth / 3;
    this.barWidth = itemWidth * 5;
    this.itemWidth = itemWidth;

    setTimeout(() => {
      this.bar.nativeElement.style.transform = 'translateX(-' + (itemWidth * ((this.current == 6 ? 4 : this.current) - 2)) + 'px)';
    }, 400);
  }

  public processLightDom(node: any, remove: boolean = true) {
    var s = {steps: [], current: -1};
    var steps = new Array<ProgressBarStep>();
    var items = node.nativeElement.children;
    if (items.length === 1 && items[0].tagName === 'UL') {
      items = items[0].children;
    }
    if (items.length === 0) { return {}; }
    for (var i = 0; i < items.length; i++) {
      s['steps'][i] = {
        is_current: false,
        is_passed: false,
        label: items[i].textContent,
        number: ((this.numbers !== false) ? (i + 1) + '. ' : '')
      };
      if (typeof items[i].getAttribute('current') !== 'object') {
        s['current'] = i + 1;
      }
    }
    this.steps = s['steps'];
    if (s['current'] > -1) {
      this.current = s['current'];
    }
    this.processed = true;
  }

  public resetStepsTo(current: any): void {
    for (var i = 0; i < this.steps.length; i++) {
      this.steps[i].is_passed = (i + 1 <= current);
      this.steps[i].is_current = (i + 1 === current);
    }
  }
}

export class ProgressBarStep {
  @Output() public is_passed: boolean;
  @Output() public is_current: boolean;
  public label: string;
  public number: string;
  public index: string;

  constructor(label: string, num: string = '') {
    this.label = label;
    this.index = num;
    this.number = (num == '') ? '' : num + '. ';
  }
}
