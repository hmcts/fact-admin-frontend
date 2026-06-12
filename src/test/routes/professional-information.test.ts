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
    expect(response.text).toContain(`href="/courts/${courtId}/edit"`);
    expect(response.text).toContain('value="family" checked');
    expect(response.text).toContain('value="123"');
    expect(response.text).toContain('value="456"');
    expect(response.text).toContain('value="GBS123"');
    expect(response.text).toContain('value="DX 999"');
    expect(response.text).toContain('value="020 0000 0000"');
    expect(response.text).toContain('Professional schemes');
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
        'faxNumber-0': '020 0000 0000',
        'faxNumberDescription-0': 'Main fax',
        interviewRooms: 'true',
        interviewRoomCount: '2',
        interviewPhoneNumber: '01234 567890',
        videoHearings: 'false',
        commonPlatform: 'true',
        accessScheme: 'false',
      });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Information for professionals saved');
    expect(response.text).toContain('Back to Information for professionals');
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
        dxCodes: [{ dxCode: 'DX 999', explanation: 'Documents' }],
        faxNumbers: [{ faxNumber: '020 0000 0000', description: 'Main fax' }],
      },
    ]);
  });

  test('renders validation errors when explanations are submitted without matching codes', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
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

  test('requires code fields for selected court types', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);

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

  test('renders court not found for invalid court id', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');

    const response = await request(app).get('/courts/not-a-uuid/edit/information-for-professionals');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtByIdStub.notCalled).toBe(true);
  });
});
