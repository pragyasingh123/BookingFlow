import {Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'app-loading-indicator',
  styleUrls: ['loading-indicator.component.scss'],
  templateUrl: 'loading-indicator.component.html'
})
export class LoadingIndicatorComponent implements OnInit {
  @Input() public label: string;

  constructor() {}

  public ngOnInit(): void {}
}
