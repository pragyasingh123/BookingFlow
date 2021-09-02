export class NreHelper {
  public static checkIfNreVisualFlagIsSet(): boolean {
    return sessionStorage.getItem(this.nreVisualFlag) === 'true' ? true : false;
  }

  public static removeNreVisualFLag(): void {
    if (this.checkIfNreVisualFlagIsSet()) {
      sessionStorage.removeItem(this.nreVisualFlag);
    }
  }

  public static setNreHandedOffVisualSession(): void {
    sessionStorage.setItem(this.nreVisualFlag, 'true');
  }

  public static checkIfNreSystemFlagIsSet(): boolean {
    return sessionStorage.getItem(this.nreSystemFlag) === 'true' ? true : false;
  }

  public static setNreHandedOffSystemSession(): void {
    sessionStorage.setItem(this.nreSystemFlag, 'true');
  }

  private static nreSystemFlag: string = 'nreHandedOff';
  private static nreVisualFlag: string = 'nreHandedOffVisualFlag';
}
