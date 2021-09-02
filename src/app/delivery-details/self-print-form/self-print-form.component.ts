import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IRadioOption } from '../../shared/radio/radio.component';
import { ISelectOption } from '../../shared/select/select.component';
import { DeliveryOption } from '../../models/delivery-option';
import { Analytics } from '../../services/analytics.service';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-self-print-form',
  styleUrls: ['../delivery-details.component.scss'],
  templateUrl: './self-print-form.component.html'
})
export class SelfPrintFormComponent implements OnInit {
  @Input('group') public printForm: FormGroup;
  @Input('option') public option: DeliveryOption;
  @Output() public onIsLead = new EventEmitter<boolean>();
  @Output() public onSelect = new EventEmitter<any>();

  public isLeadTraveller: boolean;
  private selfPrintInfo: string = `
      <h1>How to use</h1>
      <p>This is available to UK and overseas customers.  Once the booking has been completed a pdf format ticket (requires Adobe Acrobat Reader to view) will be generated, with an individual piece of paper for each named passenger and journey.  This must be printed by you on plain white A4 paper using black ink, in portrait layout, using a standard inkjet or laser printer prior to making your journey.  Any ticket that is illegible will not be valid and a new ticket will have to be purchased.</p>
      <h1>Identification</h1>
      <p><strong>The lead passenger must travel with the identification document specified when making the booking.<strong> The last four digits of the selected identification document are recorded on the ticket for verification purposes.  Accepted identification documents are either the passport, driving licence or credit/debit card of the lead passenger.</p>
      <p>If more than one person is travelling on the same booking, individual tickets will be issued for each passenger and journey, but only the lead passenger needs to specify identification documentation to carry when travelling.  If, however, identification documentation for accompanying passengers is provided when making the booking, that documentation must also be carried when making the journey, as its details will be recorded on the ticket.</p>
      <p><strong>Without this identification, Self-Print tickets will not be valid and new tickets at the full fare will have to be purchased.</strong></p>`;
  private leadTravellerOptions: IRadioOption[] = [
    {value: true, label: 'Yes', selected: true},
    {value: false, label: 'No'},
  ];
  private personalIdOptions: ISelectOption[] = [
    {value: 'CCD', label: 'Credit Card'},
    {value: 'DCD', label: 'Debit Card'},
    {value: 'PPT', label: 'Passport'},
    {value: 'DLC', label: 'Driving Licence'},
    {value: 'AFC', label: 'Armed Forces Card'},
    {value: 'NIC', label: 'National Insurance Card'},
    {value: 'NHS', label: 'NHS Card'}
  ];

  constructor(private uiService: UiService,
              private analytics: Analytics) {
    this.isLeadTraveller = true;
  }

  public ngOnInit(): void {}

  public toggleTraveller(isLead): void {
    this.isLeadTraveller = isLead;
    this.onIsLead.emit(this.isLeadTraveller);
  }

  public showDeliveryInformation(e: any, option: DeliveryOption): void {
    e.preventDefault();
    let content = `<h3>${option.name}</h3> <p>${option.description}</p> <p>${option.instructions}</p>`;
    this.uiService.modal(content, true, 8);

    this.analytics.gtmTrackEvent({
      'engagement-name': 'view-ticket-restrictions',
      event: 'pop-over',
      options: 'none',
    });
  }

  public selectedID(idType): void {
    this.onSelect.emit(idType.value);
  }
}
