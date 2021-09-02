import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule, XHRBackend, RequestOptions } from '@angular/http';
import { Ng2DeviceDetector } from 'ng2-device-detector/src/index';
import { RecaptchaModule } from 'ng-recaptcha';
import { AppComponent } from './app.component';
import { BasketService } from './services/basket.service';
import { ConfigService } from './services/config.service';
import { JourneyService } from './services/journey.service';
import { JourneySelectionService } from './services/journey-selection-service';
import { RetailhubApiService } from './services/retailhub-api.service';
import { UiService } from './services/ui.service';
import { UserService } from './services/user.service';
import { Analytics } from './services/analytics.service';
import { AlertService } from './services/alert.service';
import { AddonInformationComponent } from './shared/addon-information/addon-information.component';
import { GtmHelperService } from './services/gtm-helper.service';
import { BasketContinueButtonService } from './services/basket-continue-button.service';
import { BasketComponent } from './shared/basket/basket.component';
import { ButtonComponent } from './shared/button/button.component';
import { CheckboxComponent } from './shared/checkbox/checkbox.component';
import { DatePickerComponent } from './shared/date-picker/date-picker.component';
import { DeliverySummaryComponent } from './shared/delivery-summary/delivery-summary.component';
import { DisruptionAlertComponent } from './shared/disruption-alert/disruption-alert.component';
import { JourneyCardComponent } from './shared/journey-card/journey-card.component';
import { LoadingIndicatorComponent } from './shared/loading-indicator/loading-indicator.component';
import { NectarBoxComponent } from './shared/nectar-box/nectar-box.component';
import { OrderSummaryComponent } from './shared/order-summary/order-summary.component';
import { ProgressBarComponent } from './shared/progress-bar/progress-bar.component';
import { RadioComponent } from './shared/radio/radio.component';
import { RadioItemComponent } from './shared/radio-item/radio-item.component';
import { RouteDetailsComponent } from './shared/route-details/route-details.component';
import { RouteDetailsSimplifiedComponent } from './shared/route-details-simplified/route-details-simplified.component';
import { RouteCallingPointsComponent } from './shared/route-details/route-calling-points';
import { RouteFacilitiesComponent } from './shared/route-details/route-facilities';
import { SelectComponent } from './shared/select/select.component';
import { StationPickerComponent } from './shared/station-picker/station-picker.component';
import { TabOptionComponent } from './shared/tab-option/tab-option.component';
import { TripCardComponent } from './shared/trip-card/trip-card.component';
import { AlertComponent } from './shared/alert/alert.component';
import { CarbonFootprintComponent } from './carbon-footprint/carbon-footprint.component';
import { LoginComponent } from './account/login/login.component';
import { RegisterComponent } from './account/register/register.component';
import { ResetComponent } from './account/reset/reset.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { DeliveryDetailsComponent } from './delivery-details/delivery-details.component';
import { FooterComponent } from './footer/footer.component';
import { BasketNotEmptyGuard } from './guards/basket-not-empty.guard';
import { BasketReadyGuard } from './guards/basket-ready.guard';
import { RequiresLoginGuard } from './guards/requires-login.guard';
import { WindowTopGuard } from './guards/window-top.guard';
import { NavbarComponent } from './navbar/navbar.component';
import { OutwardJourneySelectorComponent } from './outward-journey-selector/outward-journey-selector.component';
import { PluralisePipe } from './pipes/pluralise.pipe';
import { QttComponent } from './qtt/qtt.component';
import { ReturnJourneySelectorComponent } from './return-journey-selector/return-journey-selector.component';
import { ReviewOrderComponent } from './review-order/review-order.component';
import { SeatsAndExtrasComponent } from './seats-and-extras/seats-and-extras.component';
import { SelectionsComponent } from './selections/selections.component';
import { TicketInformationComponent } from './ticket-information/ticket-information.component';
import { UiNotificationsComponent } from './ui-notifications/ui-notifications.component';
import { AddBikeComponent } from './seats-and-extras/add-bike/add-bike.component';
import { AddPlusBusComponent } from './seats-and-extras/add-plus-bus/add-plus-bus.component';
import { AddLegolandWestgateBusComponent } from './seats-and-extras/add-legoland-westgate-bus/add-legoland-westgate-bus.component';
import { AddSeatComponent } from './seats-and-extras/add-seat/add-seat.component';
import { AddTravelCardComponent } from './seats-and-extras/add-travel-card/add-travel-card.component';
import { SeatsAndExtrasModalComponent } from './seats-and-extras/seats-and-extras-modal/seats-and-extras-modal.component';
import { ViewBikeComponent } from './seats-and-extras/view-bike/view-bike.component';
import { ViewSeatCardComponent } from './seats-and-extras/view-seat-card/view-seat-card.component';
import { ViewTravelCardComponent } from './seats-and-extras/view-travel-card/view-travel-card.component';
import { ViewPlusBusComponent } from './seats-and-extras/view-plus-bus/view-plus-bus.component';
import { ViewLegolandWestgateBusComponent } from './seats-and-extras/view-legoland-westgate-bus/view-legoland-westgate-bus.component';
import { routing } from './app.routes';
import { CookieService } from 'angular2-cookie/services/cookies.service';
import { PostAddressComponent } from './delivery-details/post-address/post-address.component';
import { TicketCardComponent } from './selections/ticket-card/ticket-card.component';
import { TicketSingleCardComponent } from './selections/ticket-single-card/ticket-single-card.component';
import { TicketFirstCardComponent } from './selections/ticket-first-card/ticket-first-card.component';
import { ExtendSearchComponent } from './outward-journey-selector/extend-search/extend-search.component';
import { SelfPrintFormComponent } from './delivery-details/self-print-form/self-print-form.component';
import { LocationService } from './services/locations.service';
import { NationalRailHandoffComponent } from './national-rail-handoff/national-rail-handoff.component';
import { SessionNotificationComponent } from './shared/session-notification/session-notification.component';
import { RetailHubHttpInterceptor, httpFactory } from './services/retailhub-http-interceptor.service';
import { GtmTrackMessageDirective } from './shared/analytics/gtm-track-message.directive';
import { RoutingService } from './services/routing.service';
import { SleeperService } from './services/sleeper.service';
import { DisruptionsComponent } from './qtt/disruptions/disruptions.component';
import { DisruptionsModalComponent } from './qtt/disruptions-modal/disruptions-modal.component';
import { CheapestFareFinderService } from './services/cheapest-fare-finder.service';
import { CheapestFareFinderComponent } from './cheapest-fare-finder/cheapest-fare-finder.component';
import { CffDatePickerComponent } from './cheapest-fare-finder/cff-date-picker/cff-date-picker.component';
import { CffTicketPickerComponent } from './cheapest-fare-finder/cff-date-picker/cff-ticket-picker/cff-ticket-picker.component';
import { TicketAvailabilityComponent } from './cheapest-fare-finder/cff-date-picker/cff-ticket-picker/ticket-availability/ticket-availability.component';
import { MobileTapDirective } from './shared/mobileTap.directive';
import { SleeperModalComponent } from './shared/sleeper-modal/sleeper-modal.component';
import { NotificationBoxComponent } from './shared/notification-box/notification-box.component';
import { LoginModalComponent } from './shared/login-modal/login-modal.component';
import { LoginHelperService } from './services/login-helper.service';
import { ItsoHelper } from './delivery-details/itso-helper';
import { ItsoDeliveryDetailsComponent } from './delivery-details/itso-delivery-details/itso-delivery-details.component';
import { UrlWatcherService } from './services/urlWatcher.service';
import { NreHelper } from './services/nre-helper/nre-helper';
import { FirstClassPassengerAssistedTravel } from './shared/first-class-passenger-assisted-travel/first-class-passenger-assisted-travel.component';
import { SafeAsHtml } from './save-as-html.pipe';
import { BikeCardComponent } from './shared/bike-card/bike-card.component';
import { BikeReservationDescComponent } from './shared/bike-reservation-desc/bike-reservation-desc.component';
import { BikeReservationDescCardComponent } from './shared/bike-reservation-desc-card/bike-reservation-desc-card.component';
import { StickyButtonHolderComponent } from './shared/sticky-button-holder/sticky-button-holder.component';
import { AdultChildrenPluralService } from './services/adult-children-plural.service';
import { PreferencesComponent } from './preferences/preferences.component';

