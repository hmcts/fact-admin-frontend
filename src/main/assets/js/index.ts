import '../scss/main.scss';

import * as moj from '@ministryofjustice/frontend';
import * as gds from 'govuk-frontend';

import { initDisplayedElementFilters } from './displayedElementFilter';
import { initFactHeaderSignOutLink } from './factHeaderSignOut';
import { initFavouriteTooltips } from './favouriteTooltips';
import { initFocusRestore } from './focusRestore';
import { initLoadingRedirects } from './loadingRedirect';
import { initProfessionalInformationRepeatableFields } from './professionalInformation';
import { initTimeoutDialog } from './timeoutDialog';

gds.initAll();
moj.initAll();

initDisplayedElementFilters();
initFavouriteTooltips();
initLoadingRedirects();
initProfessionalInformationRepeatableFields();
initFactHeaderSignOutLink();
initTimeoutDialog();
initFocusRestore();
