import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { AlertService } from '../../services/alert.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector:   'app-alert',
  styleUrls:  ['alert.component.scss'],
  templateUrl: 'alert.component.html'
})

export class AlertComponent {
  public alerts: IAlert[];

  constructor(private alertService: AlertService) { }

  public ngOnInit(): void {
    this.alertService.getAlertsCollection().subscribe((alerts) => { this.alerts = alerts; });
  }
}

interface IAlert {
  Id: string;
  Content: string;
}
