import { Component, Output, EventEmitter, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RecaptchaComponent } from 'ng-recaptcha';
import { UserService } from '../../services/user.service';
import { UiService } from '../../services/ui.service';
import { RetailhubApiService } from '../../services/retailhub-api.service';
import { LoginHelperService } from '../../services/login-helper.service';
import { SubscriberComponent } from '../subscriber.component';

@Component({

  selector: 'app-login-modal',
  styleUrls: ['login-modal.component.scss'],
  templateUrl: 'login-modal.component.html'
})
export class LoginModalComponent extends SubscriberComponent {

  @ViewChild('captchaRef') public captchaRef: RecaptchaComponent;
  @Output() public closeEvent = new EventEmitter<boolean>();

  private loginForm: FormGroup;
  private loginInProgress: boolean = false;

  constructor(private router: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private uiService: UiService,
    private retailhubApiService: RetailhubApiService,
    private loginHelperService: LoginHelperService
  ) {
    super();
    this.loginForm = fb.group({
      email: [ null, Validators.required ],
      password: [ null, Validators.required ],
    });
  }

  public closeModal(event): void {
    if (event.target.className.indexOf('modal-close-icon') === 0 || event.target.className.indexOf('login-blanket') === 0) {
      this.closeEvent.emit(false);
    }
  }

  public onLoginSuccessHideModal(): void {
    this.closeEvent.emit(true);
  }

  public forgottenPassword(): void {
    this.router.navigate([ '/reset', { redirect: this.currentUrlAddress() } ]);
  }

  public register(): void {
    this.router.navigate([ '/register', { redirect: this.currentUrlAddress() } ]);
  }

  public captchaResolved(token: string): void {
    if (token) {
      this.submitForm(token);
    }
  }

  public currentUrlAddress(): string {
    return this.router.url.replace('/', '');
  }

  public submitForm(captchaToken: string): void {
    this.loginInProgress = true;

    const userLogin = {
      captchaToken,
      password: this.loginForm.value.password.trim(),
      username: this.loginForm.value.email.trim().toLowerCase()
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
  public afterLogin(loginResponse): void {
    this.loginHelperService.analyticsSetup(loginResponse, '/delivery');
    this.loginInProgress = false;
    this.onLoginSuccessHideModal();
  }

  public loginFail(error): void {
    this.loginInProgress = false;
    this.captchaRef.reset();
    this.loginHelperService.loginError(error);
  }

}
