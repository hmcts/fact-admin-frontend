import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class ServiceCentreAddressSelectPage extends Base {
  public readonly addressSelect: Locator;
  public readonly lpiAddressOptions: Locator;
  public readonly continueButton: Locator;
  public readonly enterAddressManuallyButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addressSelect = this.page.getByLabel('Choose an address');
    this.lpiAddressOptions = this.addressSelect.locator('option').filter({ hasText: 'Local property address (LPI)' });
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.enterAddressManuallyButton = this.page.getByRole('button', { name: 'Enter address manually' });
  }

  async goto(serviceCentreId: string, postcode: string, addressId?: string): Promise<void> {
    const suffix = addressId ? `/${addressId}` : '';
    await this.page.goto(
      config.urls.homePageUrl +
        `/service-centres/${serviceCentreId}/edit/address/select${suffix}?postcode=${encodeURIComponent(postcode)}`
    );
  }

  async selectFirstAddress(): Promise<void> {
    await this.addressSelect.selectOption({ index: 0 });
  }

  async selectFirstLpiAddress(): Promise<void> {
    const value = await this.lpiAddressOptions.first().getAttribute('value');
    if (!value) {
      throw new Error('Expected at least one selectable LPI address.');
    }
    await this.addressSelect.selectOption(value);
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async clickEnterAddressManually(): Promise<void> {
    await this.enterAddressManuallyButton.click();
  }
}
