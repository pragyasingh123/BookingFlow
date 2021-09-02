import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Title } from '@angular/platform-browser';
import { Analytics } from '../../services/analytics.service';
import { RecaptchaComponent } from 'ng-recaptcha';
import { SubscriberComponent } from '../../shared/subscriber.component';
import { CONFIG_TOKEN } from '../../constants';
import { UiService } from '../../services/ui.service';
import { ItsoHelper } from '../../delivery-details/itso-helper';

@Component({
  selector: 'app-reset',
  styleUrls: ['reset.component.scss'],
  templateUrl: 'reset.component.html'
})

export class ResetComponent extends SubscriberComponent implements OnInit {
  @ViewChild('captchaRef') public captchaRef: RecaptchaComponent;

  private resetInProgress: boolean = false;
  private isSubmitted = false;
  private email = '';
  private redirectUri = '';
  private myAccountLink: string = '';
  private companyEmail: string = 'noreply@tpexpress.co.uk';

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title,
    private uiService: UiService,
    private analytics: Analytics,
    @Inject(CONFIG_TOKEN) private config: any) {
    super();
  }

  public ngOnInit() {
    this.titleService.setTitle('Reset password');
    this.analytics.trackPage(this.titleService.getTitle());

    this.subscriptions.push(this.route.params.subscribe((params) => {
        if (params[ 'redirect' ]) {
          this.redirectUri = params[ 'redirect' ];
        }
        this.resetInProgress = false;
      })
    );

    this.myAccountLink = this.config.myAccount + '/MyAccount/ForgottenPassword';
  }

  private gotoRegister(): void {
    this.router.navigate(['/register', { redirect: this.redirectUri }]);
  }

  private gotoLogin(): void {
    if (ItsoHelper.wasUserRedirectedFromDeliveryItsoStep(this.redirectUri)) {
      this.router.navigate([this.redirectUri]);
    } else {
      this.router.navigate(['/login', {redirect: this.redirectUri}]);
    }
  }

  private captchaExecute(): void {
    this.resetInProgress = true;
    this.captchaRef.execute();
  }

  private captchaResolved(token: string): void {
    if (token) {
      this.submitForm(token);
    } else {
      this.resetInProgress = false;
    }
  }

  private submitForm(captchaToken: string): void {
    this.resetInProgress = true;
    this.subscriptions.push(this.userService.sendResetPasswordEmail({
        captchaToken,
        email: this.email.trim()
      }).subscribe((response) => {
        this.isSubmitted = true;
        this.resetInProgress = false;
      }, (err) => {
      if (err.statusCode < 500) {
        this.isSubmitted = true;
      } else {
        this.uiService.error("Sorry, there's a problem with our system. Please try again later.");
      }
      this.resetInProgress = false;
    }));
  }
}
