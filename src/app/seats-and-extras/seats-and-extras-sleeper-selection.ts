import { ISleeperSupplementDetailGetApiResponse } from '../models/sleeper-supplement-get';

export class SleeperSelection {
    private _outwardSleeperSelection: ISleeperSupplementDetailGetApiResponse;
    private _returnSleeperSelection: ISleeperSupplementDetailGetApiResponse;

    constructor(outwardSleeperSelection?: ISleeperSupplementDetailGetApiResponse, returnSleeperSelection?: ISleeperSupplementDetailGetApiResponse) {
        this._outwardSleeperSelection = outwardSleeperSelection;
        this._returnSleeperSelection = returnSleeperSelection;
    }

    set outwardSelection(outwardSelection: ISleeperSupplementDetailGetApiResponse) {
        this._outwardSleeperSelection = outwardSelection;
    }

    set returnSelection(returnSelection: ISleeperSupplementDetailGetApiResponse) {
        this._returnSleeperSelection = returnSelection;
    }

    get outwardSelection(): ISleeperSupplementDetailGetApiResponse {
        return this._outwardSleeperSelection;
    }

    get returnSelection(): ISleeperSupplementDetailGetApiResponse {
        return this._returnSleeperSelection;
    }

    public IsOutwardSeatSelectionAvailable(): boolean {
        if (this._outwardSleeperSelection === undefined) {
            return true;
        }
        return this._outwardSleeperSelection && this._outwardSleeperSelection.code === 'XFS';
    }

    public IsReturnSeatSelectionAvailable(): boolean {
        if (this._returnSleeperSelection === undefined) {
            return true;
        }
        return this._returnSleeperSelection && this._returnSleeperSelection.code === 'XFS';
    }

    public RequiresCustomerDetails(): boolean {
        return ((this._outwardSleeperSelection && this._outwardSleeperSelection.requirescustomerdetails) ||
                (this._returnSleeperSelection && this._returnSleeperSelection.requirescustomerdetails));
    }

    public RequiresPreferences(): boolean {
        return ((this._outwardSleeperSelection && this._outwardSleeperSelection.requirespreferences) ||
                (this._returnSleeperSelection && this._returnSleeperSelection.requirespreferences));
    }
}
