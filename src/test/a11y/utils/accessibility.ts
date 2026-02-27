import { AxeBuilder } from '@axe-core/playwright';
import { Page } from '@playwright/test';

/**
 * Creates an AxeBuilder instance with common exclusions for GOV.UK elements
 * that typically cause false positives in accessibility scans.
 *
 * @param page - The Playwright page object
 * @returns Configured AxeBuilder instance
 */
export function createAxeBuilder(page: Page): AxeBuilder {
  return new AxeBuilder({ page })
    .exclude('.govuk-footer__licence-logo')
    .exclude('.govuk-footer__crown')
    .exclude('.govuk-phase-banner');
}

/**
 * Runs an accessibility scan on the current page and returns violations.
 *
 * @param page - The Playwright page object
 * @returns Promise resolving to array of accessibility violations
 */
export async function getAccessibilityViolations(page: Page): Promise<unknown[]> {
  const results = await createAxeBuilder(page).analyze();
  return results.violations;
}
