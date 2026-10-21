describe('index', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('initialises frontend libraries and page behaviours in order', () => {
    const calls: string[] = [];
    const initialisers = [
      'initDisplayedElementFilters',
      'initFavouriteTooltips',
      'initLoadingRedirects',
      'initProfessionalInformationRepeatableFields',
      'initFactHeaderSignOutLink',
      'initTimeoutDialog',
      'initFocusRestore',
    ];

    jest.doMock('../../../../main/assets/scss/main.scss', () => ({}));
    jest.doMock('@ministryofjustice/frontend', () => ({
      initAll: jest.fn(() => calls.push('moj.initAll')),
    }));
    jest.doMock('govuk-frontend', () => ({
      initAll: jest.fn(() => calls.push('gds.initAll')),
    }));

    initialisers.forEach(initialiser => {
      jest.doMock(`../../../../main/assets/js/${getModuleName(initialiser)}`, () => ({
        [initialiser]: jest.fn(() => calls.push(initialiser)),
      }));
    });

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../../../main/assets/js/index');
    });

    expect(calls).toEqual(['gds.initAll', 'moj.initAll', ...initialisers]);
  });
});

const getModuleName = (initialiser: string): string => {
  const moduleNames: Record<string, string> = {
    initDisplayedElementFilters: 'displayedElementFilter',
    initFavouriteTooltips: 'favouriteTooltips',
    initLoadingRedirects: 'loadingRedirect',
    initProfessionalInformationRepeatableFields: 'professionalInformation',
    initFactHeaderSignOutLink: 'factHeaderSignOut',
    initTimeoutDialog: 'timeoutDialog',
    initFocusRestore: 'focusRestore',
  };

  return moduleNames[initialiser];
};
