import { IWindow } from './../../models/confirmation-ga';
import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, IRegisterPostRequest } from '../../services/user.service';
import { ISelectOption } from '../../shared/select/select.component';
import { Title } from '@angular/platform-browser';
import { UiService } from '../../services/ui.service';
import { Analytics } from '../../services/analytics.service';
import { RecaptchaComponent } from 'ng-recaptcha';
import { CONFIG_TOKEN } from '../../constants';
import * as _ from 'lodash';
import { SubscriberComponent } from '../../shared/subscriber.component';
import { IUserApiResponse } from '../../models/user';
import { LoginHelperService} from '../../services/login-helper.service';

declare let window: IWindow;

@Component({
  selector: 'app-register',
  styleUrls: ['register.component.scss'],
  templateUrl: 'register.component.html'
})

export class RegisterComponent extends SubscriberComponent implements OnInit {
  @ViewChild('captchaRef') public captchaRef: RecaptchaComponent;
  public contactPost: boolean = false;
  public contactApp: boolean = false;
  public contactEmail: boolean = false;
  public im16yearsOld: boolean = false;
  public noContact: boolean = false;
  public contactSMS: boolean = false;
  public acceptTermsandConditions: boolean = false;
  public canWeContactValidation: boolean = false;
  public canWeContactValidationMsg: string = '';
  public acceptTermsandConditionsValidationMsg: string = '';
  public termsAndConditions: string = '';
  public privacyPolicy: string = '';
  public passwordValidationMessage: string = '';
  public showPasswordValidationMessage: boolean = false;

