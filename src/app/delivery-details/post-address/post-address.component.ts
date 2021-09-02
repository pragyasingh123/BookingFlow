import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RetailhubApiService } from '../../services/retailhub-api.service';

@Component({
  selector: 'app-post-address',
  // styleUrls: ['./post-address.component.scss'],
  templateUrl: './post-address.component.html'
})
export class PostAddressComponent implements OnInit {
  @Input('group') public postageForm: FormGroup;
  @Output() public onChecked = new EventEmitter<boolean>();

  private addressResults: any[] = [];
  private addressesResponse: any;
  private showAddressForm: boolean = false;
  private saveAddress: number = 0;
  private lookupFailed: boolean = false;

  constructor(private _retailHubApi: RetailhubApiService) { }

  public ngOnInit(): void {
    setTimeout(() => {
      if (this.postageForm.controls[ 'address1' ].valid) {
        this.showAddressForm = true;
      }
    }, 1000);

    ['housenumber', 'postcode'].forEach((field) => {
      this.postageForm.controls[field].valueChanges.forEach(() => this.lookupFailed = false);
    });
  }

  public lookUpAddress(): void {
    this.lookupFailed = false;
    this.addressResults = [];
    if (this.postageForm.controls[ 'postcode' ].valid) {
      this._retailHubApi.post('/customer/lookupaddress', {
        housenumber: this.postageForm.value.housenumber,
        postcode: this.postageForm.value.postcode.replace(/ /g, '')
      })
        .subscribe((response) => {
          this.showAddressOptions(response.data);
          this.showAddressForm = true;
        }, (err) => {
          this.lookupFailed = true;
          this.showAddressForm = false;
        });
    } else {
      this.postageForm.controls[ 'postcode' ].markAsTouched();
    }
  }

  public enterAddressManually(event): void {
    event.preventDefault();

    for (let inner in this.postageForm.controls) {
      this.postageForm.get(inner).markAsUntouched();
      this.postageForm.get(inner).patchValue('');
    }

    this.lookupFailed = false;
    this.showAddressForm = true;
  }

  public selectAddress(form): void {
    this.postageForm.patchValue({
      address1: this.addressesResponse[form.value].addressline1 || '',
      address2: this.addressesResponse[form.value].addressline2 || '',
      address3: this.addressesResponse[form.value].addressline3 || '',
      city: this.addressesResponse[form.value].town || '',
      postcode: this.addressesResponse[form.value].postcode || '',
      region: this.addressesResponse[form.value].region || ''
    });
  }

  public addressSave(isChecked: boolean): void {
    this.saveAddress = isChecked ? 1 : 0;
    this.onChecked.emit(isChecked);
  }

  private showAddressOptions(addresses): void {
    this.addressesResponse = addresses;

    if (this.addressResults.length > 1) {
      this.addressResults.length = 0;
    }

    for (var i = 0; i < addresses.length; i++) {
      // Remove null values
      for (var k in addresses[ i ]) {
        if (typeof addresses[ i ][ k ] !== 'function') {
          if (addresses[ i ][ k ] == null) {
            addresses[ i ][ k ] = '';
          }
        }
      }

      this.addressResults.push({
        label: `${addresses[ i ].addressline1}
                ${addresses[ i ].country}
                ${addresses[ i ].countrycode}
                ${addresses[ i ].postcode}
                ${addresses[ i ].town}`,
        value: i
      });
    }
  }
  private isPostcodeFieldInvalid(): boolean {
    return this.postageForm.controls['postcode'].touched && this.postageForm.controls['postcode'].invalid ? true : false;
  }
  private isFieldInvalid(fieldName: string): boolean {
    return this.postageForm.controls[fieldName].hasError('required') && this.postageForm.controls[fieldName].touched ? true : false;
  }
}
