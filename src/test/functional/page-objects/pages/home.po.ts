import { Locator, Page, expect } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export enum PageSection {
  LISTS = '/lists',
  DOWNLOAD = '/download',
  ADD_COURT = '/add-court',
  ADD_SERVICE_CENTRE = '/add-service-centre',
  BULK_UPDATE = '/bulk-update',
  AUDITS = '/audits',
}

export class HomePage extends Base {
  public readonly applyFiltersButton: Locator;
  public readonly clearFiltersButton: Locator;
  public readonly courtsTab: Locator;
  public readonly downloadNavigationLink: Locator;
  public readonly favouritesPaginationNextLink: Locator;
  public readonly favouritesPaginationPreviousLink: Locator;
  public readonly favouritesTab: Locator;
  public readonly favouritesTable: Locator;
  public readonly includeClosedCheckbox: Locator;
  public readonly noResultsMessage: Locator;
  public readonly onlyServiceCentresCheckbox: Locator;
  public readonly regionSelect: Locator;
  public readonly paginationNextLink: Locator;
  public readonly paginationPreviousLink: Locator;
  public readonly partialCourtNameInput: Locator;
  public readonly resultsMessage: Locator;
  public readonly statusColumnHeader: Locator;
  public readonly tableHeaders: Locator;
  public readonly table: Locator;

  constructor(page: Page) {
    super(page);
    this.applyFiltersButton = this.page.getByRole('button', { name: 'Apply filters' });
    this.clearFiltersButton = this.page.getByRole('button', { name: 'Clear filters' });
    this.courtsTab = this.page.getByRole('tab', { name: 'Courts' });
    this.downloadNavigationLink = this.page.getByRole('link', { name: 'Download csv' });
    this.favouritesPaginationNextLink = this.page.locator('#favourites').getByRole('link', { name: 'Next' });
    this.favouritesPaginationPreviousLink = this.page.locator('#favourites').getByRole('link', { name: 'Previous' });
    this.favouritesTab = this.page.getByRole('tab', { name: 'Favourites' });
    this.favouritesTable = this.page.locator('#favourites table.homepage-favourites-table');
    this.includeClosedCheckbox = this.page.getByLabel('Include closed');
    this.noResultsMessage = this.page.getByText('No courts, tribunals or service centres match the current filters.');
    this.onlyServiceCentresCheckbox = this.page.getByLabel('Only show service centres');
    this.regionSelect = this.page.getByLabel('Region');
    this.paginationNextLink = this.page.locator('#courts').getByRole('link', { name: 'Next' });
    this.paginationPreviousLink = this.page.locator('#courts').getByRole('link', { name: 'Previous' });
    this.partialCourtNameInput = this.page.getByLabel('Search courts, tribunals and service centres');
    this.resultsMessage = this.page.locator('#courts .govuk-body').first();
    this.statusColumnHeader = this.page.getByRole('columnheader', { name: 'Status' });
    this.tableHeaders = this.page.locator('#courts table.homepage-courts-table thead th');
    this.table = this.page.locator('#courts table.homepage-courts-table');
  }

  async goto(): Promise<void> {
    await this.page.goto(config.urls.homePageUrl);
  }

  async gotoSection(section: PageSection): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + section);
  }

  async searchForCourt(partialCourtName: string, includeClosed = false): Promise<void> {
    await this.partialCourtNameInput.fill(partialCourtName);

    if (includeClosed) {
      await this.includeClosedCheckbox.check();
    } else {
      await this.includeClosedCheckbox.uncheck();
    }

    await this.applyFiltersButton.click();
  }

  async searchForCourtInRegion(partialCourtName: string, regionId: string, includeClosed = false): Promise<void> {
    await this.partialCourtNameInput.fill(partialCourtName);
    await this.regionSelect.selectOption(regionId);

    if (includeClosed) {
      await this.includeClosedCheckbox.check();
    } else {
      await this.includeClosedCheckbox.uncheck();
    }

    await this.applyFiltersButton.click();
  }

  async searchForServiceCentresOnly(partialCourtName: string): Promise<void> {
    await this.partialCourtNameInput.fill(partialCourtName);
    await this.onlyServiceCentresCheckbox.check();
    await this.applyFiltersButton.click();
  }

  async expectCourtVisible(courtName: string): Promise<void> {
    await expect(this.table.getByRole('cell', { exact: true, name: courtName })).toBeVisible();
  }

  async expectCourtHidden(courtName: string): Promise<void> {
    await expect(this.table.getByRole('cell', { exact: true, name: courtName })).toHaveCount(0);
  }

  async expectFavouriteVisible(locationName: string): Promise<void> {
    await expect(this.favouritesTable.getByRole('cell', { exact: true, name: locationName })).toBeVisible();
  }

  async expectFavouriteHidden(locationName: string): Promise<void> {
    await expect(this.favouritesTable.getByRole('cell', { exact: true, name: locationName })).toHaveCount(0);
  }

  async openFavouritesTab(): Promise<void> {
    await this.favouritesTab.click();
  }

  async addFavourite(locationName: string): Promise<void> {
    await this.table.getByRole('button', { exact: true, name: `Add ${locationName} to favourites` }).click();
  }

  async removeFavourite(locationName: string, fromFavouritesTab = false): Promise<void> {
    const table = fromFavouritesTab ? this.favouritesTable : this.table;
    await table.getByRole('button', { exact: true, name: `Remove ${locationName} from favourites` }).click();
  }

  async expectFavouriteButtonState(locationName: string, favourite: boolean): Promise<void> {
    const action = favourite ? 'Remove from favourites' : 'Add to favourites';
    const button = this.table.getByRole('button', { exact: true, name: `${action} for ${locationName}` });
    await expect(button).toHaveAttribute('aria-pressed', favourite.toString());
  }

  async expectFavouriteTooltip(locationName: string, favourite: boolean): Promise<void> {
    const action = favourite ? 'Remove from favourites' : 'Add to favourites';
    const button = this.table.getByRole('button', { exact: true, name: `${action} for ${locationName}` });
    const tooltipId = await button.getAttribute('aria-describedby');
    if (!tooltipId) {
      throw new Error(`Favourite button for ${locationName} does not describe a tooltip.`);
    }
    const tooltip = this.page.locator(`#${tooltipId}`);

    await button.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText(action);

    await button.focus();
    await expect(button).toBeFocused();
    await expect(tooltip).toBeVisible();
  }

  async clickClearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
  }

  async clickEditForCourt(courtName: string): Promise<void> {
    await this.table
      .locator('tr')
      .filter({ hasText: courtName })
      .getByRole('link', { name: `Edit ${courtName}` })
      .click();
  }

  async clickReviewForCourt(courtName: string): Promise<void> {
    await this.table
      .locator('tr')
      .filter({ hasText: courtName })
      .getByRole('link', { name: `Review ${courtName}` })
      .click();
  }

  async getViewHrefForCourt(courtName: string): Promise<string | null> {
    return this.table
      .locator('tr')
      .filter({ hasText: courtName })
      .getByRole('link', { name: `View ${courtName}` })
      .getAttribute('href');
  }

  async clickSortByName(): Promise<void> {
    await this.tableHeaders.getByRole('link', { name: /Name/ }).click();
  }

  async clickSortByLastUpdated(): Promise<void> {
    await this.tableHeaders.getByRole('link', { name: /Last updated/ }).click();
  }

  async getCourtNames(): Promise<string[]> {
    return this.table.locator('tbody tr td:first-child').allTextContents();
  }
}