@NgModule({
  bootstrap: [ AppComponent ],
  declarations: [
    AppComponent,

    // Components
    LoginComponent,
    RegisterComponent,
    ResetComponent,
    ConfirmationComponent,
    DeliveryDetailsComponent,
    FooterComponent,
    NavbarComponent,
    OutwardJourneySelectorComponent,
    PluralisePipe,
    QttComponent,
    ReturnJourneySelectorComponent,
    ReviewOrderComponent,
    SeatsAndExtrasComponent,

    SelectionsComponent,
    AddBikeComponent,
    AddPlusBusComponent,
    AddLegolandWestgateBusComponent,
    AddSeatComponent,
    AddTravelCardComponent,
    SeatsAndExtrasModalComponent,
    ViewBikeComponent,
    ViewSeatCardComponent,
    ViewTravelCardComponent,
    ViewPlusBusComponent,
    ViewLegolandWestgateBusComponent,

    CarbonFootprintComponent,
    TicketInformationComponent,
    UiNotificationsComponent,
    DisruptionsComponent,
    DisruptionsModalComponent,

    CheapestFareFinderComponent,
    CffDatePickerComponent,
    CffTicketPickerComponent,
    TicketAvailabilityComponent,
    MobileTapDirective,
    ItsoDeliveryDetailsComponent,
    PreferencesComponent,
    
    // Shared
    AddonInformationComponent,
    BasketComponent,
    ButtonComponent,
    CheckboxComponent,
    DatePickerComponent,
    DeliverySummaryComponent,
    DisruptionAlertComponent,
    ExtendSearchComponent,
    JourneyCardComponent,
    LoadingIndicatorComponent,
    NectarBoxComponent,
    OrderSummaryComponent,
    ProgressBarComponent,
    RadioComponent,
    RadioItemComponent,
    RouteDetailsComponent,
    RouteDetailsSimplifiedComponent,
    RouteCallingPointsComponent,
    RouteFacilitiesComponent,
    SelectComponent,
    StationPickerComponent,
    TabOptionComponent,
    TripCardComponent,
    PostAddressComponent,
    TicketCardComponent,
    TicketSingleCardComponent,
    TicketFirstCardComponent,
    SelfPrintFormComponent,
    NationalRailHandoffComponent,
    SessionNotificationComponent,
    NotificationBoxComponent,
    LoginModalComponent,
    FirstClassPassengerAssistedTravel,
    AlertComponent,
    BikeCardComponent,
    BikeReservationDescComponent,
    BikeReservationDescCardComponent,
    StickyButtonHolderComponent,

    // Anayltics directive for tracing view messages
    GtmTrackMessageDirective,
    SleeperModalComponent,

    // pipe
    SafeAsHtml
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    routing,
    Ng2DeviceDetector,
    RecaptchaModule.forRoot()
  ],
  providers: [
    // Services
    BasketService,
    CheapestFareFinderService,
    ConfigService,
    JourneyService,
    GtmHelperService,
    JourneySelectionService,
    RetailhubApiService,
    UiService,
    UserService,
    CookieService,
    LocationService,
    Title,
    Analytics,
    RoutingService,
    SleeperService,
    BasketContinueButtonService,
    LoginHelperService,
    ItsoHelper,
    UrlWatcherService,
    AlertService,
    AdultChildrenPluralService,

    // Guards
    NreHelper,
    BasketNotEmptyGuard,
    BasketReadyGuard,
    RequiresLoginGuard,
    WindowTopGuard,
    // Http interceptor for retailhub
    {
      deps: [XHRBackend, RequestOptions, Analytics],
      provide: RetailHubHttpInterceptor,
      useFactory: httpFactory
    }
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class AppModule { }
