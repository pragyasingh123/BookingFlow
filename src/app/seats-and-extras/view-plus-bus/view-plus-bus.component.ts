import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { IPlusBus } from '../../models/trip';
import { UiService } from '../../services/ui.service';
import { Analytics } from '../../services/analytics.service';

@Component({
  selector: 'app-view-plus-bus',
  styleUrls: ['view-plus-bus.component.scss'],
  templateUrl: 'view-plus-bus.component.html'
})
export class ViewPlusBusComponent implements OnInit {
  @Input() public plusBuses: IPlusBus[];
  @Output() public onRemoveClicked = new EventEmitter<IPlusBus>();
  private plusbusItemsToRemove: string[] = [];
  constructor(private uiService: UiService, private analytics: Analytics) { }

  public ngOnInit(): void {}

  public remove(option: IPlusBus): void {
    this.plusbusItemsToRemove.push(this.getPlusBusUniqueId(option));
    this.onRemoveClicked.emit(option);
  }

  public isPendingRemoval(option) {
    return _.indexOf(this.plusbusItemsToRemove, this.getPlusBusUniqueId(option)) > -1;
  }

  public edit(option: any): void {
    this.analytics.gtmTrackEvent({
      event: 'formSubmit',
      form: 'edit-plusbus',
      options: ''
    });
  }

  public showInfo(): void {
    this.uiService.modal(`<p>PlusBus is a discount price travelcard for unlimited bus and tram travel around town.</p>`, true);
  }

  private getPlusBusUniqueId(plusbus: IPlusBus): string {
    return plusbus.id + '-' + plusbus.directiontype + '-' + plusbus.date;
  }
}
