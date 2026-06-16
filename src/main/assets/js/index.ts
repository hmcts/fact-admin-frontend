import '../scss/main.scss';
import { initAll } from 'govuk-frontend';

import { initDisplayedElementFilters } from './displayedElementFilter';
import { initProfessionalInformationRepeatableFields } from './professionalInformation';

initAll();
initDisplayedElementFilters();
initProfessionalInformationRepeatableFields();
