import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import ServiceCentreContactController from '../../../main/controllers/ServiceCentreContactController';
import { ServiceCentreContactService } from '../../../main/services/ServiceCentreContactService';
import { mockRequest } from '../mocks/mockRequest';

const SERVICE_CENTRE_ID = '11111111-1111-4111-8111-111111111111';
const CONTACT_DETAIL_ID = '22222222-2222-4222-8222-222222222222';

describe('ServiceCentreContactController', () => {
  test('renders contact details list when service centre and contacts load', async () => {
    const controller = new ServiceCentreContactController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const listContactDetailsStub = stub(ServiceCentreContactService.prototype, 'listContactDetails').resolves([]);

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-contact-list',
        match((viewModel: Record<string, unknown>) => {
          return (
            viewModel.serviceCentreId === SERVICE_CENTRE_ID &&
            viewModel.serviceCentreName === 'Reading Service Centre' &&
            viewModel.pageTitle === 'Manage Contact details - Reading Service Centre'
          );
        })
      );

    try {
      await controller.get(request, response);
      assert.calledOnce(getServiceCentreByIdStub);
      assert.calledOnce(listContactDetailsStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      listContactDetailsStub.restore();
    }
  });

  test('renders not-found when serviceCentreId is invalid', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'invalid-id' };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.get(request, response);
      assert.notCalled(getServiceCentreByIdStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
    }
  });

  test('renders error when list contact details returns status code', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const listContactDetailsStub = stub(ServiceCentreContactService.prototype, 'listContactDetails').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(getServiceCentreByIdStub);
      assert.calledOnce(listContactDetailsStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      listContactDetailsStub.restore();
    }
  });

  test('renders service-centre-not-found when service-centre lookup returns not-found', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves(
      HttpStatusCode.NotFound
    );
    const listContactDetailsStub = stub(ServiceCentreContactService.prototype, 'listContactDetails');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.get(request, response);
      assert.calledOnce(getServiceCentreByIdStub);
      assert.notCalled(listContactDetailsStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      listContactDetailsStub.restore();
    }
  });

  test('renders add form when add page data loads', async () => {
    const controller = new ServiceCentreContactController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const getContactDescriptionTypeItemsStub = stub(
      ServiceCentreContactService.prototype,
      'getContactDescriptionTypeItems'
    ).resolves([]);
    const getEmptyFormValuesStub = stub(ServiceCentreContactService.prototype, 'getEmptyFormValues').returns({
      contactEmail: '',
      contactExplanation: '',
      contactMethods: [],
      contactTelephone: '',
    });

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-contact-form',
        match({
          breadcrumbs: [
            { href: '/', text: 'Home' },
            {
              href: `/service-centres/${SERVICE_CENTRE_ID}/edit`,
              text: 'Edit Reading Service Centre',
            },
            {
              href: `/service-centres/${SERVICE_CENTRE_ID}/edit/contact-details`,
              text: 'Contact details',
            },
            { href: '#', text: 'Add contact details' },
          ],
        })
      );

    try {
      await controller.renderAdd(request, response);
      assert.calledOnce(getServiceCentreByIdStub);
      assert.calledOnce(getContactDescriptionTypeItemsStub);
      assert.calledOnce(getEmptyFormValuesStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      getContactDescriptionTypeItemsStub.restore();
      getEmptyFormValuesStub.restore();
    }
  });

  test('renders error when add page cannot load contact description types', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const getContactDescriptionTypeItemsStub = stub(
      ServiceCentreContactService.prototype,
      'getContactDescriptionTypeItems'
    ).resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderAdd(request, response);
      assert.calledOnce(getContactDescriptionTypeItemsStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      getContactDescriptionTypeItemsStub.restore();
    }
  });

  test('renders service-centre-not-found when editing a missing contact detail', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, contactDetailId: CONTACT_DETAIL_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const getContactDetailByIdStub = stub(ServiceCentreContactService.prototype, 'getContactDetailById').resolves(
      undefined
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderEdit(request, response);
      assert.calledOnce(getServiceCentreByIdStub);
      assert.calledOnce(getContactDetailByIdStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      getContactDetailByIdStub.restore();
    }
  });

  test('renders edit form when contact detail exists', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, contactDetailId: CONTACT_DETAIL_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const getContactDetailByIdStub = stub(ServiceCentreContactService.prototype, 'getContactDetailById').resolves({
      id: CONTACT_DETAIL_ID,
      serviceCentreId: SERVICE_CENTRE_ID,
      serviceCentreContactDescriptionId: 'desc-1',
      serviceCentreContactDescription: null,
      email: 'test@example.com',
      phoneNumber: null,
      explanation: '',
    } as never);
    const getContactDescriptionTypeItemsStub = stub(
      ServiceCentreContactService.prototype,
      'getContactDescriptionTypeItems'
    ).resolves([]);
    const buildFormValuesStub = stub(ServiceCentreContactService.prototype, 'buildFormValues').returns({
      contactEmail: 'test@example.com',
      contactExplanation: '',
      contactMethods: ['email'],
      contactTelephone: '',
    });

    responseMock.expects('render').once().withArgs('service-centre-contact-form', match.object);

    try {
      await controller.renderEdit(request, response);
      assert.calledOnce(getContactDetailByIdStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      getContactDetailByIdStub.restore();
      getContactDescriptionTypeItemsStub.restore();
      buildFormValuesStub.restore();
    }
  });

  test('renders error when render edit contact detail lookup returns status', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, contactDetailId: CONTACT_DETAIL_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const getContactDetailByIdStub = stub(ServiceCentreContactService.prototype, 'getContactDetailById').resolves(
      HttpStatusCode.BadGateway
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadGateway).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderEdit(request, response);
      assert.calledOnce(getContactDetailByIdStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      getContactDetailByIdStub.restore();
    }
  });

  test('renders bad request and form model when add submission has validation errors', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {};
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const submitContactDetailFlowStub = stub(ServiceCentreContactService.prototype, 'submitContactDetailFlow').resolves(
      {
        type: 'validation-error',
        formViewModel: {
          pageTitle: 'Error: Add contact details - Reading Service Centre',
        },
      }
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-contact-form', match.object);

    try {
      await controller.addContactDetail(request, response);
      assert.calledOnce(submitContactDetailFlowStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      submitContactDetailFlowStub.restore();
    }
  });

  test('renders error when update submission returns save-error', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, contactDetailId: CONTACT_DETAIL_ID };
    request.body = {};
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const submitContactDetailFlowStub = stub(ServiceCentreContactService.prototype, 'submitContactDetailFlow').resolves(
      {
        type: 'save-error',
        status: HttpStatusCode.InternalServerError,
      }
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.updateContactDetail(request, response);
      assert.calledOnce(submitContactDetailFlowStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      submitContactDetailFlowStub.restore();
    }
  });

  test('renders delete success page when delete returns no-content', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, contactDetailId: CONTACT_DETAIL_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const getContactDetailByIdStub = stub(ServiceCentreContactService.prototype, 'getContactDetailById').resolves({
      id: CONTACT_DETAIL_ID,
      email: 'enquiries@example.test',
      phoneNumber: '01234 567890',
      serviceCentreId: SERVICE_CENTRE_ID,
      serviceCentreContactDescription: null,
    } as never);
    const resolveContactDetailDescriptionStub = stub(
      ServiceCentreContactService.prototype,
      'resolveContactDetailDescription'
    ).resolves('General enquiries');
    const deleteContactDetailStub = stub(ServiceCentreContactService.prototype, 'deleteContactDetail').resolves(
      HttpStatusCode.NoContent
    );

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'common-edit-success',
        match((viewModel: Record<string, unknown>) => {
          return (
            viewModel.pageTitle === 'Contact details deleted: General enquiries' &&
            viewModel.courtId === SERVICE_CENTRE_ID &&
            viewModel.courtName === 'Reading Service Centre'
          );
        })
      );

    try {
      await controller.deleteContactDetail(request, response);
      assert.calledOnce(deleteContactDetailStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      getContactDetailByIdStub.restore();
      resolveContactDetailDescriptionStub.restore();
      deleteContactDetailStub.restore();
    }
  });

  test('renders success panel when add submission succeeds', async () => {
    const controller = new ServiceCentreContactController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      'contact-email': 'enquiries@example.test',
      'contact-telephone': '01234 567890',
    };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const submitContactDetailFlowStub = stub(ServiceCentreContactService.prototype, 'submitContactDetailFlow').resolves(
      {
        type: 'success',
        successPanelBody: 'General enquiries',
      }
    );

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'common-edit-success',
        match((viewModel: Record<string, unknown>) => {
          return viewModel.pageTitle === 'Contact details added: General enquiries';
        })
      );

    try {
      await controller.addContactDetail(request, response);
      assert.calledOnce(submitContactDetailFlowStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      submitContactDetailFlowStub.restore();
    }
  });

  test('renders not-found when update route ids are invalid', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, contactDetailId: 'bad-id' };
    const responseMock = mock(response);

    const submitContactDetailFlowStub = stub(ServiceCentreContactService.prototype, 'submitContactDetailFlow');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.updateContactDetail(request, response);
      assert.notCalled(submitContactDetailFlowStub);
      responseMock.verify();
    } finally {
      submitContactDetailFlowStub.restore();
    }
  });

  test('renders delete confirmation page when contact exists', async () => {
    const controller = new ServiceCentreContactController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, contactDetailId: CONTACT_DETAIL_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const getContactDetailByIdStub = stub(ServiceCentreContactService.prototype, 'getContactDetailById').resolves({
      id: CONTACT_DETAIL_ID,
      serviceCentreId: SERVICE_CENTRE_ID,
      serviceCentreContactDescription: null,
      email: 'test@example.com',
      phoneNumber: null,
    } as never);
    const resolveContactDetailDescriptionStub = stub(
      ServiceCentreContactService.prototype,
      'resolveContactDetailDescription'
    ).resolves('General enquiries');

    responseMock.expects('render').once().withArgs('service-centre-contact-delete', match.object);

    try {
      await controller.renderDelete(request, response);
      assert.calledOnce(getContactDetailByIdStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      getContactDetailByIdStub.restore();
      resolveContactDetailDescriptionStub.restore();
    }
  });

  test('renders not-found when delete confirmation route ids are invalid', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'bad-id', contactDetailId: CONTACT_DETAIL_ID };
    const responseMock = mock(response);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    await controller.renderDelete(request, response);
    responseMock.verify();
  });

  test('renders not-found when delete success contact detail is missing', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, contactDetailId: CONTACT_DETAIL_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const getContactDetailByIdStub = stub(ServiceCentreContactService.prototype, 'getContactDetailById').resolves(
      undefined
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.deleteContactDetail(request, response);
      assert.calledOnce(getContactDetailByIdStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      getContactDetailByIdStub.restore();
    }
  });

  test('renders error when delete contact detail returns non-no-content status', async () => {
    const controller = new ServiceCentreContactController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, contactDetailId: CONTACT_DETAIL_ID };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreContactService.prototype, 'getServiceCentreById').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
    } as never);
    const getContactDetailByIdStub = stub(ServiceCentreContactService.prototype, 'getContactDetailById').resolves({
      id: CONTACT_DETAIL_ID,
      serviceCentreId: SERVICE_CENTRE_ID,
      serviceCentreContactDescription: null,
      email: 'test@example.com',
      phoneNumber: null,
    } as never);
    const resolveContactDetailDescriptionStub = stub(
      ServiceCentreContactService.prototype,
      'resolveContactDetailDescription'
    ).resolves('General enquiries');
    const deleteContactDetailStub = stub(ServiceCentreContactService.prototype, 'deleteContactDetail').resolves(
      HttpStatusCode.BadGateway
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadGateway).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.deleteContactDetail(request, response);
      assert.calledOnce(deleteContactDetailStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      getContactDetailByIdStub.restore();
      resolveContactDetailDescriptionStub.restore();
      deleteContactDetailStub.restore();
    }
  });
});