  private title: string = null;
  private firstName = '';
  private lastName = '';
  private nectarcardnumber = '';
  private mobileNumber: string = null;
  private email = '';
  private confirmEmail = '';
  private password = '';
  private password2 = '';
  private redirectUri = '';
  private selectOptions = 'Select a title';
  private registerInProgress = false;
  private personTitleOptions: ISelectOption[] = [
    { label: 'Mr' },
    { label: 'Mrs' },
    { label: 'Ms' },
    { label: 'Miss' },
    { label: 'Mx' },
    { label: 'Dr' },
    { label: 'Rev' },
    { label: 'Lady' },
    { label: 'Lord' },
    { label: 'Sir' },
    { label: 'Dame' }
  ];

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title,
    private analytics: Analytics,
    private uiservice: UiService,
    private loginHelperService: LoginHelperService,
    @Inject(CONFIG_TOKEN) private config: any) {
    super();
  }

  public ngOnInit() {
    this.titleService.setTitle('Register');

    this.subscriptions.push(this.route.params.subscribe((params) => {
        if (params[ 'redirect' ]) {
          this.redirectUri = params[ 'redirect' ];
        }
        this.registerInProgress = false;
      })
    );
    this.analytics.trackPage(this.titleService.getTitle());
    this.termsAndConditions = this.config.data.links.termsAndConditions;
    this.privacyPolicy = this.config.data.links.privacyPolicy;
  }

  public onCheckedContactSMS(isChecked: boolean): void {
    this.contactSMS = isChecked;
    this.noContact = false;
    this.canWeContactYouValidation();
  }

  public onCheckedContactPost(isChecked: boolean): void {
    this.contactPost = isChecked;
    this.noContact = false;
    this.canWeContactYouValidation();
  }

  public onCheckedContactApp(isChecked: boolean): void {
    this.contactApp = isChecked;
    this.noContact = false;
    this.canWeContactYouValidation();
  }

  public onCheckedContactEmail(isChecked: boolean): void {
    this.contactEmail = isChecked;
    this.noContact = false;
    this.canWeContactYouValidation();
  }

  public onCheckedContactConfirm16(isChecked: boolean): void {
    this.im16yearsOld = isChecked;
    this.noContact = false;
    this.canWeContactYouValidation();
  }

  public onCheckedNoContact(isChecked: boolean): void {
    this.noContact = isChecked;
    this.contactPost = false;
    this.contactApp = false;
    this.contactEmail = false;
    this.im16yearsOld = false;
    this.contactSMS = false;
    this.canWeContactYouValidation();
  }

  public onCheckedTermsAndConditions(isChecked: boolean): void {
    this.acceptTermsandConditions = isChecked;
    if (!isChecked) {
      this.acceptTermsandConditionsValidationMsg = 'Please confirm your agree to continue.';
    }
  }

  public onChangePasswordValidate(inputValue: string): boolean {
    var pattern = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\u0022\u0021\u0040\u0024\u0025\u005E\u0026\u002A\u0028\u0029\u007B\u007D\u003A\u003B\u003C\u003E\u002C\u002E\u003F\u002F\u002B\u002D\u005F\u003D\u007C\u0027\u005B\u005D\u007E\u005C])[A-Za-z\d\u0022\u0021\u0040\u0024\u0025\u005E\u0026\u002A\u0028\u0029\u007B\u007D\u003A\u003B\u003C\u003E\u002C\u002E\u003F\u002F\u002B\u002D\u005F\u003D\u007C\u0027\u005B\u005D\u007E\u005C]{8,}$/);

    var passwordContainsFirstName = this.isStringInPassword(inputValue, this.firstName);
    var passwordContainsLastName = this.isStringInPassword(inputValue, this.lastName);

    if (pattern.test(inputValue) && !passwordContainsFirstName && !passwordContainsLastName) {
      this.passwordValidationMessage = '';
      this.showPasswordValidationMessage = false;
      return true;
    } else {
      if (inputValue.length < 8) {
        this.passwordValidationMessage = 'Your password must have at least 8 characters.';
        this.showPasswordValidationMessage = true;
        return false;
      }

      if ((inputValue.search(/[^\x00-\x7F]/) > 0) || (inputValue.search(/[#]/) > 0)) {
        this.passwordValidationMessage = 'Your password contains an invalid character.';
        this.showPasswordValidationMessage = true;
        return false;
      }

      if (inputValue === inputValue.toLowerCase()) {
        this.passwordValidationMessage = ' Your password must have at least one upper case letter.';
        this.showPasswordValidationMessage = true;
        return false;
      }

      if (inputValue === inputValue.toUpperCase()) {
        this.passwordValidationMessage = 'Your password must have at least one lower case letter.';
        this.showPasswordValidationMessage = true;
        return false;
      }

      if (inputValue.search(/[0-9]/) < 0) {
        this.passwordValidationMessage = 'Your password must have at least one digit.';
        this.showPasswordValidationMessage = true;
        return false;
      }

      if (passwordContainsFirstName || passwordContainsLastName) {
        this.passwordValidationMessage = 'Must not contain your name or email address.';
        this.showPasswordValidationMessage = true;
        return false;
      }

      if (inputValue.search(/["!@$%^&*(){}:;<>,.?/+\-_=|'[\]~\\]/) < 0) {
        this.passwordValidationMessage = 'Your password must have at least one special character.';
        this.showPasswordValidationMessage = true;
        return false;
      } else {
        this.passwordValidationMessage = 'Your password contains an invalid character.';
        this.showPasswordValidationMessage = true;
        return false;
      }
    }
  }

  public onRegisterUser(): void {
    this.captchaRef.resolved.observers = [];
    this.captchaRef.resolved.subscribe((token, error) => {
      if (error) {
        return new Error("Can't generate captcha token");
      }
      if (token) {
        this.submitForm(token);
      }
    });
    this.captchaRef.execute();
  }

  private canWeContactYouValidation(): void {
    if (!this.contactSMS && !this.contactApp && !this.contactEmail && !this.im16yearsOld && !this.noContact) {
      this.canWeContactValidationMsg = 'Please select a contact method';
      this.canWeContactValidation = false;
      return;
    }

    if ((this.contactSMS || this.contactApp || this.contactEmail) && this.im16yearsOld) {
      this.canWeContactValidation = true;
      return;
    }

    if ((this.contactSMS || this.contactApp || this.contactEmail) && !this.im16yearsOld) {
      this.canWeContactValidationMsg = 'Please confirm you are at least 16 years old to continue';
      this.canWeContactValidation = false;
      return;
    } else if ((!this.contactSMS || !this.contactApp || !this.contactEmail) && this.im16yearsOld) {
      this.canWeContactValidationMsg = 'Please choose a contact method';
      this.canWeContactValidation = false;
      return;
    } else {
      this.canWeContactValidation = true;
      return;
    }
  }

  private submitForm(captchaToken: string): void {
    this.registerInProgress = true;
    this.mobileNumber = this.mobileNumber ? this.mobileNumber.length == 0 ? this.mobileNumber = null : this.mobileNumber : this.mobileNumber = null;
    let registerRequest = this.createRegisterRequest(captchaToken);
    this.subscriptions.push(this.userService
      .register(registerRequest)
      .subscribe(
        (registerResponse) => this.registerComplete(registerResponse),
        (error) => this.onError(error)));
  }

  private registerComplete(response: IUserApiResponse): void {
    this.analytics.gtmTrackEvent({
      'engagement-name': 'account-creation',
      event: 'engagement',
      options: this.redirectUri
    });
    // localStorage.setItem('userId', response.userprofile.id);
    this.loginUser(response);
    this.registerInProgress = false;
  }

  private loginUser(userResponse: IUserApiResponse): void {
    this.userService.isLoggedIn$.next(true);
    this.loginHelperService.analyticsSetup(userResponse, this.redirectUri);
    // this.router.navigate([ '/preferences',  { redirect: this.redirectUri }]);

    if (this.redirectUri) {
      this.router.navigate( [this.redirectUri ] );
    } else {
      this.router.navigate([ '/login' ]);
    }
  }

  private onError(err): void {
    let errorMsg = err.errors[0]; // There is always one error available in the list
    if (errorMsg.indexOf('Invalid card number') >= 0) {
      errorMsg = 'Your tpexpress.co.uk account has been created successfully but your Nectar card number was not recognised. You can retry adding your Nectar card by logging into my account.';
      this.uiservice.alert(errorMsg);
      setTimeout(() => {
        this.router.navigate( [this.redirectUri ] );
      }, 1000);
    } else {
      this.uiservice.error(errorMsg.substr(errorMsg.indexOf(':') + 1));
    }
    this.registerInProgress = false;
    this.captchaRef.reset();
  }

  private createRegisterRequest(captchaToken: string): IRegisterPostRequest {
    return {
      canwecontactyou: {
        app: this.contactApp,
        email: this.contactEmail,
        im16YearsOld: this.im16yearsOld,
        noThanks: this.noContact,
        post: this.contactPost,
        sms: this.contactSMS
      },
      captchaToken,
      customerProfile: {
        email: this.email.toLowerCase(),
        firstname: this.firstName,
        lastname: this.lastName,
        title: this.title
      },
      mobilenumber: this.mobileNumber,
      nectarcardnumber: this.nectarcardnumber,
      password: this.password,
    };
  }

  private isStringInPassword(password: string, stringInPassword: string): boolean {
    return password.toLowerCase().indexOf(stringInPassword.toLowerCase()) !== -1;
  }

  private redirectTo(): void {
    this.router.navigate([ '/login', { redirect: this.redirectUri } ]);
  }
}
