import cookieManager from '@hmcts/cookie-manager';

cookieManager.on('UserPreferencesLoaded', preferences => {
  const dataLayer = window.dataLayer || [];
  dataLayer.push({
    event: 'Cookie Preferences',
    cookiePreferences: preferences,
  });
});

cookieManager.on('UserPreferencesSaved', preferences => {
  const dataLayer = window.dataLayer || [];
  dataLayer.push({
    event: 'Cookie Preferences',
    cookiePreferences: preferences,
  });
});

const config = {
  userPreferences: {
    cookieName: 'find-a-court-or-tribunal-cookie-preferences',
  },
  cookieManifest: [
    {
      categoryName: 'essential',
      optional: false,
      cookies: ['i18next', 'formCookie'],
    },
    {
      categoryName: 'analytics',
      cookies: ['_ga', '_gid', '_gat_UA-', '_gat'],
    },
  ],
};

cookieManager.init(config);
