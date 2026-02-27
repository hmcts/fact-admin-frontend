import { Page } from '@playwright/test';

export class Base {
  constructor(protected page: Page) {}
}
