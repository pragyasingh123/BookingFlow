import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {Analytics} from '../../services/analytics.service';

@Component({
  selector: 'app-button',
  styleUrls: ['button.component.scss'],
  templateUrl: 'button.component.html'
})
export class ButtonComponent implements OnInit {
  @Input('btn-type') public type: string = 'basic';
  @Input('btn-fxm') public btnFXM: any;
  @Input('loading-type') public loadingType: string = 'none';
  @Input('btn-theme') public theme: string;
  @Input() public isLoading: boolean = false;
  @Input() public showLoader: boolean = false;
  @Input() public disabled: boolean = false;
  @Output() public onClicked = new EventEmitter<boolean>();

  constructor(private analytics?: Analytics) { }

  public ngOnInit(): void {}

  public onClick(event: any): void {
    this.analytics.trackButtonClick(JSON.stringify(this.btnFXM));

    if (this.showLoader) {
      this.isLoading = !this.isLoading;
      this.onClicked.emit(this.isLoading);
    }
  }
}
