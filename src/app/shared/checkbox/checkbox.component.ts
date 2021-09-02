import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { GtmHelperService } from '../../services/gtm-helper.service';

@Component({
  selector: 'app-checkbox',
  styleUrls: ['checkbox.component.scss'],
  templateUrl: 'checkbox.component.html'
})
export class CheckboxComponent implements OnInit {
  @Input() public checked: boolean;
  @Input() public amend: boolean;
  @Input() public label: string;
  @Input() public canWeContactYou: boolean = false;
  @Input() public extra: string|void;
  @Input() public id: string;
  @Output() public onChecked = new EventEmitter<boolean>();

  constructor(private gtmHelperService?: GtmHelperService) {}

  public ngOnInit(): void {}

  public onClick(): void {
    this.gtmHelperService.registerClickEvent(this.id);
    this.checked = !this.checked;
    this.onChecked.emit(this.checked);
  }
}
