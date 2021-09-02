import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Trip } from '../../models/trip';
import { ExtraGetRequest, IExtraGetResponse } from '../../models/trip/extra-get';
import { ExtraPutRequest, IExtraPutResponse, IAdditionalOptionItemSelections } from '../../models/trip/extra-put';
import { BasketService } from '../../services/basket.service';
import { CheckboxComponent } from '../../shared/checkbox/checkbox.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { UiService } from '../../services/ui.service';
import { Analytics } from '../../services/analytics.service';
import { SubscriberComponent } from '../../shared/subscriber.component';
import { CONFIG_TOKEN } from '../../constants';
import * as _ from 'lodash';
import { dateManipulationUtils } from '../../services/date-manipulation-utils.service';

@Component({
  selector: 'app-add-plus-bus',
  styleUrls: ['add-plus-bus.component.scss'],
  templateUrl: 'add-plus-bus.component.html'
})
export class AddPlusBusComponent extends SubscriberComponent implements OnInit {
  public isButtonDisabled: boolean = true;
  private trip: Trip;
  private extrasOptions: IExtrasOptions = { totalCost: 0, additionalOptionItems: [] };
  private originalExtraOptions: any;
  private busPrefAvailable: boolean = false;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private basketService: BasketService,
              private uiService: UiService,
              private analytics: Analytics,
              @Inject(CONFIG_TOKEN) private config: any) {
              super();
  }

  public ngOnInit(): void {
    this.subscriptions.push(this.route.parent.params.take(1).subscribe((params) => {
        if (params['trip']) {
          this.subscriptions.push(this.basketService.findTrip(params['trip']).take(1).subscribe((trip: Trip) => {
            this.trip = trip;

            this.subscriptions.push(this.basketService.fetchExtras(new ExtraGetRequest(this.trip.id)).take(1).subscribe((extrasOptions: IExtraGetResponse) => {
              this.originalExtraOptions = extrasOptions.additionalOptionItems.filter((x) => {
                if (x.additionaloption) {
                  return x.additionaloption.name.indexOf('PlusBus') >= 0;
                }
                return false;
              });

              this.extrasOptions.additionalOptionItems = extrasOptions.additionalOptionItems
                .filter((x) => {
                  if (x.additionaloption) {
                    return x.additionaloption.name.indexOf('PlusBus') >= 0;
                  }
                  return false;
                })
                .map((x) => {
                  let tmpName: string = x.additionaloption.name.replace('PlusBus for ', '');
                  let station: string = tmpName.substring(0, tmpName.lastIndexOf(' on '));
                  let date: string = dateManipulationUtils.getShortUkDateForBus(tmpName);
                  let cost: number = Number(x.additionaloption.totalcostallpassengersinpence) / 100;
                  let link: string = x.link;

                  return {
                    cost,
                    date,
                    directiontype: x.additionaloption.directiontype,
                    id: x.id,
                    link,
                    name: station,
                    selected: (x.state === 'None') ? false : true,
                    travelcardselectedfareid: '',
                  };
                });

              this.extrasOptions.additionalOptionItems.forEach((x) => {
                if (x.selected) {
                  this.extrasOptions.totalCost += x.cost;
                }
              });

              this.busPrefAvailable = true;
            }));

          }));
        }
      }));

    this.analytics.gtmTrackEvent({
      event: 'pop-over',
      'pop-over': 'plus bus'
    });
  }

  public calculatePrice(e: any, cost: any): void {
    if (e == true) {
      this.extrasOptions.totalCost += cost;
    } else {
      this.extrasOptions.totalCost -= cost;
    }

    this.isPlusBusDateSelected();
  }

  public addExtra(): void {
    if (this.isButtonDisabled) {
      return;
    } else {
      let additionalOptionItemSelections: IAdditionalOptionItemSelections = {
        additionaloptionitemselection: this.extrasOptions.additionalOptionItems
          .filter((x, index) => {
            if (this.originalExtraOptions[index]) {
              return (!x.selected == (this.originalExtraOptions[index].state === 'SelectionCommitted')) || (x.selected == (this.originalExtraOptions[index].state !== 'SelectionCommitted'));
            }
            return false;
          })
          .map((x) => {
            return {
              directiontype: x.directiontype,
              id: String(x.id),
              numberof: '1',
              numberofadults: '1',
              numberofchildren: '0',
              state: (x.selected) ? 'Selected' : 'None',
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
            form: 'add-plusbus',
            options: ''
          });

        }, (err: any) => {
          this.uiService.error('We encountered an unknown error connecting to our API.');
          this.backToSeatsAndExtras();
        }
      ));
    }
  }

  public backToSeatsAndExtras(): void {
    if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > -1) {
        this.basketService.refresh();
    }

    this.router.navigate(['./seats-and-extras', this.trip.id]);
  }

  public showInfoPlusBus(link): void {
    if (link) {
      if (link.indexOf('http://') == -1 && link.indexOf('https://') == -1) {
        link = 'http://' + link;
      }
      window.open(link, '_blank');
    } else {
      this.uiService.modal(`<p>PlusBus is a discount price bus pass that you can add on to the cost of your ticket. Make use of great flexibility to travel to or from the station.</p>`, true);
    }
  }

  public isPlusBusDateSelected(): void {
    if (this.extrasOptions.additionalOptionItems.length == 0) {
      this.isButtonDisabled = true;
    } else {
      this.isButtonDisabled = !_.some(this.extrasOptions.additionalOptionItems, ['selected', true]);
    }
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
    link: string
  }>;
}
