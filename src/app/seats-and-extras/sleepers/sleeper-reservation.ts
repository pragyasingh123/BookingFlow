import { ISleeperPreference } from './sleeper-preference';

export interface ISleeperReservation {
    personTitle: string;
    firstname: string;
    surname: string;
    telephone: string;
    sleeperPreferences: ISleeperPreference[];
}
