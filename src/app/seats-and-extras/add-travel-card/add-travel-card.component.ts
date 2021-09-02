import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { Trip, ITravelcard } from '../../models/trip';
import { ExtraGetRequest, IExtraGetResponse, ExtraGetResponse, IAdditionalOptionItem } from '../../models/trip/extra-get';
import { ExtraPutRequest, IExtraPutResponse, IAdditionalOptionItemSelections } from '../../models/trip/extra-put';
import { BasketService } from '../../services/basket.service';
import { IRadioOption } from '../../shared/radio/radio.component';
import { Analytics } from '../../services/analytics.service';
import { SubscriberComponent } from '../../shared/subscriber.component';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-add-travel-card',
  styleUrls: ['add-travel-card.component.scss'],
  templateUrl: 'add-travel-card.component.html'
})
export class AddTravelCardComponent extends SubscriberComponent implements OnInit {
  private trip: Trip;
  private tripid: number;
  private travelCardPrefAvailable: boolean = false;
  private isSendingRequest: boolean = false;
  private additionalOptionItem: IAdditionalOptionItem;
  private travelcard: ITravelcard = {
    adults: 0,
    children: 0,
    ticketTypeDescription: '',
    totalcost: 0,
    zoneDescription: ''
  };
  private whenTravellingSelection: string;
  private whenTravellingOptions: IRadioOption[] = [
    { value: 'day', label: 'Before 09:30, Monday – Friday', extra: 'Peak Travelcard', layoutClasses: ['l-tablet-inline-extra'], selected: true },
    { value: 'offpeak', label: 'After 09:30, Monday – Friday', extra: 'Off-Peak Travelcard', layoutClasses: ['l-tablet-inline-extra'] }
  ];
  private zoneSelection: string;
  private zoneOptions: IRadioOption[] = [];
  private costPermutations: ICostPermutation[] = [];
  private paramsSub: Subscription;

  constructor(private route: ActivatedRoute, private router: Router, private basketService: BasketService, private analytics: Analytics, private uiService: UiService) {
    super();
  }

  public ngOnInit(): void {
    this.subscriptions.push(this.route.parent.params.take(1).subscribe((params) => {
        if (params['trip']) {
          this.subscriptions.push(this.basketService.findTrip(params['trip']).take(1).subscribe((trip: Trip) => {
            this.trip = trip;
            this.tripid = trip.id;

            if (trip.travelcard) {
              this.travelcard = trip.travelcard;
              let isOffpeak = trip.travelcard.ticketTypeDescription.toLowerCase().indexOf('peak') >= 0;
              this.whenTravellingOptions[0].selected = !isOffpeak;
              this.whenTravellingOptions[1].selected = isOffpeak;
              this.zoneOptions.forEach((x) => x.selected = x.label === trip.travelcard.zoneDescription);
            }

            this.subscriptions.push(this.basketService.fetchExtras(new ExtraGetRequest(this.tripid)).take(1).subscribe(
              (extrasOptions: IExtraGetResponse) => {
                this.additionalOptionItem = extrasOptions.additionalOptionItems
                  .filter((x) => {
                    if (x.additionaloption && x.additionaloption.name ) {
                      return x.additionaloption.name.indexOf('Travelcard') >= 0;
                    }
                    return false;
                  })[0];

                  this.additionalOptionItem.additionaloption.zonedetailitem.map((zone, i) => {
                    this.zoneOptions.push({
                      label: 'LONDON ZONES ' + zone.description,
                      selected: (i == 0) ? true : false,
                      value: zone.description
                    });
                  });
                this.setCostPermutations(this.additionalOptionItem);
                this.travelCardPrefAvailable = true;
              }));
          }));
        }
    }));

    this.analytics.gtmTrackEvent({
      event: 'pop-over',
      'pop-over': 'travelcard'
    });
  }

  public getTotalCost(): number {
    let costPermutation = this.costPermutations.filter((x) => x.when === this.whenTravellingSelection && x.zone === this.zoneSelection)[0];

    return (costPermutation)
      ? costPermutation.cost
      : 0;
  }

  public addExtra(): void {
    if (this.additionalOptionItem.state == 'SelectionCommitted') {
      let additionalOptionItemSelections: IAdditionalOptionItemSelections = {
        additionaloptionitemselection: [{
          directiontype: this.additionalOptionItem.additionaloption.directiontype,
          id: String(this.additionalOptionItem.id),
          numberof: '0',
          numberofadults: '0',
          numberofchildren: '0',
          state: 'None',
          travelcardselectedfareid: '0034_3-1'
        }]
      };

      let extraPutRequest = new ExtraPutRequest(this.trip.id, additionalOptionItemSelections);
      this.subscriptions.push(this.basketService.putExtra(extraPutRequest).take(1).subscribe((res) => { }, (err) => {}, () => {
        this.addTravelCard();
      }));

    } else {
      this.addTravelCard();
    }
  }

  public addTravelCard(): void {
    let additionalOptionItemSelections: IAdditionalOptionItemSelections = {
      additionaloptionitemselection: [{
        directiontype: this.additionalOptionItem.additionaloption.directiontype,
        id: String(this.additionalOptionItem.id),
        numberof: '1',
        numberofadults: String(this.travelcard.adults),
        numberofchildren: String( this.travelcard.children),
        state: 'Selected',
        travelcardselectedfareid: (this.whenTravellingSelection === 'day')
          ? this.additionalOptionItem.additionaloption.zonedetailitem.filter((x) => x.description === this.zoneSelection)[0].peakfareid
          : this.additionalOptionItem.additionaloption.zonedetailitem.filter((x) => x.description === this.zoneSelection)[0].offpeakunrestrictedfareid
      }]
    };
    let extraPutRequest = new ExtraPutRequest(this.tripid, additionalOptionItemSelections);
    this.isSendingRequest = true;
    this.subscriptions.push(this.basketService.putExtra(extraPutRequest).take(1).subscribe(
      (extraPutResponse: IExtraPutResponse) => {
        this.backToSeatsAndExtras();
        this.isSendingRequest = false;
        this.analytics.gtmTrackEvent({
          event: 'formSubmit',
          form: 'add-london-travelcard',
          options: additionalOptionItemSelections.additionaloptionitemselection[0].travelcardselectedfareid
        });
    }, (err: any) => {
      this.uiService.error('We encountered an unknown error connecting to our API.');
      this.backToSeatsAndExtras();
    }));
  }

  public backToSeatsAndExtras(): void {
    if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > -1) {
      this.basketService.refresh();
    }
    this.router.navigate(['./seats-and-extras', this.tripid]);
  }

  private setCostPermutations(additionalOptionItem: IAdditionalOptionItem): void {
    if (additionalOptionItem) {
      additionalOptionItem.additionaloption.zonedetailitem.forEach((x) => {
        if (x.description === '1-4') {
          this.costPermutations.push({
            cost: Number(x.offpeakunrestrictedcostpence) / 100,
            when: 'offpeak',
            zone: x.description
          });
          this.costPermutations.push({
            cost: Number(x.peakfarecostpence) / 100,
            when: 'day',
            zone: x.description
          });
        } else {
          this.costPermutations.push({
            cost: Number(x.offpeakunrestrictedcostpence) / 100,
            when: 'offpeak',
            zone: x.description
          });
          this.costPermutations.push({
            cost: Number(x.peakfarecostpence) / 100,
            when: 'day',
            zone: x.description
          });
        }
      });
    }
  }
}

interface ICostPermutation {
  when: string;
  zone: string;
  cost: number;
}
