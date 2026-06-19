import '../scss/main.scss';

// Import MOJ component initialisers explicitly
import { initAll as initAllMoj } from '@ministryofjustice/frontend';
import { initAll } from 'govuk-frontend';

import { initDisplayedElementFilters } from './displayedElementFilter';
import { initLoadingRedirects } from './loadingRedirect';
import { initProfessionalInformationRepeatableFields } from './professionalInformation';

initAll();
initAllMoj();
initDisplayedElementFilters();
initLoadingRedirects();
initProfessionalInformationRepeatableFields();
