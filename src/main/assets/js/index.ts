import '../scss/main.scss';
import { initAll } from 'govuk-frontend';

import { initDisplayedElementFilters } from './displayedElementFilter';
import { initLoadingRedirects } from './loadingRedirect';

initAll();
initDisplayedElementFilters();
initLoadingRedirects();
