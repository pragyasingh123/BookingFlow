import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { GtmHelperService } from '../../services/gtm-helper.service';
import * as moment from 'moment';

@Component({
  selector: 'app-select',
  styleUrls: ['select.component.scss'],
  templateUrl: 'select.component.html'
})
export class SelectComponent implements OnInit {
  @Input() public options: ISelectOption[];
  @Input() public placeholder: string;
  @Input() public disabled = false;
  @Input() public amend: boolean;
  @Input() public id: string = '';

  @Output() public value: any;
  @Output() public onSelected = new EventEmitter<ISelectOption>();

  constructor(private gtmHelperService?: GtmHelperService) {}

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

        if (this.options[i].selected) {
          this.onSelect(i);
        }
      }

      // If no value, set it to the first option by default. This guarantees that this element ALWAYS has a value
      if (!this.placeholder && this.value === undefined && this.options.length > 0) {
        this.onSelect(0);
      }
    }
  }

  public onFocus(): void {
    if (this.id && this.id.length > 0) {
      if (moment.isMoment(this.value)) {
        this.gtmHelperService.saveFieldValue(this.id, this.value.format('HH:mm'));
      } else {
        this.gtmHelperService.saveFieldValue(this.id, this.value);
      }
    }
  }

  public onSelect(index: any): void {
    // We use index for selection, because when setting the <option> value property, everything becomes a string.
    // By using and index, we can return the value in the correct type to the parent component

    let selectedOption = this.options[Number(index)];
    // console.log('selectedOption: ', selectedOption);
    this.value = selectedOption.value;

    if (moment.isMoment(this.value)) {
      this.gtmHelperService.pushNewFieldValue(this.id, this.value.format('HH:mm'));
    } else {
      this.gtmHelperService.pushNewFieldValue(this.id, this.value);
    }
    this.onSelected.emit(selectedOption);
  }
}

export interface ISelectOption {
  label: string|number;
  value?: any;
  selected?: boolean;
}
