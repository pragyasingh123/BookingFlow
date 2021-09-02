import { Route, Routes } from '@angular/router';
import { SeatsAndExtrasComponent } from './seats-and-extras.component';
import { AddPlusBusComponent } from './add-plus-bus/add-plus-bus.component';
import { AddLegolandWestgateBusComponent } from './add-legoland-westgate-bus/add-legoland-westgate-bus.component';
import { AddTravelCardComponent } from './add-travel-card/add-travel-card.component';
import { AddBikeComponent } from './add-bike/add-bike.component';
import { SeatsAndExtrasModalComponent } from './seats-and-extras-modal/seats-and-extras-modal.component';
import { AddSeatComponent } from './add-seat/add-seat.component';
import { BasketReadyGuard } from '../guards/basket-ready.guard';
import { WindowTopGuard } from '../guards/window-top.guard';
import { BasketNotEmptyGuard } from '../guards/basket-not-empty.guard';

export const seatsAndExtrasRoutes: Routes = [
  {
    canActivate: [ BasketNotEmptyGuard ],
    canActivateChild: [ BasketNotEmptyGuard ],
    children: [
      { path: '', component: SeatsAndExtrasComponent, canActivate: [ WindowTopGuard ] },
      {
        children: [
          { path: 'plusbus', component: AddPlusBusComponent },
          { path: 'legolandbus', component: AddLegolandWestgateBusComponent },
          { path: 'oxfordwestgate', component: AddLegolandWestgateBusComponent },
          { path: 'travelcard', component: AddTravelCardComponent },
          { path: 'reserve-bike', component: AddBikeComponent },
        ],
        component: SeatsAndExtrasModalComponent,
        path: 'add'
      },
      {
        children: [
          { path: '', component: AddSeatComponent }
        ],
        component: SeatsAndExtrasModalComponent,
        path: 'preferences'
      }
    ],
    data: { progressStep: 2 },
    path: 'seats-and-extras/:trip'
  },
  {
    canActivate: [ BasketNotEmptyGuard ],
    canActivateChild: [ BasketNotEmptyGuard ],
    children: [
      { path: '', component: SeatsAndExtrasComponent, canActivate: [ WindowTopGuard ] }
    ],
    data: { progressStep: 2 },
    path: 'seats-and-extras/:trip/:seatSelectorStatus'
  }
];
