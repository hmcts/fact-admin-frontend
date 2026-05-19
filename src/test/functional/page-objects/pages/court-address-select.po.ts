import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class CourtAddressSelectPage extends Base {
  public readonly addressSelect: Locator;
  public readonly continueButton: Locator;
  public readonly enterAddressManuallyButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addressSelect = this.page.getByLabel('Choose an address');
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.enterAddressManuallyButton = this.page.getByRole('button', { name: 'Enter address manually' });
  }

  async goto(courtId: string, postcode: string, addressId?: string): Promise<void> {
    const suffix = addressId ? `/${addressId}` : '';
    await this.page.goto(
      config.urls.homePageUrl +
        `/courts/${courtId}/edit/address/select${suffix}?postcode=${encodeURIComponent(postcode)}`
    );
  }

  async selectFirstAddress(): Promise<void> {
    await this.addressSelect.selectOption({ index: 0 });
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async clickEnterAddressManually(): Promise<void> {
    await this.enterAddressManuallyButton.click();
  }
}
