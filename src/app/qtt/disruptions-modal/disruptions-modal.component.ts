import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button.component';
import { Subscription } from 'rxjs/Rx';
import { JourneyService } from '../../services/journey.service';
import { CONFIG_TOKEN } from '../../constants';
import * as _ from 'lodash';

@Component({
  selector: 'app-disruptions-modal',
  styleUrls: ['disruptions-modal.component.scss'],
  templateUrl: 'disruptions-modal.component.html'
})

export class DisruptionsModalComponent implements OnInit, OnDestroy {
  public lastSearchCriteria: any;

  constructor(private route: ActivatedRoute, private router: Router, private journeyService: JourneyService) {}

  public ngOnInit(): void {
    this.journeyService.disruptionsCurrentSearchQuery.subscribe((data) => this.lastSearchCriteria = data);
  }

  public backToQtt(): void {
    if (this.lastSearchCriteria.railcards) {
      let tempArr = [];

      _.forEach(JSON.parse(this.lastSearchCriteria.railcards), function(index) {
        let tempObj = {
          adults: index.Adults,
          children: index.Children,
          code: index.Code,
          number: index.Number
        };
        tempArr.push(tempObj);
      });

      this.lastSearchCriteria.railcards = JSON.stringify(tempArr);
    }

    this.router.navigate(['/qtt', this.lastSearchCriteria]);
  }

  public ngOnDestroy() {}
}
