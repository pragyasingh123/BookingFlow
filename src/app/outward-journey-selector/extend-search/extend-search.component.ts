import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'extend-search',
  styleUrls: ['extend-search.component.scss'],
  templateUrl: 'extend-search.component.html'
})
export class ExtendSearchComponent implements OnInit {
  @Input() public link: string;
  @Input() public direction: string;
  @Output() public onClicked = new EventEmitter<string>();
  private text: string;
  private emptyText: string;
  private arrowClass: string;

  public ngOnInit(): void {
    if (this.direction === 'earlier') {
      this.text = 'Earlier';
      this.emptyText = 'No earlier trains available';
      this.arrowClass = 'toc:arrow_up';
    } else {
      this.text = 'Later';
      this.emptyText = 'No later trains available';
      this.arrowClass = 'toc:arrow_down';
    }
  }

  public onClick(): void {
    this.onClicked.emit(this.link);
  }
}
