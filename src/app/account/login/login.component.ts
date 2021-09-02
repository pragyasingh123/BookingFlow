import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Location } from '@angular/common';
import * as _ from 'lodash';
import { RetailhubApiService } from '../../services/retailhub-api.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { UiService } from '../../services/ui.service';
import { Analytics } from '../../services/analytics.service';
import { IWindow } from '../../models/confirmation-ga';
import { Device } from 'ng2-device-detector/src/index';
import { RecaptchaComponent } from 'ng-recaptcha';
import { BasketContinueButtonService } from '../../services/basket-continue-button.service';
import { LoginHelperService} from '../../services/login-helper.service';
import { SubscriberComponent } from '../../shared/subscriber.component';

declare var window: IWindow;

@Component({
  selector: 'app-login',
  styleUrls: [ 'login.component.scss' ],
  templateUrl: 'login.component.html'
})

export class LoginComponent extends SubscriberComponent implements OnInit {
  @ViewChild('captchaRef') public captchaRef: RecaptchaComponent;
  public email = '';
  public password = '';
  public redirectUri = '';
  public loginInProgress = false;
  public loginForm: FormGroup;
  private tooManyRequests: boolean = false;
  private formValidationStatus: boolean = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private uiService: UiService,
    private titleService: Title,
    private location: Location,
    private fb: FormBuilder,
    private analytics: Analytics,
    private device: Device,
    private retailhubApiService: RetailhubApiService,
    private basketContinueButtonService: BasketContinueButtonService,
    private loginHelperService: LoginHelperService
  ) {
    super();
    this.loginForm = fb.group({
      email: [ null, Validators.required ],
      password: [ null, Validators.required ],
    });
    this.retailhubApiService.retryAfterAmountOfSeconds$.subscribe(
      (res) => {
        let retryAfterErrorMessage = 'You have attempted to login too many times, please try again in ' + this.loginHelperService.secondsToHumanRedableFormat(res);
        this.tooManyRequests = true;
        this.uiService.error(retryAfterErrorMessage);
      }
    );
    this.retailhubApiService.otherErrorsGuard$.subscribe(
      (res) => {
        this.tooManyRequests = res;
      }
    );
  }

  public ngOnInit() {
    this.titleService.setTitle('Sign in');
    this.analytics.trackPage(this.titleService.getTitle());

    this.subscriptions.push(this.route.params.subscribe((params) => {
        if (params[ 'redirect' ]) {
          this.redirectUri = params[ 'redirect' ];
        }
        this.loginInProgress = false;
      })
    );
  }

  public gotoRegister(): void {
    this.router.navigate([ '/register', { redirect: this.redirectUri } ]);
  }

  public gotoReset(): void {
    this.router.navigate([ '/reset', { redirect: this.redirectUri } ]);
  }

  public captchaResolved(token: string): void {
    if (token) {
      this.submitForm(this.loginForm.value, token);
    }
  }

  private submitForm(value: any, captchaToken: string): void {
    this.loginInProgress = true;
    const userLogin = {
      captchaToken,
      password: value.password.trim(),
      username: value.email.trim().toLowerCase(),
    };
    this.subscriptions.push(this.userService.login(userLogin)
      .subscribe((response) => {
        this.userService.isLoggedIn$.next(true);
        this.afterLogin(response);
      }, (error: any) => {
        this.loginFail(error);
      }, () => {
        this.captchaRef.reset();
        this.loginInProgress = false;
      })
    );
  }
  private afterLogin(loginResponse): void {
    this.loginHelperService.analyticsSetup(loginResponse, this.redirectUri);
      if (this.redirectUri) {
        this.router.navigateByUrl(this.redirectUri);
      } else {
        this.location.back();
      }
    this.loginInProgress = false;
  }
  private loginFail(error): void {
    this.loginInProgress = false;
    this.captchaRef.reset();
    this.loginHelperService.loginError(error);
  }
}
