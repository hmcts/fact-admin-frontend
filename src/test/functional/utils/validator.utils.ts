import { expect } from '../fixtures';

export class ValidatorUtils {
  /**
   * Validates a given date in the format of "18 Oct 2024"
   * and ensures the date can be parsed
   *
   * @param date {@link string} - the date
   *
   */
  public validateDate(date: string): void {
    const dateRegex = /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/;
    expect(date).toMatch(dateRegex);
    expect(Date.parse(date)).not.toBe(Number.NaN);
  }
}
