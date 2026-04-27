import { expect, test } from '../../fixtures';
import { DashboardSection } from '../../page-objects/pages';

test.describe('Dashboard Page Tests', () => {
  // FIXME: dashboard is not currently present, so we are assuming a 404 for now
  test('visibility test (expect 404 until implemented)', async ({ dashboardPage }) => {
    await dashboardPage.goto(DashboardSection.COURTS);
    await dashboardPage.expectVisibleElements();
    await expect(dashboardPage.heading.heading).toContainText('Page Not Found');
  });
});
