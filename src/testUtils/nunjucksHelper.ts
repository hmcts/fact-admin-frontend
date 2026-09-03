import * as path from 'node:path';

import * as nunjucks from 'nunjucks';

const govukTemplates = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist';
const mojTemplates = path.dirname(require.resolve('@ministryofjustice/frontend/package.json'));
const viewsPath = path.resolve(__dirname, '../main/views');
const courtViewsPath = path.resolve(viewsPath, 'courts');
const serviceCentreViewsPath = path.resolve(viewsPath, 'service-centres');

export const env = nunjucks.configure(
  [govukTemplates, mojTemplates, viewsPath, courtViewsPath, serviceCentreViewsPath],
  {
    autoescape: false,
  }
);
