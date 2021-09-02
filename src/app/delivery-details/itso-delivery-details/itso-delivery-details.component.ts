import { Component, Input } from '@angular/core';
import { ItsoHelper } from '../itso-helper';
import { ISmartcardsListItem } from '../../services/user.service';
import { LocationService } from '../../services/locations.service';
import { Location } from '../../models/location';
import { Router } from '@angular/router';

@Component({
  selector: 'app-itso-delivery',
  styleUrls: ['itso-delivery-details.component.scss'],
  templateUrl: 'itso-delivery-details.component.html'
})
export class ItsoDeliveryDetailsComponent {
  @Input() public itsoData = null as ISmartcardsListItem;

  constructor(
    private router: Router,
    private locationService: LocationService
  ) {}

  public beautifyIsrnNo(isrn: ISmartcardsListItem): string {
    let isrnNumber = '';
    if (isrn !== null && isrn !== undefined ) {
      isrnNumber = ItsoHelper.isrnBeautify(isrn.isrn);
    }
    return isrnNumber;
  }
  public locationNameByID(itsoLocation: ISmartcardsListItem): string {
    let stationName = '';
    if (itsoLocation !== null && itsoLocation !== undefined) {
      this.locationService.findOne({id: itsoLocation.locationnlc})
        .subscribe((data: Location) => {
          stationName = data.name;
        });
    }
    return stationName;
  }
}
