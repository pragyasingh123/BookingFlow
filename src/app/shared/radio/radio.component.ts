import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-radio',
  styleUrls: ['radio.component.scss'],
  templateUrl: 'radio.component.html'
})
export class RadioComponent implements OnInit {
  @Input() public options: IRadioOption[];
  @Output() public value: string|number;
  @Output() public onSelect: EventEmitter<string|number> = new EventEmitter<string|number>(true);

  constructor() {}

  public ngOnInit(): void {
    // Sanitise the data
    if (this.options) {
      for (let i = 0; i < this.options.length; i++) {
        // Default to label is value not supplied
        if (typeof this.options[i].value === 'undefined') {
          this.options[i].value = this.options[i].label;
        }

        // Set selected to false if not supplied
        if (typeof this.options[i].selected === 'undefined') {
          this.options[i].selected = false;
        }

        // Simulate an initial selection if set so that listeners of this element can set state
        if (this.options[i].selected) {
          this.onSelected(this.options[i].value);
        }
      }
    }
  }

  public onSelected(value: any): void {
    this.value = value;
    this.options.forEach((x) => {
      if (x.value !== value) {
        x.selected = false;
      }
    });
    this.onSelect.emit(this.value);
  }
}

export interface IRadioOption {
  label: string;
  extra?: string;
  price?: number;
  value?: string|number|boolean;
  layoutClasses?: string[];
  selected?: boolean;
}
