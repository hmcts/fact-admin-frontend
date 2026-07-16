import { courtTypeOptions } from '../../../main/services/ProfessionalInformationService';
import { env } from '../../../testUtils/nunjucksHelper';

describe('Professional Information View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const pagePath = `/courts/${courtId}/edit/information-for-professionals`;

  test('renders the professional information form', () => {
    const html = env.render('professional-information.njk', {
      accessScheme: undefined,
      commonPlatform: undefined,
      courtId,
      courtName: 'Reading Crown Court',
      courtTypeOptions,
      dxCodes: [{ code: '', description: '' }],
      errorSummary: [],
      faxNumbers: [{ code: '', description: '' }],
      fieldErrors: {},
      gbs: '',
      interviewPhoneNumber: '',
      interviewRoomCount: '',
      interviewRooms: undefined,
      pagePath,
      pageTitle: 'Information for professionals - Reading Crown Court',
      selectedCourtTypes: [],
      selectedCourtTypeCodes: {
        countyCourtCode: '',
        crownCourtCode: '',
        familyCourtCode: '',
        magistrateCourtCode: '',
        tribunalCode: '',
      },
      videoHearings: undefined,
    });

    expect(html).toContain('Information for professionals');
    expect(html).not.toContain('govuk-back-link');
    expect(html).toContain('Please select the type of court you wish to provide a code for');
    expect(html).toContain('Court Types and Codes');
    expect(html).toContain(
      "If you have set up local authority config, and you remove the court type of 'Family court' here, this will remove the local authority config and will effect search results"
    );
    expect(html).toContain('Family court');
    expect(html).toContain('Family court code');
    expect(html).toContain('GBS code');
    expect(html).toContain('DX code');
    expect(html).toContain('Explanation');
    expect(html).toContain('Add another DX code');
    expect(html).not.toContain('Remove DX code 1');
    expect(html).toContain('Fax number');
    expect(html).toContain('Description');
    expect(html).toContain('Add another Fax number');
    expect(html).not.toContain('Remove Fax number 1');
    expect(html).toContain('Does this location have any interview rooms?');
    expect(html).toContain('Phone number to book it');
    expect(html).toContain('Professional schemes');
    expect(html).toContain('Save');
  });

  test('renders validation errors', () => {
    const html = env.render('professional-information.njk', {
      accessScheme: undefined,
      commonPlatform: undefined,
      courtId,
      courtName: 'Reading Crown Court',
      courtTypeOptions,
      dxCodes: [{ code: '', description: 'Documents' }],
      errorSummary: [
        {
          href: '#dxCode-0',
          text: 'You have entered a DX code explanation without a DX code, please add a code or remove the explanation',
        },
      ],
      faxNumbers: [{ code: '', description: '' }],
      fieldErrors: {
        'dxCode-0':
          'You have entered a DX code explanation without a DX code, please add a code or remove the explanation',
      },
      gbs: '',
      interviewPhoneNumber: '',
      interviewRoomCount: '',
      interviewRooms: undefined,
      pagePath,
      pageTitle: 'Information for professionals - Reading Crown Court',
      selectedCourtTypes: [],
      selectedCourtTypeCodes: {
        countyCourtCode: '',
        crownCourtCode: '',
        familyCourtCode: '',
        magistrateCourtCode: '',
        tribunalCode: '',
      },
      videoHearings: undefined,
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain(
      'You have entered a DX code explanation without a DX code, please add a code or remove the explanation'
    );
  });

  test('renders professional information read-only for viewer users', () => {
    const html = env.render('professional-information.njk', {
      accessScheme: true,
      commonPlatform: false,
      courtId,
      courtName: 'Reading Crown Court',
      courtTypeOptions,
      dxCodes: [
        { code: 'DX 123', description: 'Documents' },
        { code: 'DX 456', description: 'Family documents' },
      ],
      errorSummary: [],
      faxNumbers: [
        { code: '0123 456789', description: 'Fax' },
        { code: '0123 456780', description: 'Family fax' },
      ],
      fieldErrors: {},
      gbs: 'GBS1',
      interviewPhoneNumber: '',
      interviewRoomCount: '',
      interviewRooms: false,
      isViewer: true,
      pagePath,
      pageTitle: 'Information for professionals - Reading Crown Court',
      selectedCourtTypes: [],
      selectedCourtTypeCodes: {},
      videoHearings: false,
    });

    expect(html).toContain('<fieldset class="govuk-fieldset" disabled>');
    expect(html).not.toContain('Add another DX code');
    expect(html).not.toContain('Add another Fax number');
    expect(html).not.toContain('Remove DX code');
    expect(html).not.toContain('Remove Fax number');
    expect(html).not.toContain('>Save<');
  });

  test('hides add another buttons when repeatable sections reach five entries', () => {
    const entries = Array.from({ length: 5 }, (_, index) => ({
      code: `Code ${index + 1}`,
      description: `Description ${index + 1}`,
    }));

    const html = env.render('professional-information.njk', {
      accessScheme: undefined,
      commonPlatform: undefined,
      courtId,
      courtName: 'Reading Crown Court',
      courtTypeOptions,
      dxCodes: entries,
      errorSummary: [],
      faxNumbers: entries,
      fieldErrors: {},
      gbs: '',
      interviewPhoneNumber: '',
      interviewRoomCount: '',
      interviewRooms: undefined,
      pagePath,
      pageTitle: 'Information for professionals - Reading Crown Court',
      selectedCourtTypes: [],
      selectedCourtTypeCodes: {
        countyCourtCode: '',
        crownCourtCode: '',
        familyCourtCode: '',
        magistrateCourtCode: '',
        tribunalCode: '',
      },
      videoHearings: undefined,
    });

    expect(html).toContain('data-professional-information-add="dxCode" hidden="hidden"');
    expect(html).toContain('data-professional-information-add="faxNumber" hidden="hidden"');
    expect(html).toContain('govuk-button--secondary govuk-!-display-none');
    expect(html).toContain('govuk-button--warning professional-information-repeatable__remove');
  });
});
