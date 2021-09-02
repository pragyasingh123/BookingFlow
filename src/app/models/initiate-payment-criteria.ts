export class InitiatePaymentCriteria {
  public successUrl: string;
  public failureUrl: string;
  public backUrl: string;
  public device: string;
  public isNreReferrer: boolean;

  constructor() {
    let origin = window.location.origin || (window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : ''));
    let currentPath = origin + window.location.pathname;
    this.successUrl = currentPath + '#/confirmation';
    this.failureUrl = currentPath + '#/review-order';
    this.backUrl = currentPath + '#/review-order';
  }
}
