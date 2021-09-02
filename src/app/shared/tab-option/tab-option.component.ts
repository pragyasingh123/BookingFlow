import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-tab-option',
  styleUrls: ['tab-option.component.scss'],
  templateUrl: 'tab-option.component.html'
})
export class TabOptionComponent implements OnInit {
  @Input() public value: string|number;
  @Input() public options: Array<{value: string|number, label: string}>;
  @Output() public onSelected = new EventEmitter<string | number>();

  constructor() {}

  public ngOnInit(): void {
    if (!this.value && this.options.length) {
      this.value = this.options[0].value;
    }
  }

  public onSelect(value: any): void {
    // We use index for selection, because when setting the <option> value property, everything becomes a string.
    // By using and index, we can return the value in the correct type to the parent component
    this.value = value;
    this.onSelected.emit(value);
  }
}
