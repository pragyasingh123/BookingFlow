import { Routes, RouterModule } from '@angular/router';
import { ConfirmationComponent } from './confirmation';
import { DeliveryDetailsComponent } from './delivery-details';
import { LoginComponent } from './account/login';
import { RegisterComponent } from './account/register';
import { ResetComponent } from './account/reset';
import { OutwardJourneySelectorComponent } from './outward-journey-selector';
import { QttComponent } from './qtt';
import { ReturnJourneySelectorComponent } from './return-journey-selector';
import { ReviewOrderComponent } from './review-order';
import { RouteDetailsComponent } from './shared/route-details';
import { RouteDetailsSimplifiedComponent } from './shared/route-details-simplified';
import { seatsAndExtrasRoutes } from './seats-and-extras';
import { SelectionsComponent } from './selections';
import { TicketInformationComponent } from './ticket-information';
import { WindowTopGuard } from './guards/window-top.guard';
import { BasketNotEmptyGuard } from './guards/basket-not-empty.guard';
import { RequiresLoginGuard } from './guards/requires-login.guard';
import { NationalRailHandoffComponent } from './national-rail-handoff';
import { ModuleWithProviders } from '@angular/core';
import { DisruptionsComponent } from './qtt/disruptions/disruptions.component';
import { DisruptionsModalComponent } from './qtt/disruptions-modal/disruptions-modal.component';
import { CheapestFareFinderComponent } from './cheapest-fare-finder/cheapest-fare-finder.component';
import { PreferencesComponent } from './preferences/preferences.component';

export const routes: Routes = [
  {
    children: [
      { path: '', component: QttComponent, canActivate: [ WindowTopGuard ] },
      {
        children: [
          { path: 'warning', component: DisruptionsComponent, canActivate: [ WindowTopGuard ] }
        ],
        component: DisruptionsModalComponent,
        path: 'disruptions'
      }
    ],
    path: 'qtt'
  },
  {
    children: [
      { path: '', component: OutwardJourneySelectorComponent, canActivate: [ WindowTopGuard ] },
      {
        children: [
          { path: '', component: ReturnJourneySelectorComponent, canActivate: [ WindowTopGuard ] },
          { path: 'route-details', component: RouteDetailsComponent, canActivate: [ WindowTopGuard ] }
        ],
        path: 'return'
      },
      { path: 'route-details', component: RouteDetailsComponent, canActivate: [ WindowTopGuard ] },
    ],
    data: { progressStep: 1 },
    path: 'search'
  },
  { path: 'ticket/:ticketId', component: TicketInformationComponent, canActivate: [ WindowTopGuard ] },
  {
    children: [
      { path: '', component: SelectionsComponent, canActivate: [ WindowTopGuard ] },
      { path: 'route-details-simplified', component: RouteDetailsSimplifiedComponent, canActivate: [ WindowTopGuard ] },
      { path: 'route-details', component: RouteDetailsComponent, canActivate: [ WindowTopGuard ] }
    ],
    data: { progressStep: 1 },
    path: 'selections'
  },
  { path: 'delivery', component: DeliveryDetailsComponent, canActivate: [ BasketNotEmptyGuard, WindowTopGuard ], data: { progressStep: 3 } },
  {
    children: [
      { path: '', component: ReviewOrderComponent, canActivate: [ BasketNotEmptyGuard, RequiresLoginGuard, WindowTopGuard ] },
      { path: 'route-details-simplified', component: RouteDetailsSimplifiedComponent, canActivate: [ WindowTopGuard ] }
    ],
    data: { progressStep: 4 },
    path: 'review-order'
  },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [ BasketNotEmptyGuard, WindowTopGuard ], data: { progressStep: 6 } },
  { path: 'login', component: LoginComponent, canActivate: [ WindowTopGuard ] },
  { path: 'register', component: RegisterComponent, canActivate: [ WindowTopGuard ] },
  { path: 'reset', component: ResetComponent, canActivate: [ WindowTopGuard ] },
  { path: 'bookings/nre', component: NationalRailHandoffComponent, canActivate: [ WindowTopGuard ] },
  {
    children: [
      { path: '', component: CheapestFareFinderComponent, canActivate: [ WindowTopGuard ] },
    ],
    path: 'cff'
  },
  // Seats and extras has its own child routes. Its clearer for maintenance to simply define these within the component
  ...seatsAndExtrasRoutes,
  { path: 'preferences', component: PreferencesComponent, canActivate: [ WindowTopGuard ] },
  { path: '**', redirectTo: '/qtt' },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes, { useHash: true });
