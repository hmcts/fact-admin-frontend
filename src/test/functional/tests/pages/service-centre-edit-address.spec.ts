import { expect, test } from '../../fixtures';
import { withCreatedServiceCentre } from '../../helpers/testSupport';

import {
  buildTestServiceCentreAddress,
  getFirstServiceCentreAddressId,
  getFirstServiceCentreDeleteAddressId,
  reduceServiceCentreAddressesCount,
} from './service-centre-address-test-support';

const TEST_POSTCODE = 'RG1 2AA';

test.describe(
  'Service Centre Edit Address',
  {
    tag: '@smoke',
  },
  () => {
    test('smoke test', async ({ playwright, serviceCentreAddressListPage }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Address Smoke Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreAddressListPage.goto(createdServiceCentre.id);
          await expect(serviceCentreAddressListPage.heading).toContainText('Address');
          const breadcrumb = serviceCentreAddressListPage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await expect(breadcrumb.getByRole('link', { name: createdServiceCentre.name })).toHaveAttribute(
            'href',
            `/service-centres/${createdServiceCentre.id}/edit`
          );
          await expect(breadcrumb).toContainText('Addresses');
        }
      );
    });
  }
);

test.describe(
  'Service Centre Edit Address',
  {
    tag: '@functional',
  },
  () => {
    test('adds, edits and deletes a service-centre address via find/select/details flows', async ({
      page,
      playwright,
      serviceCentreAddressDeletePage,
      serviceCentreAddressDeleteSuccessPage,
      serviceCentreAddressEditPage,
      serviceCentreAddressEditSuccessPage,
      serviceCentreAddressFindPage,
      serviceCentreAddressListPage,
      serviceCentreAddressSelectPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Address Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          const addedAddress = buildTestServiceCentreAddress('ServiceCentreAddOne');
          const updatedAddress = buildTestServiceCentreAddress('ServiceCentreUpdatedOne');

          await reduceServiceCentreAddressesCount(
            page,
            serviceCentreAddressListPage,
            serviceCentreAddressDeletePage,
            serviceCentreAddressDeleteSuccessPage,
            createdServiceCentre.id,
            0
          );

          await serviceCentreAddressListPage.goto(createdServiceCentre.id);
          await serviceCentreAddressListPage.clickAddAddress();
          await expect(serviceCentreAddressFindPage.heading).toContainText('Find address by postcode');

          await serviceCentreAddressFindPage.searchPostcode(TEST_POSTCODE);
          await expect(serviceCentreAddressSelectPage.page).toHaveURL(
            new RegExp(
              `.+\\/service-centres\\/${createdServiceCentre.id}\\/edit\\/address\\/select\\?postcode=RG1\\+2AA`
            )
          );

          await serviceCentreAddressSelectPage.selectFirstAddress();
          await serviceCentreAddressSelectPage.clickContinue();

          await expect(serviceCentreAddressEditPage.page).toHaveURL(
            new RegExp(`/service-centres/${createdServiceCentre.id}/edit/address/details$`)
          );
          await serviceCentreAddressEditPage.fillAddressForm(addedAddress);
          await serviceCentreAddressEditPage.clickSave();

          await expect(serviceCentreAddressEditSuccessPage.page).toHaveURL(
            new RegExp(`/service-centres/${createdServiceCentre.id}/edit/address/details/success$`)
          );
          await expect(serviceCentreAddressEditSuccessPage.successPanelTitle).toContainText('Address saved');
          await expect(serviceCentreAddressEditSuccessPage.mainContent.content).toContainText(
            `Addresses for ${createdServiceCentre.name} have been successfully updated`
          );
          await expect(serviceCentreAddressEditSuccessPage.backToAddressesLink).toHaveAttribute(
            'href',
            `/service-centres/${createdServiceCentre.id}/edit/address`
          );

          await serviceCentreAddressEditSuccessPage.backToAddressesLink.click();
          await expect(serviceCentreAddressListPage.mainContent.content).toContainText(addedAddress.postcode);

          const addressId = await getFirstServiceCentreAddressId(page, createdServiceCentre.id);
          await serviceCentreAddressFindPage.goto(createdServiceCentre.id, addressId);
          await serviceCentreAddressFindPage.clickEnterAddressManually();
          await serviceCentreAddressEditPage.fillAddressForm(updatedAddress);
          await serviceCentreAddressEditPage.clickSave();

          await expect(serviceCentreAddressEditSuccessPage.page).toHaveURL(
            new RegExp(`/service-centres/${createdServiceCentre.id}/edit/address/details/success/${addressId}$`)
          );
          await expect(serviceCentreAddressEditSuccessPage.mainContent.content).toContainText(
            `Addresses for ${createdServiceCentre.name} have been successfully updated`
          );

          await serviceCentreAddressFindPage.goto(createdServiceCentre.id, addressId);
          await serviceCentreAddressFindPage.clickEnterAddressManually();
          await expect(serviceCentreAddressEditPage.addressLine1Input).toHaveValue(updatedAddress.addressLine1);
          await expect(serviceCentreAddressEditPage.postcodeInput).toHaveValue(updatedAddress.postcode);

          const deleteAddressId = await getFirstServiceCentreDeleteAddressId(page, createdServiceCentre.id);
          await serviceCentreAddressDeletePage.goto(createdServiceCentre.id, deleteAddressId);
          await serviceCentreAddressDeletePage.clickDeleteAddress();

          await expect(serviceCentreAddressDeleteSuccessPage.successPanelTitle).toContainText('Address deleted:');
          await expect(serviceCentreAddressDeleteSuccessPage.mainContent.content).toContainText(
            `You have removed this address for ${createdServiceCentre.name}`
          );
          await expect(serviceCentreAddressDeleteSuccessPage.backToAddressesLink).toHaveAttribute(
            'href',
            `/service-centres/${createdServiceCentre.id}/edit/address`
          );

          await serviceCentreAddressDeleteSuccessPage.backToAddressesLink.click();
          await expect(serviceCentreAddressListPage.noAddressesMessage).toBeVisible();
        }
      );
    });

    test('shows validation errors for missing required address fields', async ({
      page,
      playwright,
      serviceCentreAddressDeletePage,
      serviceCentreAddressDeleteSuccessPage,
      serviceCentreAddressEditPage,
      serviceCentreAddressFindPage,
      serviceCentreAddressListPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Address Validation Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await reduceServiceCentreAddressesCount(
            page,
            serviceCentreAddressListPage,
            serviceCentreAddressDeletePage,
            serviceCentreAddressDeleteSuccessPage,
            createdServiceCentre.id,
            0
          );

          await serviceCentreAddressFindPage.goto(createdServiceCentre.id);
          await serviceCentreAddressFindPage.clickEnterAddressManually();
          await serviceCentreAddressEditPage.clickSave();

          await expect(serviceCentreAddressEditPage.errorSummary).toBeVisible();
          await expect(serviceCentreAddressEditPage.mainContent.content).toContainText('Select an address type');
          await expect(serviceCentreAddressEditPage.mainContent.content).toContainText(
            'Enter address line 1, typically the building and street'
          );
          await expect(serviceCentreAddressEditPage.mainContent.content).toContainText('Enter a town or city');
          await expect(serviceCentreAddressEditPage.mainContent.content).toContainText('Enter a postcode');
        }
      );
    });

    test('shows validation error when postcode lookup uses an invalid postcode', async ({
      playwright,
      serviceCentreAddressFindPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Address Postcode Validation Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreAddressFindPage.goto(createdServiceCentre.id);
          await serviceCentreAddressFindPage.searchPostcode('NOT A POSTCODE');

          await expect(serviceCentreAddressFindPage.errorSummary).toBeVisible();
          await expect(serviceCentreAddressFindPage.mainContent.content).toContainText('Postcode format is invalid');
        }
      );
    });

    test('posts to /details/success for a new address and is not swallowed by /:addressId', async ({
      page,
      playwright,
      serviceCentreAddressDeletePage,
      serviceCentreAddressDeleteSuccessPage,
      serviceCentreAddressEditPage,
      serviceCentreAddressEditSuccessPage,
      serviceCentreAddressFindPage,
      serviceCentreAddressListPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Address Route Order Regression Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await reduceServiceCentreAddressesCount(
            page,
            serviceCentreAddressListPage,
            serviceCentreAddressDeletePage,
            serviceCentreAddressDeleteSuccessPage,
            createdServiceCentre.id,
            0
          );

          await serviceCentreAddressFindPage.goto(createdServiceCentre.id);
          await serviceCentreAddressFindPage.clickEnterAddressManually();
          await serviceCentreAddressEditPage.fillAddressForm(buildTestServiceCentreAddress('RouteRegression'));
          await serviceCentreAddressEditPage.clickSave();

          await expect(serviceCentreAddressEditSuccessPage.page).toHaveURL(
            new RegExp(`/service-centres/${createdServiceCentre.id}/edit/address/details/success$`)
          );
          await expect(serviceCentreAddressEditSuccessPage.successPanelTitle).toContainText('Address saved');
          await expect(serviceCentreAddressEditSuccessPage.mainContent.content).not.toContainText('Page Not Found');
        }
      );
    });
  }
);
