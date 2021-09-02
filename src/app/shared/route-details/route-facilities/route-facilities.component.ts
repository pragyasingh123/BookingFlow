import { Component, OnInit, Input } from '@angular/core';
import {RouteFacility} from '../../../models/route-details';

@Component({
  selector: 'app-route-facilities',
  styleUrls: ['route-facilities.component.scss'],
  templateUrl: 'route-facilities.component.html'
})
export class RouteFacilitiesComponent implements OnInit {
  @Input() public header: string;
  @Input() public facilities: RouteFacility[];
  @Input() public columns: boolean;

  constructor() {}

  public ngOnInit(): void {}
}
