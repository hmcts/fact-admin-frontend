import { expect, test } from '../../fixtures';
import { withCreatedServiceCentre } from '../../helpers/testSupport';

test.describe(
  'Service Centre Edit Landing',
  {
    tag: '@smoke',
  },
  () => {
    test('smoke test', async ({ playwright, serviceCentreEditPage }) => {
      await withCreatedServiceCentre(
        playwright,
        'ervice Centre Edit Landing Smoke Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreEditPage.goto(createdServiceCentre.id);
          await expect(serviceCentreEditPage.heading).toContainText(`Editing - ${createdServiceCentre.name}`);
          const breadcrumb = serviceCentreEditPage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await expect(breadcrumb.getByRole('link', { name: createdServiceCentre.name })).toHaveAttribute(
            'href',
            `/service-centres/${createdServiceCentre.id}/edit`
          );
        }
      );
    });
  }
);

test.describe(
  'Service Centre Edit Landing',
  {
    tag: '@functional',
  },
  () => {
    test('renders landing heading and all section links', async ({ serviceCentreEditPage, playwright }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Landing Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreEditPage.goto(createdServiceCentre.id);

          await serviceCentreEditPage.expectVisibleElements();
          await expect(serviceCentreEditPage.heading).toContainText(`Editing - ${createdServiceCentre.name}`);
          await expect(serviceCentreEditPage.getSectionHref('General')).resolves.toBe(
            `/service-centres/${createdServiceCentre.id}/edit/general`
          );
          await expect(serviceCentreEditPage.getSectionHref('Warning notice')).resolves.toBe(
            `/service-centres/${createdServiceCentre.id}/edit/warning-notice`
          );
          await expect(serviceCentreEditPage.getSectionHref('Address')).resolves.toBe(
            `/service-centres/${createdServiceCentre.id}/edit/address`
          );
          await expect(serviceCentreEditPage.getSectionHref('Contact details')).resolves.toBe(
            `/service-centres/${createdServiceCentre.id}/edit/contact-details`
          );
          await expect(serviceCentreEditPage.getSectionHref('Cases heard')).resolves.toBe(
            `/service-centres/${createdServiceCentre.id}/edit/cases-heard`
          );
        }
      );
    });
  }
);
