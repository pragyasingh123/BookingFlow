import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Device } from 'ng2-device-detector/src/index';
import { IWindow } from '../models/confirmation-ga';

@Injectable()
export class RoutingService {
    public constructor(private router: Router, private device: Device) { }

    public redirectToTicketSelection(): void {
        if (this.device.isMobile()) {
            this.redirectMobile();
        } else {
            this.redirectDesktop();
        }
    }

    public redirectMobile(): any {
        let queryOptions = JSON.parse(window.localStorage.getItem('queryOptions'));

        if (queryOptions) {
            window.localStorage.removeItem('queryOptions');
            this.router.navigate([ '/qtt', queryOptions ]);
            return;
        }

        this.router.navigate([ '/qtt' ]);
    }

    public redirectDesktop(): any {
        this.router.dispose();
        window.location.href = '/tickets';
    }
}
