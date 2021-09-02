import { Component, OnInit, Inject } from '@angular/core';
import { CONFIG_TOKEN } from '../constants';

@Component({
  selector: 'app-footer',
  styleUrls: ['footer.component.scss'],
  templateUrl: 'footer.component.html'
})

export class FooterComponent implements OnInit {
  private footerLinks: any;
  private domainName: string;

  constructor(@Inject(CONFIG_TOKEN) private config: any) {
    this.footerLinks = config.data.links.footer;
    this.domainName = config.domainName;
  }

  public ngOnInit() {}
}
