import '../scss/main.scss';
import { initAll } from 'govuk-frontend';

import { initAll as initAllMoj } from '../../public/assets/js/mojAll';

import { initDisplayedElementFilters } from './displayedElementFilter';
import { initProfessionalInformationRepeatableFields } from './professionalInformation';

initAll();
initAllMoj();
initDisplayedElementFilters();
initProfessionalInformationRepeatableFields();
