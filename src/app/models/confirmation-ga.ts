import * as moment from 'moment';
import { Basket } from './basket';

export class ConfirmationGA implements IGA {
    // tslint:disable-next-line: variable-name
    public OrderID: string;
    // tslint:disable-next-line: variable-name
    public Total: string;
    // tslint:disable-next-line: variable-name
    public DeliveryCharge: string;
    // tslint:disable-next-line: variable-name
    public CardFee: string = '';
    // tslint:disable-next-line: variable-name
    public AdditionalOptions: string = '';
    // tslint:disable-next-line: variable-name
    public City: string;
    // tslint:disable-next-line: variable-name
    public County: string;
    // tslint:disable-next-line: variable-name
    public Country: string = 'United Kingdom';
    // tslint:disable-next-line: variable-name
    public BookingRef: string;
    // tslint:disable-next-line: variable-name
    public BasketItems: any;
    public event: string;
    private apiResponse: any;

    constructor(basket: Basket, orderId: string, bookingRef: string, gtmEvent: string) {
        this.event = gtmEvent;
        this.OrderID = orderId;
        this.Total = basket.totalCostPence.toString();
        this.DeliveryCharge = basket.selectedDeliveryOption.pricePence.toString();
        this.BookingRef = bookingRef;
        this.event;
        this.BasketItems = [];
        for (var i = 0; i < basket.trips.length; i++) {
            let trip = basket.trips[i];
            let hasReturnTrip = trip.returnJourneys.length > 0;

            this.BasketItems.push({
                Adults: `${trip.numAdult}`,
                Children: `${trip.numChild}`,
                Destination: trip.outwardJourneys[0].destination.id,
                FirstClassUpgrade: '',
                LeadTime: '',
                NewItem: '',
                Origin: trip.outwardJourneys[0].origin.id,
                OutwardDate: moment(trip.outwardJourneys[0].departureTime).format('DD/MM/YYYY'),
                OutwardOperators: '',
                OutwardTime: moment(trip.outwardJourneys[0].departureTime).format('HH:mm'),
                Passengers: (trip.numAdult + trip.numChild).toString(),
                RailcardCount: trip.numRailcard,
                RailcardUsed: trip.railcardCode,
                RemovedItem: '',
                ReturnDate: hasReturnTrip ? moment(trip.returnJourneys[0].departureTime).format('DD/MM/YYYY') : '',
                ReturnOperators: '',
                ReturnTime: hasReturnTrip ? moment(trip.returnJourneys[0].departureTime).format('HH:mm') : '',
                RouteCode: trip.routeCode,
                SingleAsReturn: (trip.ticketTypes.length === 2 && trip.ticketTypes[0].journeytype === 'S' && trip.ticketTypes[1].journeytype === 'S') ? 1 : 0,
                TicketCategory: trip.ticketTypes[0].journeytype,
                TicketClass: trip.ticketTypes[0].class,
                TicketPrice: trip.totalCostPence,
                TicketPricePounds: (trip.totalCostPence / 100).toFixed(2),
                TicketType: trip.outwardJourneys[0].ticketTypeCode,
                UnitPrice: `${(trip.totalCostPence / 100).toFixed(2)}`,
            });
        }
    }
}

export interface IGA {
    OrderID: string;
    Total: string;
    DeliveryCharge: string;
    CardFee: string;
    AdditionalOptions: string;
    City: string;
    County: string;
    Country: string;
    BasketItems: Array<{
        Origin: string;
        Destination: string;
        TicketType: string;
        TicketPrice: number;
        TicketCategory: string;
        OutwardDate: string;
        ReturnDate: string;
        Passengers: string;
        OutwardOperators: string;
        ReturnOperators: string;
        OutwardTime: string;
        ReturnTime: string;
        RouteCode: string;
        SingleAsReturn: string;
        TicketPricePounds: string;
        Adults: string;
        Children: string;
        UnitPrice: string;
        LeadTime: string;
        FirstClassUpgrade: string;
        NewItem: string;
        RemovedItem: string;
        RailcardUsed: string;
        RailcardCount: string;
        TicketClass: string;
    }>;
    event: string;
}

export interface IWindow {
    dataLayer: any;
    SCBeacon: {
        trackEvent?: any,
        trackGoal?: any,
        trackOutcome?: any
    };
    location: {
        hostname?: any,
        href?: any,
        origin?: any,
        hash?: any,
        pathname?: any
    };
    scroll: any;
    scrollX: any;
    scrollY: any;
}
