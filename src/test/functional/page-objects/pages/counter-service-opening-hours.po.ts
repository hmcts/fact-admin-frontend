import { Locator, Page, expect } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class CounterServiceOpeningHoursPage extends Base {
  public readonly addCounterServiceButton: Locator;
  public readonly backToCounterServiceLink: Locator;
  public readonly deleteOpeningHoursButton: Locator;
  public readonly errorSummary: Locator;
  public readonly counterServiceTable: Locator;
  public readonly saveButton: Locator;
  public readonly successPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.addCounterServiceButton = this.page.getByRole('button', { name: 'Add opening hours' });
    this.backToCounterServiceLink = this.page.getByRole('link', { name: 'Back to Counter service opening hours' });
    this.deleteOpeningHoursButton = this.page.getByRole('button', { name: 'Delete opening hours' });
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.counterServiceTable = this.page.getByRole('table');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildListUrl(courtId));
  }

  async gotoAdd(courtId: string): Promise<void> {
    await this.page.goto(`${this.buildListUrl(courtId)}/add`);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async selectAssistWith(option: string): Promise<void> {
    await this.page.getByLabel(option).check();
  }

  async selectAppointmentNeeded(value: 'yes' | 'no'): Promise<void> {
    await this.page.locator(`input[name="appointmentNeeded"][value="${value}"]`).check();
  }

  async fillAppointmentContact(contact: string): Promise<void> {
    await this.page.locator('#appointmentContact').fill(contact);
  }

  counterServiceRow(assistanceAvailable: string): Locator {
    return this.counterServiceTable.locator('tbody tr').filter({
      has: this.page.getByRole('cell', { name: assistanceAvailable, exact: true }),
    });
  }

  async selectSameTime(): Promise<void> {
    const sameTimeYes = this.page.locator('input[name="sameTime"][value="yes"]');
    await expect(sameTimeYes).toBeVisible();
    await sameTimeYes.check();
  }

  async selectDifferentTimes(): Promise<void> {
    const sameTimeNo = this.page.locator('input[name="sameTime"][value="no"]');
    await expect(sameTimeNo).toBeVisible();
    await sameTimeNo.check();
  }

  async fillSameOpeningTimes(
    openingHour: string,
    openingMinute: string,
    closingHour: string,
    closingMinute: string
  ): Promise<void> {
    await this.page.locator('#sameOpeningHour').fill(openingHour);
    await this.page.locator('#sameOpeningMinute').fill(openingMinute);
    await this.page.locator('#sameClosingHour').fill(closingHour);
    await this.page.locator('#sameClosingMinute').fill(closingMinute);
  }

  async selectDay(day: string): Promise<void> {
    await this.page.getByLabel(day).check();
  }

  async fillDayOpeningTimes(
    dayPrefix: string,
    openingHour: string,
    openingMinute: string,
    closingHour: string,
    closingMinute: string
  ): Promise<void> {
    await this.page.locator(`#${dayPrefix}OpeningHour`).fill(openingHour);
    await this.page.locator(`#${dayPrefix}OpeningMinute`).fill(openingMinute);
    await this.page.locator(`#${dayPrefix}ClosingHour`).fill(closingHour);
    await this.page.locator(`#${dayPrefix}ClosingMinute`).fill(closingMinute);
  }

  async clickFirstEditLink(): Promise<void> {
    await this.counterServiceTable.getByRole('link', { name: 'Edit', exact: true }).first().click();
    await expect(this.page.locator('input[name="sameTime"][value="yes"]')).toBeVisible();
  }

  async clickBackToCounterService(): Promise<void> {
    await this.backToCounterServiceLink.click();
    await expect(this.counterServiceTable).toBeVisible();
  }

  async clickFirstDeleteLink(): Promise<void> {
    await this.counterServiceTable.getByRole('link', { name: 'Delete', exact: true }).first().click();
  }

  async clickDeleteOpeningHours(): Promise<void> {
    await this.deleteOpeningHoursButton.click();
  }

  buildListUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/counter-service-opening-hours`;
  }
}
