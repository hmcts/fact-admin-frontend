import '../scss/main.scss';

import * as moj from '@ministryofjustice/frontend';
import * as gds from 'govuk-frontend';

import { initDisplayedElementFilters } from './displayedElementFilter';
import { initFactHeaderSignOutLink } from './factHeaderSignOut';
import { initLoadingRedirects } from './loadingRedirect';
import { initProfessionalInformationRepeatableFields } from './professionalInformation';

gds.initAll();
moj.initAll();

initDisplayedElementFilters();
initLoadingRedirects();
initProfessionalInformationRepeatableFields();
initFactHeaderSignOutLink();
