import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

const COURT_ID = '11111111-1111-4111-8111-111111111111';
const CONTACT_DETAIL_ID = '99999999-9999-4999-8999-999999999999';
const CONTACT_TYPE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('Court contact details routes', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the contact details list page', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([
      {
        id: CONTACT_DETAIL_ID,
        courtContactDescription: null,
        courtContactDescriptionId: CONTACT_TYPE_ID,
        email: 'enquiries@example.test',
        explanation: 'General enquiries',
        explanationCy: null,
        phoneNumber: '01234 567890',
      },
    ] as never);
    stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      { id: CONTACT_TYPE_ID, name: 'General enquiries' },
    ] as never);

    const response = await request(app).get(`/courts/${COURT_ID}/edit/contact-details`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Contact details');
    expect(response.text).toContain('General enquiries');
    expect(response.text).toContain('enquiries@example.test');
    expect(response.text).toContain(`/courts/${COURT_ID}/edit/contact-details/add`);
    expect(response.text).toContain(`/courts/${COURT_ID}/edit/contact-details/edit/${CONTACT_DETAIL_ID}`);
    expect(response.text).toContain(`/courts/${COURT_ID}/edit/contact-details/delete/${CONTACT_DETAIL_ID}`);
  });

  test('renders court not found for invalid court id on list page', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');

    const response = await request(app).get('/courts/not-a-uuid/edit/contact-details');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtByIdStub.notCalled).toBe(true);
  });

  test('renders add contact details form', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      { id: CONTACT_TYPE_ID, name: 'General enquiries' },
    ] as never);

    const response = await request(app).get(`/courts/${COURT_ID}/edit/contact-details/add`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Add contact details');
    expect(response.text).toContain('Contact type');
    expect(response.text).toContain(
      `<form action="/courts/${COURT_ID}/edit/contact-details/add/success" method="post"`
    );
  });

  test('creates contact detail and renders success page', async () => {
    const createCourtContactDetailStub = stub(DataApiRequests.prototype, 'createCourtContactDetail').resolves(
      HttpStatusCode.Created
    );
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      { id: CONTACT_TYPE_ID, name: 'General enquiries' },
    ] as never);

    const response = await request(app)
      .post(`/courts/${COURT_ID}/edit/contact-details/add/success`)
      .type('form')
      .send(`contact-type=${CONTACT_TYPE_ID}&contact-methods=email&contact-email=enquiries%40example.test`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Contact detailsadded: enquiries@example.test');
    expect(response.text).toContain(
      'contact details of General enquiries for Reading Crown Court have been successfully created.'
    );
    expect(response.text).toContain('Back to contact details');
    expect(createCourtContactDetailStub.calledOnce).toBe(true);
    expect(createCourtContactDetailStub.firstCall.args[0]).toBe(COURT_ID);
    expect(createCourtContactDetailStub.firstCall.args[1]).toMatchObject({
      courtContactDescriptionId: CONTACT_TYPE_ID,
      courtId: COURT_ID,
      email: 'enquiries@example.test',
      explanation: '',
      phoneNumber: undefined,
    });
  });

  test('renders edit contact details form', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([
      {
        id: CONTACT_DETAIL_ID,
        courtContactDescription: null,
        courtContactDescriptionId: CONTACT_TYPE_ID,
        email: 'enquiries@example.test',
        explanation: 'General enquiries',
        explanationCy: null,
        phoneNumber: '01234 567890',
      },
    ] as never);
    stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      { id: CONTACT_TYPE_ID, name: 'General enquiries' },
    ] as never);

    const response = await request(app).get(`/courts/${COURT_ID}/edit/contact-details/edit/${CONTACT_DETAIL_ID}`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Edit contact details');
    expect(response.text).toContain(
      `<form action="/courts/${COURT_ID}/edit/contact-details/edit/${CONTACT_DETAIL_ID}/success" method="post"`
    );
  });

  test('deletes contact detail and renders success page', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([
      {
        id: CONTACT_DETAIL_ID,
        courtContactDescription: null,
        courtContactDescriptionId: CONTACT_TYPE_ID,
        email: 'enquiries@example.test',
        explanation: 'General enquiries',
        explanationCy: null,
        phoneNumber: '01234 567890',
      },
    ] as never);
    stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      { id: CONTACT_TYPE_ID, name: 'General enquiries' },
    ] as never);
    const deleteCourtContactDetailStub = stub(DataApiRequests.prototype, 'deleteCourtContactDetail').resolves(
      HttpStatusCode.NoContent
    );

    const response = await request(app).post(
      `/courts/${COURT_ID}/edit/contact-details/delete/${CONTACT_DETAIL_ID}/success`
    );

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Contact details deleted: 01234 567890, enquiries@example.test');
    expect(response.text).toContain(
      'contact details of General enquiries for Reading Crown Court have been successfully deleted.'
    );
    expect(deleteCourtContactDetailStub.calledOnce).toBe(true);
    expect(deleteCourtContactDetailStub.firstCall.args).toEqual([COURT_ID, CONTACT_DETAIL_ID]);
  });
});
