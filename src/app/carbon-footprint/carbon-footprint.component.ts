import { Component, OnInit, Input } from '@angular/core';
import { Trip } from '../models/trip';

@Component({
    selector: 'app-carbon-footprint',
    styleUrls: [ 'carbon-footprint.component.scss' ],
    templateUrl: 'carbon-footprint.component.html'
}) export class CarbonFootprintComponent implements OnInit {
    @Input() public isSingleReturn: any;
    @Input() public trip: Trip;
    public totalNumberOfTickets: number = 0;
    public carEmission: number = 0;
    public trainEmission: number = 0;
    public percentageEmissionSaving: number = 0;
    public hasData: boolean = true;

    constructor() { }

    public ngOnInit(): void {
        this.totalNumberOfTickets = Number(this.trip.numAdult) + Number(this.trip.numChild);

        this.carEmission = this.trip.carbonFootPrintCalculation.carCo2Usage;
        this.trainEmission = this.trip.carbonFootPrintCalculation.trainCo2Usage;
        this.percentageEmissionSaving = this.trip.carbonFootPrintCalculation.percentOfEmmissionSaving;
    }
}
