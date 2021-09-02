import { Injectable } from '@angular/core';
import { SleeperSelection } from '../seats-and-extras/seats-and-extras-sleeper-selection';
import { ISleeperReservation } from '../seats-and-extras/sleepers/sleeper-reservation';
import { IRadioOption } from '../shared/radio/radio.component';
import { ISleeperSupplementDetailGetApiResponse} from '../models/sleeper-supplement-get';

@Injectable()
export class SleeperService {
    get isEmpty() {
        return this.sleeperReservation === undefined || this.sleeperSelection === undefined;
    }
    public isOutwardSleeper: boolean;
    public isReturnSleeper: boolean;
    public sleeperSelection: SleeperSelection;
    public sleeperReservation: ISleeperReservation;

    constructor() {}

    public setSelectedSleeperOption(outwardOptions: IRadioOption[], returnOptions: IRadioOption[]): void {
        if (!this.sleeperSelection) {
            return;
        }

        this.setLegSelectedSleeperOption(outwardOptions, this.sleeperSelection.outwardSelection);
        this.setLegSelectedSleeperOption(returnOptions, this.sleeperSelection.returnSelection);
    }

    public clear(): void {
        this.sleeperSelection = undefined;
        this.sleeperReservation = undefined;
    }

    private setLegSelectedSleeperOption(options: IRadioOption[], sleeperSelection: ISleeperSupplementDetailGetApiResponse): void {
        if (options.length == 0) {
            return;
        }

        if (options.length > 0 && !sleeperSelection) {
            options[0].selected = true;
            return;
        }

        options.forEach((element) => {
            if (sleeperSelection.code === element.value) {
                element.selected = true;
                return;
            } else {
                element.selected = false;
            }
        });
    }
}
