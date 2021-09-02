import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RetailhubApiService } from '../services/retailhub-api.service';
import { UiService } from '../services/ui.service';
import { Basket } from '../models/basket';
import { JourneySelectionService } from '../services/journey-selection-service';
import { Analytics } from '../services/analytics.service';
import { CookieService, CookieOptionsArgs } from 'angular2-cookie/core';
import { SleeperService } from '../services/sleeper.service';
import { JourneyService } from '../services/journey.service';
import { CONFIG_TOKEN } from '../constants';
import { GtmHelperService } from '../services/gtm-helper.service';
import { Title } from '@angular/platform-browser';
import * as moment from 'moment';
import * as _ from 'lodash';

import {
  TestBed,
  ComponentFixture,
  inject,
} from '@angular/core/testing';

import { QttComponent } from './qtt.component';
import { of } from 'rxjs/observable/of';

describe('Component: Qtt', async () => {
  let retailhubApiService:RetailhubApiService;
  let uiService:UiService;
  let journeySelectionService:JourneySelectionService;
  let sleeperService:SleeperService;
  let analyticsService:Analytics;
  let journeyService:JourneyService;
  let gtmHelperService:GtmHelperService;
  let cookieService:CookieService;
  let titleService:Title;

  beforeEach(async () => {
    // addProviders([CONFIG_TOKEN]);
    const routerStub = ()=>({});
    const activatedRouteStub = () => ({
      params: { subscribe: f => f({}) },
      snapshot: { data: { initialExpense: {}, workLocationArray: [{}] } }
    });
    const retailhubStub = ()=>({});
    const uiServiceStub = ()=>({
            alert: (message)=> { return message}
    });
    const journeySelectionStub = ()=>({
            parseGtmSearchParams:()=>{}, 
            isHandoff:()=> { return true}, 
            parseUrlParams:()=>{return {origin: 'test1', destination: 'test2', datetimedepart: moment(), outwardDepartAfter: moment(), adults: 1, children:1}},
            parseSearchParams:()=>{}
          });
    const sleeperServiceStub = ()=>({
            clear: ()=>{ return 'success'}
          });
    const analyticsServiceStub = ()=>({
            trackPage: ()=>{}
    });
    const journeyServiceStub = ()=>({
            parseGtmSearchParams:()=>{},
            disruptionsCurrentMessage: of(),
            disruptionsCurrentSearchQuery: of(),
            getDisruptions: of()
          });
    const gtmHelperServiceStub = ()=> ({ 
            isAboutToPush: of([]),
            registerClickEvent:()=>{},
            discardId:()=>{},
            init: ()=>{},
            pushNewFieldValue: ()=> { return 'qtt_Submit'},
            registerValidationErrorEvent: ()=> { return 'error'}
          });
    const cookieServiceStub = ()=>({
            put: (arg1, arg2, obj)=>{}
          });
    const titleServiceStub = ()=>({
            getTitle: ()=>{ return 'QTT'},
            setTitle: (title)=>{ return true}
          });
    const connfigTokenStub = ()=>({});

    TestBed.configureTestingModule({
        schemas: [NO_ERRORS_SCHEMA],
        declarations: [QttComponent],
        imports: [FormsModule, ReactiveFormsModule],
        providers:[
          { provide: Router, useFactory:routerStub},
          { provide: ActivatedRoute, useFactory:activatedRouteStub},
          { provide: RetailhubApiService, useFactory:retailhubStub},
          { provide: UiService, useFactory:uiServiceStub},
          { provide: JourneySelectionService, useFactory:journeySelectionStub},
          { provide: SleeperService, useFactory:sleeperServiceStub},
          { provide: Analytics, useFactory:analyticsServiceStub},
          { provide: JourneyService, useFactory:journeyServiceStub},
          { provide: GtmHelperService, useFactory:gtmHelperServiceStub},
          { provide: CookieService , useFactory:cookieServiceStub},
          { provide: Title , useFactory:titleServiceStub},
          { provide: CONFIG_TOKEN , useFactory:connfigTokenStub}
        ]
    }).compileComponents();
    retailhubApiService = TestBed.get(RetailhubApiService);
    uiService = TestBed.get(UiService);
    journeySelectionService = TestBed.get(JourneySelectionService);
    analyticsService = TestBed.get(Analytics);
    journeyService = TestBed.get(JourneyService);
    gtmHelperService = TestBed.get(GtmHelperService);
    cookieService = TestBed.get(CookieService);
    titleService = TestBed.get(Title);
    sleeperService = TestBed.get(SleeperService);
});
 
  it('should create an instance', async () => {
    const fixture = TestBed.createComponent(QttComponent);
    const component = fixture.debugElement.componentInstance;
    expect(component).toBeTruthy();
  });

  describe('ngOnInit:method', async ()=>{
    it("noOnit Sholud be called", ()=>{
      // const routerStub: Router = fixture.debugElement.injector.get(Router);
      const fixture = TestBed.createComponent(QttComponent);
      const component = fixture.debugElement.componentInstance;
      component.availableRailcards = [1];
      spyOn(journeySelectionService, 'parseGtmSearchParams').and.callFake(()=>{});
      spyOn(titleService, 'getTitle').and.callFake(()=> { return 'Title'});
      spyOn(titleService, 'setTitle').and.callFake(()=> { return 'Title'});
      spyOn(analyticsService, 'trackPage').and.callFake(()=>{});
      spyOn(sleeperService, 'clear').and.callFake(()=>{});
      spyOn(cookieService, 'put').and.callFake(()=>{});
      spyOn<any>(component, 'loadRailcards').and.callFake(()=>{});
      component.ngOnInit();
      expect(titleService.getTitle).toHaveBeenCalled();
      expect(titleService.setTitle).toHaveBeenCalled();
      expect(analyticsService.trackPage).toHaveBeenCalled();
      expect(sleeperService.clear).toHaveBeenCalled();
      expect(cookieService.put).toHaveBeenCalled();
     
    })
  })

  describe('toggleMoreOptions:method', async ()=>{

    it('hasMoreOptions should be toggled', ()=>{
      const fixture = TestBed.createComponent(QttComponent);
      const component = fixture.debugElement.componentInstance;
      component.hasMoreOptions = true;
      spyOn(gtmHelperService, 'registerClickEvent').and.callFake(()=> { return 'qtt_checkbox_more_options'});
      component.toggleMoreOptions();
      expect(component.hasMoreOptions).toBe(false);
      expect(gtmHelperService.registerClickEvent).toHaveBeenCalled();
    })

    it('hasMoreOptions should be toggled', ()=>{
      const fixture = TestBed.createComponent(QttComponent);
      const component = fixture.debugElement.componentInstance;
      component.hasMoreOptions = false;
      spyOn(gtmHelperService, 'registerClickEvent').and.callFake(()=> { return 'qtt_checkbox_more_options'});
      component.toggleMoreOptions();
      expect(component.hasMoreOptions).toBe(true);
      expect(gtmHelperService.registerClickEvent).toHaveBeenCalled();
    })

  })

  describe('search:method', async()=>{
    
    it('Outbound journey must be in the future', ()=>{
      const fixture = TestBed.createComponent(QttComponent);
      const component = fixture.debugElement.componentInstance;
      component.outwardDateSelection = { hour: ()=>{ return { minute: ()=>{ return { second: ()=>{}, format: ()=> {} } } } } };
      component.timeOptionSelection = {
        value: {hour: ()=>{}, minute: ()=>{}},
        lable: ''
      }
      component.adultOptionSelection = component.childOptionSelection = component.departOptionSelection = { value: ''}
      spyOn(gtmHelperService, 'pushNewFieldValue').and.callFake(()=> { return 'qtt_Submit'});
      spyOn(gtmHelperService, 'registerValidationErrorEvent').and.callFake(()=> { return 'error'});
      spyOn(gtmHelperService, 'discardId').and.callFake(()=> { return ''});
      spyOn(uiService, 'alert').and.callFake(()=> { return 'error'});
      spyOn(journeyService, 'getDisruptions').and.callFake(()=> { return of()});
      component.search();
      expect(gtmHelperService.pushNewFieldValue).toHaveBeenCalled();
    });

    it('Return must take place after outbound journey', ()=>{
      const fixture = TestBed.createComponent(QttComponent);
      const component = fixture.debugElement.componentInstance;
      component.outwardDateSelection = { hour: ()=>{ return { minute: ()=>{ return { second: ()=>{}, format: ()=> {} } } } } };
      component.timeOptionSelection = {
        value: {hour: ()=>{}, minute: ()=>{}},
        lable: ''
      }
      component.adultOptionSelection = component.childOptionSelection = component.departOptionSelection = { value: ''}
      spyOn(gtmHelperService, 'pushNewFieldValue').and.callFake(()=> { return 'qtt_Submit'});
      spyOn(gtmHelperService, 'registerValidationErrorEvent').and.callFake(()=> { return 'error'});
      spyOn(gtmHelperService, 'discardId').and.callFake(()=> { return ''});
      spyOn(uiService, 'alert').and.callFake(()=> { return 'error'});
      spyOn(journeyService, 'getDisruptions').and.callFake(()=> { return of()});
      component.search();
      expect(gtmHelperService.pushNewFieldValue).toHaveBeenCalled();
    })
  })

  describe('onStationSelected:method', ()=>{
    
  })

  describe('onViaAvoidStationSelected:method', ()=>{
    
  })
  
  describe('outboundDateSelect:method', ()=>{
    
  })
    
  describe('onCheckedReturnTicket:method', ()=>{
    
  })
    
  describe('onCheckedOpenReturn:method', ()=>{
    
  })
    
  describe('onCheckedRailcard:method', ()=>{
    
  })
    
  describe('handleAmendJourney:method', ()=>{
    
  })
      
  describe('handleHandoff:method', ()=>{
    
  })
      
  describe('loadInitials:method', ()=>{
    
  })
      
  describe('loadRailcards:method', ()=>{
    
  })
      
  describe('parseRailcardFromString:method', ()=>{
    
  })
});
