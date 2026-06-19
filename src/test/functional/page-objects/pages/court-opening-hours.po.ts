import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class CourtOpeningHoursPage extends Base {
  public readonly addOpeningHoursButton: Locator;
  public readonly backToOpeningHoursLink: Locator;
  public readonly deleteOpeningHoursButton: Locator;
  public readonly errorSummary: Locator;
  public readonly openingHoursTable: Locator;
  public readonly saveButton: Locator;
  public readonly successPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.addOpeningHoursButton = this.page.getByRole('button', { name: 'Add opening hours' });
    this.backToOpeningHoursLink = this.page.getByRole('link', { name: 'Back to opening hours' });
    this.deleteOpeningHoursButton = this.page.getByRole('button', { name: 'Delete opening hours' });
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.openingHoursTable = this.page.getByRole('table');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildListUrl(courtId));
  }

  async gotoAdd(courtId: string): Promise<void> {
    await this.page.goto(`${this.buildListUrl(courtId)}/add`);
  }

  async clickAddOpeningHours(): Promise<void> {
    await this.addOpeningHoursButton.click();
  }

  async clickBackToOpeningHours(): Promise<void> {
    await this.backToOpeningHoursLink.click();
  }

  async clickFirstEditLink(): Promise<void> {
    await this.page.getByRole('link', { name: 'Edit' }).first().click();
  }

  async clickEditLinkForType(typeName: string): Promise<void> {
    await this.openingHoursRow(typeName).getByRole('link', { name: 'Edit' }).click();
  }

  async clickFirstDeleteLink(): Promise<void> {
    await this.page.getByRole('link', { name: 'Delete' }).first().click();
  }

  async clickDeleteLinkForType(typeName: string): Promise<void> {
    await this.openingHoursRow(typeName).getByRole('link', { name: 'Delete' }).click();
  }

  async clickDeleteOpeningHours(): Promise<void> {
    await this.deleteOpeningHoursButton.click();
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async selectOpeningHoursType(typeName: string): Promise<void> {
    await this.page.getByLabel('Select type').selectOption({ label: typeName });
  }

  async selectFirstAvailableOpeningHoursType(): Promise<string> {
    const typeName = (await this.getSelectableOpeningHoursTypeNames())[0];

    if (!typeName) {
      throw new Error('No opening hours type options are available to select');
    }

    await this.selectOpeningHoursType(typeName);

    return typeName;
  }

  async getOpeningHoursTypeNames(): Promise<string[]> {
    return (await this.openingHoursTable.locator('tbody tr td:first-child').allTextContents()).map(typeName =>
      typeName.trim()
    );
  }

  async getSelectableOpeningHoursTypeNames(): Promise<string[]> {
    return (await this.page.locator('#openingHourTypeId option').allTextContents())
      .map(typeName => typeName.trim())
      .filter(typeName => typeName && !typeName.toLowerCase().includes('select'));
  }

  openingHoursRow(typeName: string): Locator {
    return this.openingHoursTable.locator('tbody tr').filter({
      has: this.page.getByRole('cell', { name: typeName, exact: true }),
    });
  }

  async selectSameTime(): Promise<void> {
    await this.page.getByLabel('Yes').check();
  }

  async selectDifferentTimes(): Promise<void> {
    await this.page.getByLabel('No').check();
  }

  async selectDay(day: string): Promise<void> {
    await this.page.getByLabel(day).check();
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

  buildListUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/court-opening-hours`;
  }
}
