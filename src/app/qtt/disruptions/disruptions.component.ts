import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JourneyService } from '../../services/journey.service';
import { CONFIG_TOKEN } from '../../constants';
import { ButtonComponent } from '../../shared/button/button.component';
import { UiService } from '../../services/ui.service';
import { Subscription } from 'rxjs/Rx';

@Component({
  selector:     'app-disruptions',
  styleUrls:    ['disruptions.component.scss'],
  templateUrl:  'disruptions.component.html'
})
export class DisruptionsComponent implements OnInit {
    public disruptionMessage: string;
    public disruptionSearchQuery: any;
    public showDisruptionModal: boolean = false;

    constructor(private route: ActivatedRoute, private router: Router, private journeyService: JourneyService, private uiService: UiService) {}

    public ngOnInit() {
        this.journeyService.disruptionsCurrentMessage.subscribe((message) => this.disruptionMessage = message);
        this.journeyService.disruptionsCurrentSearchQuery.subscribe((data) => this.disruptionSearchQuery = data);
        this.showDisruptionModal = true;
    }

    public goToSearch() {
        this.router.navigate(['/search', this.disruptionSearchQuery]);
    }
}
