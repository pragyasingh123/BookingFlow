import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BasketService } from '../../services/basket.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { Subscription } from 'rxjs/Rx';

@Component({
  selector: 'app-add-modal',
  styleUrls: ['seats-and-extras-modal.component.scss'],
  templateUrl: 'seats-and-extras-modal.component.html'
})

export class SeatsAndExtrasModalComponent implements OnInit, OnDestroy {
  private tripId: number;
  private paramsSub: Subscription;

  constructor(private route: ActivatedRoute, private router: Router, private basketService: BasketService) { }

  public ngOnInit(): void {
    // params
    this.paramsSub = this.route.params.subscribe((params) => {
      if (params['trip']) {
        this.tripId = params['trip'];
      }
    });
  }

  public backToSeatsAndExtras(): void {
    this.router.navigate(['./seats-and-extras', this.tripId]);
  }

  public ngOnDestroy(): void {
    this.paramsSub.unsubscribe();
  }
}
