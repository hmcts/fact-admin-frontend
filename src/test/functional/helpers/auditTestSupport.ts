import { Page } from '@playwright/test';

import { expect } from '../fixtures';
import { AddCourtPage } from '../page-objects/pages/add-court.po';
import { CourtAddressDeletePage } from '../page-objects/pages/court-address-delete.po';
import { GeneralPage } from '../page-objects/pages/general.po';
import {
  buildTestAddress,
  createAddressViaManualEntry,
  getFirstDeleteAddressId,
} from '../tests/pages/court-address-test-support';
import { config } from '../utils';

import { withTestCourtPrefix } from './testSupport';

type PlaywrightLike = Parameters<typeof withTestCourtPrefix>[0];

export type SeededAuditTrail = {
  courtId: string;
  originalCourtName: string;
  updatedCourtName: string;
  superAdminEmail: string;
};

export type SeedAuditTrailViaUiOptions = {
  addCourtPage: AddCourtPage;
  courtAddressDeletePage: CourtAddressDeletePage;
  generalPage: GeneralPage;
  page: Page;
  playwright: PlaywrightLike;
  prefixLabel?: string;
  includeDelete?: boolean;
  run: (seededAuditTrail: SeededAuditTrail) => Promise<void>;
};

function getCourtIdFromAddressUrl(url: string): string {
  const courtId = /\/courts\/([^/]+)\/edit\/address/.exec(url)?.[1];
  if (!courtId) {
    throw new Error(`Unable to extract court id from URL: ${url}`);
  }

  return courtId;
}

export async function seedAuditTrailViaUi({
  addCourtPage,
  courtAddressDeletePage,
  generalPage,
  page,
  playwright,
  prefixLabel = 'Audit Functional Test',
  includeDelete = true,
  run,
}: SeedAuditTrailViaUiOptions): Promise<void> {
  await withTestCourtPrefix(playwright, prefixLabel, async ({ courtNamePrefix }) => {
    const originalCourtName = `${courtNamePrefix} Court`;
    const updatedCourtName = `${originalCourtName} Updated`;

    await addCourtPage.goto();
    await addCourtPage.createCourt(originalCourtName);

    await expect(addCourtPage.loadingStatus).toContainText('New court has been created');
    await expect(addCourtPage.page).toHaveURL(/\/courts\/[^/]+\/edit\/address$/, { timeout: 9000 });

    const courtId = getCourtIdFromAddressUrl(addCourtPage.page.url());

    await generalPage.goto(courtId);
    await generalPage.updateCourtName(updatedCourtName);
    await generalPage.save();
    await expect(generalPage.successPanel).toContainText('General details saved');

    if (includeDelete) {
      // Create addresses to guarantee there is a deletable record and then delete one.
      await createAddressViaManualEntry(page, courtId, buildTestAddress(`AuditDeleteOne${Date.now()}`));
      await createAddressViaManualEntry(page, courtId, buildTestAddress(`AuditDeleteTwo${Date.now()}`));

      const deleteAddressId = await getFirstDeleteAddressId(page, courtId);
      await courtAddressDeletePage.goto(courtId, deleteAddressId);
      await courtAddressDeletePage.clickDeleteAddress();
      await page.waitForTimeout(500);
    }

    await run({
      courtId,
      originalCourtName,
      updatedCourtName,
      superAdminEmail: config.users.superAdmin.email,
    });
  });
}
