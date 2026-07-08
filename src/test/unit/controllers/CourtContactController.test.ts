import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import CourtContactController from '../../../main/controllers/CourtContactController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { mockRequest } from '../mocks/mockRequest';

describe('CourtContactController', () => {
  test('renders contact details list when the court exists', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);

    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([
      {
        id: '99999999-9999-4999-8999-999999999999',
        courtContactDescriptionId: 'desc-id',
        explanation: 'General enquiries',
        explanationCy: null,
        email: 'enquiries@example.test',
        phoneNumber: '01234 567890',
        courtContactDescription: null,
      },
    ] as never);
    const getContactDescriptionTypesStub = stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      {
        id: 'desc-id',
        name: 'Enquiries',
      },
    ] as never);

    responseMock
      .expects('render')
      .once()
      .withArgs('court-contact-list', {
        courtContactDetails: [
          {
            id: '99999999-9999-4999-8999-999999999999',
            courtContactDescriptionId: 'desc-id',
            explanation: 'General enquiries',
            explanationCy: null,
            email: 'enquiries@example.test',
            phoneNumber: '01234 567890',
            courtContactDescription: null,
            description: 'Enquiries',
            editHref:
              '/courts/11111111-1111-4111-8111-111111111111/edit/contact-details/edit/99999999-9999-4999-8999-999999999999',
            deleteHref:
              '/courts/11111111-1111-4111-8111-111111111111/edit/contact-details/delete/99999999-9999-4999-8999-999999999999',
          },
        ],
        courtId: '11111111-1111-4111-8111-111111111111',
        courtName: 'Reading Crown Court',
        pageTitle: 'Manage Contact details - Reading Crown Court',
      });

    try {
      await controller.get(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtContactDetailsStub);
      assert.calledOnce(getContactDescriptionTypesStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
      getContactDescriptionTypesStub.restore();
    }
  });

  test('renders court not found when court id is invalid', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');
    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.get(request, response);

      assert.notCalled(getCourtByIdStub);
      assert.notCalled(getCourtContactDetailsStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
    }
  });

  test('renders court not found when the court does not exist', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);
    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.get(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.notCalled(getCourtContactDetailsStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
    }
  });

  test('renders error when contact details cannot be loaded', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves(
      HttpStatusCode.InternalServerError
    );
    const getContactDescriptionTypesStub = stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves(
      [] as never
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtContactDetailsStub);
      assert.calledOnce(getContactDescriptionTypesStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
      getContactDescriptionTypesStub.restore();
    }
  });

  test('renders add contact details page when the court exists', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getContactDescriptionTypesStub = stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name: 'General enquiries',
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        name: 'Listing enquiries',
      },
    ] as never);

    responseMock
      .expects('render')
      .once()
      .withArgs('court-contact-form', {
        courtId: '11111111-1111-4111-8111-111111111111',
        courtName: 'Reading Crown Court',
        contactDescriptionTypeItems: [
          { text: 'Select', value: '' },
          { selected: false, text: 'General enquiries', value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
          { selected: false, text: 'Listing enquiries', value: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' },
        ],
        formAction: '/courts/11111111-1111-4111-8111-111111111111/edit/contact-details/add/success',
        formHeading: 'Add contact details',
        formValues: {
          contactEmail: '',
          contactExplanation: '',
          contactMethods: [],
          contactTelephone: '',
        },
        pageTitle: 'Add contact details - Reading Crown Court',
      });

    try {
      await controller.renderAdd(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getContactDescriptionTypesStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getContactDescriptionTypesStub.restore();
    }
  });

  test('renders court not found on add contact details page when court id is invalid', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderAdd(request, response);

      assert.notCalled(getCourtByIdStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('renders court not found on add contact details page when the court does not exist', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderAdd(request, response);

      assert.calledOnce(getCourtByIdStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('renders error on add contact details page when the lookup fails', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderAdd(request, response);

      assert.calledOnce(getCourtByIdStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('creates contact details and renders success screen', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      'contact-type': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'contact-explanation': 'General enquiries desk',
      'contact-methods': ['email'],
      'contact-email': 'enquiries@example.test',
    };
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const createCourtContactDetailStub = stub(DataApiRequests.prototype, 'createCourtContactDetail').resolves(
      HttpStatusCode.Created
    );
    const getContactDescriptionTypesStub = stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name: 'General enquiries',
      },
    ] as never);

    responseMock.expects('render').once().withArgs('common-edit-success', {
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      continueUpdatingHref: '/courts/11111111-1111-4111-8111-111111111111/edit/contact-details',
      continueUpdatingText: 'Back to contact details',
      pageTitle: 'Contact details added: General enquiries',
      successPanelBody: 'contact details of General enquiries for Reading Crown Court have been successfully created.',
      successPanelTitle: 'Contact details added: enquiries@example.test',
    });

    try {
      await controller.addContactDetail(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(createCourtContactDetailStub);
      assert.calledOnce(getContactDescriptionTypesStub);
      assert.calledWithExactly(createCourtContactDetailStub, '11111111-1111-4111-8111-111111111111', {
        courtId: '11111111-1111-4111-8111-111111111111',
        courtContactDescriptionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        explanation: 'General enquiries desk',
        email: 'enquiries@example.test',
        phoneNumber: undefined,
      });
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      createCourtContactDetailStub.restore();
      getContactDescriptionTypesStub.restore();
    }
  });

  test('renders error when create contact details fails', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      'contact-type': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'contact-methods': ['email'],
      'contact-email': 'enquiries@example.test',
    };
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const createCourtContactDetailStub = stub(DataApiRequests.prototype, 'createCourtContactDetail').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.addContactDetail(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(createCourtContactDetailStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      createCourtContactDetailStub.restore();
    }
  });

  test('re-renders add form with validation errors when required fields are missing', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      'contact-type': '',
      'contact-methods': [],
    };
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getContactDescriptionTypesStub = stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name: 'General enquiries',
      },
    ] as never);
    const createCourtContactDetailStub = stub(DataApiRequests.prototype, 'createCourtContactDetail');

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock
      .expects('render')
      .once()
      .withArgs(
        'court-contact-form',
        match({
          formErrors: match({
            contactMethods: 'Select at least one contact method',
            contactType: 'Select a contact type',
          }),
          formHeading: 'Add contact details',
        })
      );

    try {
      await controller.addContactDetail(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getContactDescriptionTypesStub);
      assert.notCalled(createCourtContactDetailStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getContactDescriptionTypesStub.restore();
      createCourtContactDetailStub.restore();
    }
  });

  test('renders edit contact details page when the contact exists', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: '99999999-9999-4999-8999-999999999999',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);

    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([
      {
        id: '99999999-9999-4999-8999-999999999999',
        courtContactDescriptionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        explanation: 'General enquiries',
        explanationCy: null,
        email: 'enquiries@example.test',
        phoneNumber: '01234 567890',
        courtContactDescription: {
          name: 'Enquiries',
          nameCy: 'Ymholiadau',
        },
      },
    ] as never);
    const getContactDescriptionTypesStub = stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name: 'General enquiries',
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        name: 'Listing enquiries',
      },
    ] as never);

    responseMock
      .expects('render')
      .once()
      .withArgs('court-contact-form', {
        courtId: '11111111-1111-4111-8111-111111111111',
        courtName: 'Reading Crown Court',
        contactDescriptionTypeItems: [
          { text: 'Select', value: '' },
          { selected: true, text: 'General enquiries', value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
          { selected: false, text: 'Listing enquiries', value: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' },
        ],
        contactDetailId: '99999999-9999-4999-8999-999999999999',
        formAction:
          '/courts/11111111-1111-4111-8111-111111111111/edit/contact-details/edit/99999999-9999-4999-8999-999999999999/success',
        formHeading: 'Edit contact details',
        formValues: {
          contactEmail: 'enquiries@example.test',
          contactExplanation: 'General enquiries',
          contactMethods: ['email', 'phone'],
          contactTelephone: '01234 567890',
        },
        pageTitle: 'Edit contact details - Reading Crown Court',
      });

    try {
      await controller.renderEdit(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtContactDetailsStub);
      assert.calledOnce(getContactDescriptionTypesStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
      getContactDescriptionTypesStub.restore();
    }
  });

  test('renders court not found on edit contact details page when contact id is invalid', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: 'not-a-uuid',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');
    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderEdit(request, response);

      assert.notCalled(getCourtByIdStub);
      assert.notCalled(getCourtContactDetailsStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
    }
  });

  test('renders court not found on edit contact details page when contact detail is missing', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: '99999999-9999-4999-8999-999999999999',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([] as never);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderEdit(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtContactDetailsStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
    }
  });

  test('updates contact details and renders success screen', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      'contact-type': 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'contact-explanation': 'Listing office',
      'contact-methods': ['phone'],
      'contact-telephone': '01234 567890',
    };
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: '99999999-9999-4999-8999-999999999999',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const updateCourtContactDetailStub = stub(DataApiRequests.prototype, 'updateCourtContactDetail').resolves(
      HttpStatusCode.Ok
    );
    const getContactDescriptionTypesStub = stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        name: 'Listing enquiries',
      },
    ] as never);

    responseMock.expects('render').once().withArgs('common-edit-success', {
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      continueUpdatingHref: '/courts/11111111-1111-4111-8111-111111111111/edit/contact-details',
      continueUpdatingText: 'Back to contact details',
      pageTitle: 'Contact details saved: Listing enquiries',
      successPanelBody: 'contact details of Listing enquiries for Reading Crown Court have been successfully updated.',
      successPanelTitle: 'Contact details saved: 01234 567890',
    });

    try {
      await controller.updateContactDetail(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(updateCourtContactDetailStub);
      assert.calledOnce(getContactDescriptionTypesStub);
      assert.calledWithExactly(
        updateCourtContactDetailStub,
        '11111111-1111-4111-8111-111111111111',
        '99999999-9999-4999-8999-999999999999',
        {
          courtId: '11111111-1111-4111-8111-111111111111',
          courtContactDescriptionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          explanation: 'Listing office',
          email: undefined,
          phoneNumber: '01234 567890',
        }
      );
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      updateCourtContactDetailStub.restore();
      getContactDescriptionTypesStub.restore();
    }
  });

  test('renders error when update contact details fails', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      'contact-type': 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'contact-methods': ['phone'],
      'contact-telephone': '01234 567890',
    };
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: '99999999-9999-4999-8999-999999999999',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const updateCourtContactDetailStub = stub(DataApiRequests.prototype, 'updateCourtContactDetail').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.updateContactDetail(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(updateCourtContactDetailStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      updateCourtContactDetailStub.restore();
    }
  });

  test('re-renders edit form with validation errors when selected method value is missing', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      'contact-type': 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'contact-methods': ['email'],
      'contact-email': '',
    };
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: '99999999-9999-4999-8999-999999999999',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getContactDescriptionTypesStub = stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        name: 'Listing enquiries',
      },
    ] as never);
    const updateCourtContactDetailStub = stub(DataApiRequests.prototype, 'updateCourtContactDetail');

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock
      .expects('render')
      .once()
      .withArgs(
        'court-contact-form',
        match({
          formErrors: match({
            contactEmail: 'Enter an email address',
          }),
          formHeading: 'Edit contact details',
        })
      );

    try {
      await controller.updateContactDetail(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getContactDescriptionTypesStub);
      assert.notCalled(updateCourtContactDetailStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getContactDescriptionTypesStub.restore();
      updateCourtContactDetailStub.restore();
    }
  });

  test('renders delete contact details confirmation when the contact exists', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: '99999999-9999-4999-8999-999999999999',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);

    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([
      {
        id: '99999999-9999-4999-8999-999999999999',
        courtContactDescriptionId: 'desc-id',
        explanation: 'General enquiries',
        explanationCy: null,
        email: 'enquiries@example.test',
        phoneNumber: '01234 567890',
        courtContactDescription: {
          name: 'Enquiries',
          nameCy: 'Ymholiadau',
        },
      },
    ] as never);

    responseMock
      .expects('render')
      .once()
      .withArgs('court-contact-delete', {
        courtId: '11111111-1111-4111-8111-111111111111',
        courtName: 'Reading Crown Court',
        contactDetail: {
          id: '99999999-9999-4999-8999-999999999999',
          courtContactDescriptionId: 'desc-id',
          explanation: 'General enquiries',
          explanationCy: null,
          email: 'enquiries@example.test',
          phoneNumber: '01234 567890',
          courtContactDescription: {
            name: 'Enquiries',
            nameCy: 'Ymholiadau',
          },
          description: 'Enquiries',
        },
        contactDetailId: '99999999-9999-4999-8999-999999999999',
        pageTitle: 'Delete contact details - Reading Crown Court',
      });

    try {
      await controller.renderDelete(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtContactDetailsStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
    }
  });

  test('renders delete contact details confirmation with description resolved from type id', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: '99999999-9999-4999-8999-999999999999',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);

    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([
      {
        id: '99999999-9999-4999-8999-999999999999',
        courtContactDescriptionId: 'desc-id',
        explanation: 'General enquiries',
        explanationCy: null,
        email: 'enquiries@example.test',
        phoneNumber: '01234 567890',
        courtContactDescription: null,
      },
    ] as never);
    const getContactDescriptionTypesStub = stub(DataApiRequests.prototype, 'getContactDescriptionTypes').resolves([
      { id: 'desc-id', name: 'Enquiries', nameCy: 'Ymholiadau' },
    ] as never);

    responseMock
      .expects('render')
      .once()
      .withArgs('court-contact-delete', {
        courtId: '11111111-1111-4111-8111-111111111111',
        courtName: 'Reading Crown Court',
        contactDetail: {
          id: '99999999-9999-4999-8999-999999999999',
          courtContactDescriptionId: 'desc-id',
          explanation: 'General enquiries',
          explanationCy: null,
          email: 'enquiries@example.test',
          phoneNumber: '01234 567890',
          courtContactDescription: null,
          description: 'Enquiries',
        },
        contactDetailId: '99999999-9999-4999-8999-999999999999',
        pageTitle: 'Delete contact details - Reading Crown Court',
      });

    try {
      await controller.renderDelete(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtContactDetailsStub);
      assert.calledOnce(getContactDescriptionTypesStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
      getContactDescriptionTypesStub.restore();
    }
  });

  test('renders court not found on delete contact details page when contact detail is missing', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: '99999999-9999-4999-8999-999999999999',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([] as never);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderDelete(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtContactDetailsStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
    }
  });

  test('deletes contact details and renders success screen', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: '99999999-9999-4999-8999-999999999999',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([
      {
        id: '99999999-9999-4999-8999-999999999999',
        courtContactDescriptionId: 'desc-id',
        explanation: 'General enquiries',
        explanationCy: null,
        email: 'enquiries@example.test',
        phoneNumber: '01234 567890',
        courtContactDescription: {
          name: 'Enquiries',
          nameCy: 'Ymholiadau',
        },
      },
    ] as never);
    const deleteCourtContactDetailStub = stub(DataApiRequests.prototype, 'deleteCourtContactDetail').resolves(
      HttpStatusCode.NoContent
    );

    responseMock.expects('render').once().withArgs('common-edit-success', {
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      continueUpdatingHref: '/courts/11111111-1111-4111-8111-111111111111/edit/contact-details',
      continueUpdatingText: 'Back to contact details',
      pageTitle: 'Contact details deleted: Enquiries',
      successPanelBody: 'contact details of Enquiries for Reading Crown Court have been successfully deleted.',
      successPanelTitle: 'Contact details deleted: 01234 567890, enquiries@example.test',
    });

    try {
      await controller.deleteContactDetail(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtContactDetailsStub);
      assert.calledOnce(deleteCourtContactDetailStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
      deleteCourtContactDetailStub.restore();
    }
  });

  test('renders error when deleting contact details fails', async () => {
    const controller = new CourtContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = {
      courtId: '11111111-1111-4111-8111-111111111111',
      contactDetailId: '99999999-9999-4999-8999-999999999999',
    };
    const responseMock = mock(response);

    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getCourtContactDetailsStub = stub(DataApiRequests.prototype, 'getCourtContactDetails').resolves([
      {
        id: '99999999-9999-4999-8999-999999999999',
        courtContactDescriptionId: 'desc-id',
        explanation: 'General enquiries',
        explanationCy: null,
        email: 'enquiries@example.test',
        phoneNumber: '01234 567890',
        courtContactDescription: {
          name: 'Enquiries',
          nameCy: 'Ymholiadau',
        },
      },
    ] as never);
    const deleteCourtContactDetailStub = stub(DataApiRequests.prototype, 'deleteCourtContactDetail').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.deleteContactDetail(request, response);

      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtContactDetailsStub);
      assert.calledOnce(deleteCourtContactDetailStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtContactDetailsStub.restore();
      deleteCourtContactDetailStub.restore();
    }
  });
});
