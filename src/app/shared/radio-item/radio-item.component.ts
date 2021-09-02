import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-radio-item',
  styleUrls: ['radio-item.component.scss'],
  templateUrl: 'radio-item.component.html'
})
export class RadioItemComponent implements OnInit {
  @Input() public selected: boolean;
  @Input() public value: string|number|boolean;
  @Input() public label: string;
  @Input() public extra: string|void;
  @Input() public price: number|void;

  @Output() public onSelected: EventEmitter<string|number|boolean> = new EventEmitter<string|number|boolean>();

  constructor() {}

  public ngOnInit(): void {
    if (typeof this.value === 'undefined') {
      this.value = this.label;
    }

    // If selected, simulate a click in order to emit an event
    if (this.selected) {
      this.onClick();
    }
  }

  public onClick(): void {
    this.selected = true;
    this.onSelected.emit(this.value);
  }
}
