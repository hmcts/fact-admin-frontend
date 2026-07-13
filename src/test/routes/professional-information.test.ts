import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

const courtId = '11111111-1111-4111-8111-111111111111';

describe('Information for professionals page', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the information for professionals form', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves({
      professionalInformation: {
        interviewRooms: true,
        interviewRoomCount: 3,
        interviewPhoneNumber: '01234 567890',
        videoHearings: false,
        commonPlatform: true,
        accessScheme: false,
      },
      codes: {
        countyCourtCode: null,
        crownCourtCode: 456,
        familyCourtCode: 123,
        gbs: 'GBS123',
        magistrateCourtCode: null,
        tribunalCode: null,
      },
      dxCodes: [{ dxCode: 'DX 999', explanation: 'Documents' }],
      faxNumbers: [{ faxNumber: '020 0000 0000', description: 'Main fax' }],
    });

    const response = await request(app).get(`/courts/${courtId}/edit/information-for-professionals`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Information for professionals');
    expect(response.text).toContain('Court Types and Codes');
    expect(response.text).not.toContain('govuk-back-link');
    expect(response.text).toContain('value="family" checked');
    expect(response.text).toContain('value="123"');
    expect(response.text).toContain('value="456"');
    expect(response.text).toContain('value="GBS123"');
    expect(response.text).toContain('value="DX 999"');
    expect(response.text).toContain('value="020 0000 0000"');
    expect(response.text).toContain('Professional schemes');
    expect(response.text).toContain('aria-label="Breadcrumb"');
    expect(response.text).toContain('<a class="govuk-breadcrumbs__link" href="/">Home</a>');
    expect(response.text).toContain(
      `<a class="govuk-breadcrumbs__link" href="/courts/${courtId}/edit">Reading Crown Court</a>`
    );
  });

  test('renders an empty form when the professional information endpoint returns no content', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);

    const response = await request(app).get(`/courts/${courtId}/edit/information-for-professionals`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Information for professionals');
    expect(response.text).toContain('DX code');
    expect(response.text).toContain('Fax number');
  });

  test('saves professional information and renders the success page', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);
    const saveStub = stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation').resolves({
      professionalInformation: {
        interviewRooms: true,
        interviewRoomCount: 2,
        interviewPhoneNumber: '01234 567890',
        videoHearings: false,
        commonPlatform: true,
        accessScheme: false,
      },
      codes: {
        countyCourtCode: null,
        crownCourtCode: 456,
        familyCourtCode: 123,
        gbs: 'GBS123',
        magistrateCourtCode: null,
        tribunalCode: null,
      },
      dxCodes: [{ dxCode: 'DX 999', explanation: 'Documents' }],
      faxNumbers: [{ faxNumber: '020 0000 0000', description: 'Main fax' }],
    });

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        courtTypes: ['family', 'crown'],
        familyCourtCode: '123',
        crownCourtCode: '456',
        gbs: 'GBS123',
        'dxCode-0': 'DX 999',
        'dxCodeDescription-0': 'Documents',
        'dxCodeDescriptionCy-0': 'Dogfennau',
        'faxNumber-0': '020 0000 0000',
        'faxNumberDescription-0': 'Main fax',
        'faxNumberDescriptionCy-0': 'Prif ffacs',
        interviewRooms: 'true',
        interviewRoomCount: '2',
        interviewPhoneNumber: '01234 567890',
        videoHearings: 'false',
        commonPlatform: 'true',
        accessScheme: 'false',
      });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Information for professionals saved');
    expect(response.text).not.toContain('Back to Information for professionals');
    expect(saveStub.calledOnce).toBe(true);
    expect(saveStub.firstCall.args).toEqual([
      courtId,
      {
        professionalInformation: {
          accessScheme: false,
          commonPlatform: true,
          interviewPhoneNumber: '01234 567890',
          interviewRoomCount: 2,
          interviewRooms: true,
          videoHearings: false,
        },
        codes: {
          countyCourtCode: null,
          crownCourtCode: 456,
          familyCourtCode: 123,
          gbs: 'GBS123',
          magistrateCourtCode: null,
          tribunalCode: null,
        },
        dxCodes: [{ dxCode: 'DX 999', explanation: 'Documents', explanationCy: 'Dogfennau' }],
        faxNumbers: [{ faxNumber: '020 0000 0000', description: 'Main fax', descriptionCy: 'Prif ffacs' }],
      },
    ]);
  });

  test('renders validation errors when explanations are submitted without matching codes', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);
    const saveStub = stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        'dxCodeDescription-0': 'Documents',
        'faxNumberDescription-0': 'Main fax',
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain(
      'You have entered a DX code explanation without a DX code, please add a code or remove the explanation'
    );
    expect(response.text).toContain(
      'You have entered a description without a fax number, please add a number or remove the description'
    );
    expect(saveStub.notCalled).toBe(true);
  });

  test('renders directional validation errors when DX/fax English and Welsh descriptions are not paired', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);
    const saveStub = stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        'dxCode-0': 'DX 100',
        'dxCodeDescription-0': 'English only explanation',
        'dxCode-1': 'DX 101',
        'dxCodeDescriptionCy-1': 'Esboniad Cymraeg yn unig',
        'faxNumber-0': '01234 567890',
        'faxNumberDescription-0': 'English only description',
        'faxNumber-1': '01234 567891',
        'faxNumberDescriptionCy-1': 'Disgrifiad Cymraeg yn unig',
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('DX code 1: Enter a Welsh explanation');
    expect(response.text).toContain('DX code 2: Enter an explanation');
    expect(response.text).toContain('Fax number 1: Enter a Welsh description');
    expect(response.text).toContain('Fax number 2: Enter a description');
    expect(saveStub.notCalled).toBe(true);
  });

  test('requires code fields for selected court types', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        courtTypes: ['family'],
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('Enter a family court code');
  });

  test('links interview room count range errors to the count field', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);
    const saveStub = stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        interviewRooms: 'true',
        interviewRoomCount: '151',
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('href="#interviewRoomCount"');
    expect(response.text).toContain('Enter a number of interview rooms between 1 and 150, or select No');
    expect(saveStub.notCalled).toBe(true);
  });

  test('links API interview room count validation errors to the count field', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);
    stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation').resolves(
      new Map([
        [
          'message',
          'Interview room count must be between 1 and 150 when interview rooms are available; otherwise omit or set to 0',
        ],
      ])
    );

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        interviewRooms: 'true',
        interviewRoomCount: '150',
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('href="#interviewRoomCount"');
    expect(response.text).toContain('Enter a number of interview rooms between 1 and 150, or select No');
  });

  test('links fax number format errors to the fax number field', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);
    const saveStub = stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        'faxNumber-0': 'test',
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('href="#faxNumber-0"');
    expect(response.text).toContain(
      'Enter a fax number in the correct format, for example 01273 800 900 or 020 7450 4000'
    );
    expect(response.text).not.toContain('Phone Number must match');
    expect(saveStub.notCalled).toBe(true);
  });

  test('maps API fax number regex errors to the fax number field', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);
    stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation').resolves(
      new Map([
        ['message', "Phone Number must match the regex '^(|(\\+44|)[0-9 ]{10,20})$'"],
        ['timestamp', '2026-06-12T10:24:23.354464'],
      ])
    );

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        'faxNumber-0': '01234 567890',
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('href="#faxNumber-0"');
    expect(response.text).toContain(
      'Enter a fax number in the correct format, for example 01273 800 900 or 020 7450 4000'
    );
    expect(response.text).not.toContain('2026-06-12T10:24:23.354464');
  });

  test('maps API length errors to the matching GBS and DX code fields', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);
    stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation').resolves(
      new Map([
        ['codes.gbs', 'GBS code must be 10 characters or fewer'],
        ['message', 'DX code must be 200 characters or fewer'],
      ])
    );

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        gbs: '12345678901',
        'dxCode-0': 'DX code that is too long',
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('href="#gbs"');
    expect(response.text).toContain('GBS code must be 10 characters or fewer');
    expect(response.text).toContain('href="#dxCode-0"');
    expect(response.text).toContain('DX code must be 200 characters or fewer');
  });

  test('maps indexed API DX code errors to the matching DX code field', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves(null);
    stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation').resolves(
      new Map([['dxCodes[1].dxCode', 'Value contains invalid characters']])
    );

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        'dxCode-0': 'DX 123',
        'dxCode-1': 'Invalid DX',
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('href="#dxCode-1"');
    expect(response.text).toContain('DX code 2: Value contains invalid characters');
  });

  test('renders confirmation page before removing family court type with local authority config', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtProfessionalInformation').resolves({
      professionalInformation: {
        interviewRooms: false,
        interviewRoomCount: 0,
        interviewPhoneNumber: null,
        videoHearings: false,
        commonPlatform: false,
        accessScheme: false,
      },
      codes: {
        countyCourtCode: null,
        crownCourtCode: null,
        familyCourtCode: 123,
        gbs: null,
        magistrateCourtCode: null,
        tribunalCode: null,
      },
      dxCodes: [],
      faxNumbers: [],
    });
    stub(DataApiRequests.prototype, 'getCourtLocalAuthorities').resolves([
      {
        areaOfLawId: '22222222-2222-4222-8222-222222222222',
        areaOfLawName: 'Children',
        localAuthorities: [{ id: '33333333-3333-4333-8333-333333333333', selected: true }],
      },
    ]);
    const saveStub = stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        courtTypes: ['crown'],
        crownCourtCode: '456',
      });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Are you sure you want to save the changes to Information for professionals?');
    expect(response.text).toContain(
      'You are removing the court type of Family court. This is being used by the local authorities admin page.'
    );
    expect(response.text).toContain(
      `<form id="cancel_form" method="GET" action="/courts/${courtId}/edit/information-for-professionals">`
    );
    expect(response.text).toContain('Cancel');
    expect(response.text).toContain('govuk-button--secondary');
    expect(response.text).not.toContain('govuk-back-link');
    expect(response.text).toContain('name="confirmFamilyCourtRemoval" value="true"');
    expect(response.text).toContain('name="courtTypes" value="crown"');
    expect(saveStub.notCalled).toBe(true);
  });

  test('saves family court type removal after confirmation', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveStub = stub(DataApiRequests.prototype, 'saveCourtProfessionalInformation').resolves({
      professionalInformation: {
        interviewRooms: false,
        interviewRoomCount: 0,
        interviewPhoneNumber: null,
        videoHearings: false,
        commonPlatform: false,
        accessScheme: false,
      },
      codes: {
        countyCourtCode: null,
        crownCourtCode: 456,
        familyCourtCode: null,
        gbs: null,
        magistrateCourtCode: null,
        tribunalCode: null,
      },
      dxCodes: [],
      faxNumbers: [],
    });

    const response = await request(app)
      .post(`/courts/${courtId}/edit/information-for-professionals/success`)
      .type('form')
      .send({
        confirmFamilyCourtRemoval: 'true',
        courtTypes: ['crown'],
        crownCourtCode: '456',
      });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Information for professionals saved');
    expect(saveStub.calledOnce).toBe(true);
  });

  test('renders court not found for invalid court id', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');

    const response = await request(app).get('/courts/not-a-uuid/edit/information-for-professionals');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtByIdStub.notCalled).toBe(true);
  });
});
