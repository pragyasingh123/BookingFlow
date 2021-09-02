import { Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../services/user.service';
import { UiService } from '../services/ui.service';
declare var StatefulWidget:any;

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss']
})
export class PreferencesComponent implements OnInit, AfterViewInit {

  public redirectUri = '';
  public widget:any;
  constructor(private userService: UserService, private uiService: UiService,private router: Router,
    private route: ActivatedRoute) {
      this.route.params.subscribe((params) => {
        if (params[ 'redirect' ]) {
          this.redirectUri = params[ 'redirect' ];
        }
      })
     }

  ngOnInit(): void {
    this.getWidgetToken().subscribe((data) => {
      this.loadWidget(data.token);
    },
      (err) => {
        console.log(err);
        this.uiService.alert(err.message || "Can't Load Preferences at this moment");
      });

      document.querySelector("#main-form").addEventListener("submit", (event)=> {
        this.widget.submit(); // submit widget content when  submit event heard on the form
        event.preventDefault(); // stops page reloading
        this.navigateToUrl();
    });
  }

  ngAfterViewInit() { }

  public getWidgetToken() {
    let id = localStorage.getItem('userId') || '';
    return this.userService.getWidgetToken(id);
  }

  public loadWidget(token): void {
    this.widget = StatefulWidget.load({
      id: 'widget-container',
      templateId: this.userService.templateId,
      token: token,
      display: {
          location: 'inside',
          displayButtons: false,
          displayAllNoneOptions: false,
          applyDefaultStyle: false,
          consentricLogo: false
      }
  });
  }

  public navigateToUrl() {
    if (this.redirectUri) {
      this.router.navigate( [this.redirectUri ] );
    } else {
      this.router.navigate([ '/login' ]);
    }
  }
}