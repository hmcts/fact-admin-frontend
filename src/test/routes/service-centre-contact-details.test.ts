import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

const SERVICE_CENTRE_ID = '11111111-1111-4111-8111-111111111111';
const CONTACT_DETAIL_ID = '99999999-9999-4999-8999-999999999999';
const CONTACT_TYPE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('Service centre contact details routes', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the contact details list page', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
      open: true,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceCentreContactDetails').resolves([
      {
        id: CONTACT_DETAIL_ID,
        serviceCentreContactDescription: null,
        serviceCentreContactDescriptionId: CONTACT_TYPE_ID,
        serviceCentreId: SERVICE_CENTRE_ID,
        email: 'enquiries@example.test',
        explanation: 'General enquiries',
        explanationCy: null,
        phoneNumber: '01234 567890',
      },
    ] as never);
    stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      { id: CONTACT_TYPE_ID, name: 'General enquiries' },
    ] as never);

    const response = await request(app).get(`/service-centres/${SERVICE_CENTRE_ID}/edit/contact-details`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Contact details');
    expect(response.text).toContain('General enquiries');
    expect(response.text).toContain('enquiries@example.test');
    expect(response.text).toContain(`/service-centres/${SERVICE_CENTRE_ID}/edit/contact-details/add`);
    expect(response.text).toContain(
      `/service-centres/${SERVICE_CENTRE_ID}/edit/contact-details/edit/${CONTACT_DETAIL_ID}`
    );
    expect(response.text).toContain(
      `/service-centres/${SERVICE_CENTRE_ID}/edit/contact-details/delete/${CONTACT_DETAIL_ID}`
    );
  });

  test('renders not found for invalid service-centre id on list page', async () => {
    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById');

    const response = await request(app).get('/service-centres/not-a-uuid/edit/contact-details');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Page Not Found');
    expect(getServiceCentreByIdStub.notCalled).toBe(true);
  });

  test('creates contact detail and renders success page', async () => {
    const createServiceCentreContactDetailStub = stub(
      DataApiRequests.prototype,
      'createServiceCentreContactDetail'
    ).resolves(HttpStatusCode.Created);
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
      open: true,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      { id: CONTACT_TYPE_ID, name: 'General enquiries' },
    ] as never);

    const response = await request(app)
      .post(`/service-centres/${SERVICE_CENTRE_ID}/edit/contact-details/add/success`)
      .type('form')
      .send(`contact-type=${CONTACT_TYPE_ID}&contact-methods=email&contact-email=enquiries%40example.test`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Contact details added: enquiries@example.test');
    expect(response.text).toContain(
      'contact details of General enquiries for Reading Service Centre have been successfully created.'
    );
    expect(createServiceCentreContactDetailStub.calledOnce).toBe(true);
    expect(createServiceCentreContactDetailStub.firstCall.args[0]).toBe(SERVICE_CENTRE_ID);
    expect(createServiceCentreContactDetailStub.firstCall.args[1]).toMatchObject({
      serviceCentreContactDescriptionId: CONTACT_TYPE_ID,
      serviceCentreId: SERVICE_CENTRE_ID,
      email: 'enquiries@example.test',
      explanation: '',
      phoneNumber: undefined,
    });
  });

  test('deletes contact detail and renders success page', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
      open: true,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceCentreContactDetails').resolves([
      {
        id: CONTACT_DETAIL_ID,
        serviceCentreContactDescription: null,
        serviceCentreContactDescriptionId: CONTACT_TYPE_ID,
        serviceCentreId: SERVICE_CENTRE_ID,
        email: 'enquiries@example.test',
        explanation: 'General enquiries',
        explanationCy: null,
        phoneNumber: '01234 567890',
      },
    ] as never);
    stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      { id: CONTACT_TYPE_ID, name: 'General enquiries' },
    ] as never);
    const deleteStub = stub(DataApiRequests.prototype, 'deleteServiceCentreContactDetail').resolves(
      HttpStatusCode.NoContent
    );

    const response = await request(app).post(
      `/service-centres/${SERVICE_CENTRE_ID}/edit/contact-details/delete/${CONTACT_DETAIL_ID}/success`
    );

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Contact details deleted: 01234 567890, enquiries@example.test');
    expect(response.text).toContain(
      'contact details of General enquiries for Reading Service Centre have been successfully deleted.'
    );
    expect(deleteStub.calledOnce).toBe(true);
    expect(deleteStub.firstCall.args).toEqual([SERVICE_CENTRE_ID, CONTACT_DETAIL_ID]);
  });
});
