import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Trip } from '../../models/trip';
import { ExtraGetRequest, IExtraGetResponse } from '../../models/trip/extra-get';
import { ExtraPutRequest, IExtraPutResponse, IAdditionalOptionItemSelections } from '../../models/trip/extra-put';
import { BasketService } from '../../services/basket.service';
import { UiService } from '../../services/ui.service';
import { Analytics } from '../../services/analytics.service';
import { SubscriberComponent} from '../../shared/subscriber.component';
import { AdultChildrenPluralService } from '../../services/adult-children-plural.service';

@Component({
  selector: 'app-add-legoland-westgate-bus',
  styleUrls: ['add-legoland-westgate-bus.component.scss'],
  templateUrl: 'add-legoland-westgate-bus.component.html'
})
export class AddLegolandWestgateBusComponent extends SubscriberComponent implements OnInit {
  private trip: Trip;
  private extrasOptions: IExtrasOptions = { totalCost: 0, additionalOptionItems: [] };
  private originalExtraOptions: any;
  private busPrefAvailable: boolean = false;
  private legolandOption: boolean = true;
  private searchName: string = 'Legoland Bus';
  private adultPrice: number = 4.2;
  private childPrice: number = 2;
  private gtmMessage: string = 'legoland';

  constructor(private route: ActivatedRoute,
              private router: Router,
              private basketService: BasketService,
              private uiService: UiService,
              private analytics: Analytics,
              private adultChildrenService: AdultChildrenPluralService) {
    super();
  }

  public ngOnInit(): void {
    if (this.isOxfordWestgateCase()) {
      this.legolandOption = false;
      this.searchName = 'Oxford Westgate Bus Return';
      this.adultPrice = 1;
      this.childPrice = 0.5;
      this.gtmMessage = 'oxford-westgate';
    }

    this.subscriptions.push(this.route.parent.params.subscribe((params) => {
        if (params['trip']) {
          this.basketFindTrip(params);
        }
      })
    );

    this.analytics.gtmTrackEvent({
      event: 'pop-over',
      'pop-over': this.gtmMessage + ' bus',
    });
  }

  private basketFetchExtras(): void {
    this.subscriptions.push(this.basketService.fetchExtras(new ExtraGetRequest(this.trip.id)).take(1).subscribe((extrasOptions: IExtraGetResponse) => {
        this.originalExtraOptions = extrasOptions.additionalOptionItems.filter((x) => {
          if (x.additionaloption && x.additionaloption.name) {
            return x.additionaloption.name.indexOf(this.searchName) >= 0;
          }
          return false;
        });

        this.extrasOptions.additionalOptionItems = extrasOptions.additionalOptionItems
          .filter((x) => {
            if (x.additionaloption && x.additionaloption.name) {
              return x.additionaloption.name.indexOf(this.searchName) >= 0;
            }
            return false;
          })
          .map((x) => {
            let tmpName = x.additionaloption.name.replace(this.searchName + ' Bus ', '');
            let station = tmpName.substring(0, tmpName.lastIndexOf(' on '));
            let date = tmpName.substring(tmpName.lastIndexOf(' on ') + 4);
            let cost = ((this.trip.numAdult * this.adultPrice) + (this.trip.numChild * this.childPrice));

            return {
              cost,
              date,
              directiontype: x.additionaloption.directiontype,
              id: x.id,
              label: this.showPersons(this.trip.numAdult, this.trip.numChild),
              name: station,
              selected: (x.state === 'None') ? false : true,
              travelcardselectedfareid: ''
            };
          });

        this.extrasOptions.additionalOptionItems.forEach((x) => {
          if (x.selected) {
            this.extrasOptions.totalCost += x.cost;
          }
        });

        this.busPrefAvailable = true;
      })
    );
  }

  private showPersons(adt: any, chd: any): string {
    return this.adultChildrenService.styleAdultChildDisplay(parseInt(adt), parseInt(chd), false);
   }

  private calculatePrice(e: any, cost: any): void {
    if (e == true) {
      this.extrasOptions.totalCost += cost;
    } else {
      this.extrasOptions.totalCost -= cost;
    }
  }

  private addExtra(): void {
    let additionalOptionItemSelections: IAdditionalOptionItemSelections = {
      additionaloptionitemselection: this.extrasOptions.additionalOptionItems
        .filter((item, index) => {
          if (this.legolandOption) {
            return (!item.selected == (this.originalExtraOptions[index].state === 'SelectionCommitted')) ||
              (item.selected == (this.originalExtraOptions[index].state !== 'SelectionCommitted'));
          } else {
            return item.selected;
          }
        })
        .map((item) => {
          return {
            directiontype: item.directiontype,
            id: String(item.id),
            label: this.showPersons(this.trip.numAdult, this.trip.numChild),
            numberof: this.trip.numAdult + this.trip.numChild,
            numberofadults: this.trip.numAdult,
            numberofchildren: this.trip.numChild,
            state: (item.selected) ? 'Selected' : 'None',
            travelcardselectedfareid: ''
          };
        })
    };

    let extraPutRequest = new ExtraPutRequest(this.trip.id, additionalOptionItemSelections);

    this.subscriptions.push(this.basketService.putExtra(extraPutRequest).subscribe(
      (extraPutResponse: IExtraPutResponse) => {
        this.backToSeatsAndExtras();

        this.analytics.gtmTrackEvent({
          event: 'formSubmit',
          form: 'add-' + this.gtmMessage + 'bus',
          options: ''
        });

      }, (err: any) => {
        this.uiService.error('We encountered an unknown error connecting to our API.');
        this.backToSeatsAndExtras();
      }
    ));
  }

  private backToSeatsAndExtras() {
    if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > -1) {
      this.basketService.refresh();
    }

    this.router.navigate(['./seats-and-extras', this.trip.id]);
  }

  private isOxfordWestgateCase(): boolean {
    return this.route.snapshot.url.length > 0 && this.route.snapshot.url[0].path.toLocaleLowerCase() === 'oxfordwestgate' ? true : false;
  }

  private basketFindTrip(params): void {
    this.subscriptions.push(this.basketService.findTrip(params['trip']).subscribe((trip: Trip) => {
        this.trip = trip;
        this.basketFetchExtras();
      })
    );
  }
}

interface IExtrasOptions {
  totalCost: number;
  additionalOptionItems: Array<{
    id: number,
    name: string,
    selected: boolean,
    date: string,
    cost: number,
    directiontype: string,
    travelcardselectedfareid: any,
    label: string
  }>;
}
