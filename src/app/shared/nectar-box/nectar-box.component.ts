import { Component, OnInit, Input} from '@angular/core';
import { Basket } from '../../models/basket';
import { BasketService } from '../../services/basket.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector:   'app-nectar-box',
  styleUrls:  ['nectar-box.component.scss'],
  templateUrl: 'nectar-box.component.html'
})
export class NectarBoxComponent implements OnInit {
  @Input() public nectarPts: number;
  @Input() public journeyComplete: boolean = false;

  private isLoggedIn: boolean = false;
  private nectarCardRegistered: boolean = false;
  private nectarLeadingNums: number = 12345678910;
  private nectarCardNum: number = null;
  private addingInProgress: boolean = false;
  private nectarError: boolean = false;
  private errorMsg: string = '';
  private nectarCardRegisteredSuccess: boolean = false;
  private nectarCardRegisteredSuccessMessage: 'Nectar card added.';
  private currentUrl = '';
  private parameters: any;
  private showAddButtonAddNectrCard: boolean = true;

  constructor(private basketService: BasketService,
              private userService: UserService,
              private route: ActivatedRoute,
              private router: Router,
              private activatedRoute: ActivatedRoute) {
                this.userService.isLoggedIn$.subscribe((x) => this.isLoggedIn = x );
              }

  public ngOnInit(): void {
    this.nectarCardNum = null;
    this.isLoggedIn = this.userService.userAuthenticated();
    if (this.isLoggedIn) {
      this.userService.getLoyaltycard().subscribe((x) => {
        if (x) {
          this.nectarCardRegistered = true;
        }
      });
    }
  }

  public logIn(): void {
    this.router.navigate(['/login', { redirect: this.router.url.substr(1) }]);
  }

  public onComponentFocus(): void {
    this.nectarError = false;
  }

  public addNectarCard(): void {
    if (/^(\d{11})$/.test(this.nectarCardNum.toString()) || this.nectarCardNum.toString().length === 0) {
      let loyaltycardPostRequest = { schematypy: 'Nectar', eventcontext: 'ExistingUser', cardnumber: `${this.nectarCardNum}` };
      this.addingInProgress = true;
      this.userService.postLoyaltycard(loyaltycardPostRequest)
      .subscribe((x) => {
        if (x) {
          this.nectarCardRegisteredSuccess = true;
          this.nectarCardRegistered = true;
        }
      }, (error: any) => {
        this.errorMsg = error;
        this.nectarError = true;
        this.addingInProgress = false;
      }, () => {
        this.addingInProgress = false;
      });
    } else {
      this.nectarError = true;
      this.errorMsg = 'Please enter at least 11 digits characters.';
    }
  }
}
