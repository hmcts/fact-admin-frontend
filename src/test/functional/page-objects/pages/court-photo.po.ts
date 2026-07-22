import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export type PhotoFilePayload = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

export class CourtPhotoPage extends Base {
  public readonly currentPhoto: Locator;
  public readonly noPhotoWarning: Locator;
  public readonly photoInput: Locator;
  public readonly photoError: Locator;
  public readonly uploadButton: Locator;
  public readonly deleteButton: Locator;
  public readonly continueButton: Locator;
  public readonly cancelButton: Locator;
  public readonly errorSummary: Locator;
  public readonly confirmationDetails: Locator;
  public readonly successPanel: Locator;
  public readonly continueUpdatingLink: Locator;
  public readonly homeLink: Locator;

  constructor(page: Page) {
    super(page);
    this.currentPhoto = this.page.getByRole('img', { name: 'Court photo' });
    this.noPhotoWarning = this.page.locator('.govuk-warning-text');
    this.photoInput = this.page.locator('input[type="file"][name="photo"]');
    this.photoError = this.page.locator('#photo-error');
    this.uploadButton = this.page.getByRole('button', { name: 'Upload', exact: true });
    this.deleteButton = this.page.getByRole('button', { name: 'Delete', exact: true });
    this.continueButton = this.page.getByRole('button', { name: 'Continue', exact: true });
    this.cancelButton = this.page.getByRole('button', { name: 'Cancel', exact: true });
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.confirmationDetails = this.page.locator('.govuk-summary-list');
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
    this.continueUpdatingLink = this.mainContent.content.getByRole('link', { name: /Continue updating / });
    this.homeLink = this.mainContent.content.getByRole('link', { name: 'Home', exact: true });
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildCourtPhotoUrl(courtId));
  }

  async selectPhoto(file: PhotoFilePayload): Promise<void> {
    await this.photoInput.setInputFiles(file);
  }

  async uploadSelectedPhoto(): Promise<void> {
    await this.uploadButton.click();
  }

  async uploadPhoto(file: PhotoFilePayload): Promise<void> {
    await this.selectPhoto(file);
    await this.uploadSelectedPhoto();
  }

  async requestDelete(): Promise<void> {
    await this.deleteButton.click();
  }

  async confirmDelete(): Promise<void> {
    await this.continueButton.click();
  }

  async cancelDelete(): Promise<void> {
    await this.cancelButton.click();
  }

  buildCourtPhotoUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/photo`;
  }

  buildUploadUrl(courtId: string): string {
    return this.buildCourtPhotoUrl(courtId) + '/upload';
  }

  buildDeleteConfirmationUrl(courtId: string): string {
    return this.buildCourtPhotoUrl(courtId) + '/delete';
  }

  buildDeleteSuccessUrl(courtId: string): string {
    return this.buildDeleteConfirmationUrl(courtId) + '/success';
  }
}
