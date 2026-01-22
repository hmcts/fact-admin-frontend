import { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';
import type { SinonStub } from 'sinon';

import InfoController from '../../../main/controllers/InfoController';

jest.mock('@hmcts/info-provider', () => {
  const sinonLib = require('sinon');
  return { infoRequestHandler: sinonLib.stub() };
});

describe('InfoController', () => {
  test('delegates to infoRequestHandler', () => {
    const infoProvider = require('@hmcts/info-provider');
    const infoRequestHandlerStub = infoProvider.infoRequestHandler as SinonStub;
    const handler = stub();
    infoRequestHandlerStub.returns(handler);

    const controller = new InfoController();
    const request = {} as never;
    const response = {
      end: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const next = stub();

    responseMock.expects('end').never();
    controller.get(request, response, next);

    assert.calledOnce(infoRequestHandlerStub);
    assert.calledWithMatch(infoRequestHandlerStub, {
      extraBuildInfo: match({ name: 'FaCT Admin Frontend' }),
      info: {},
    });
    assert.calledWith(handler, request, response, next);
    responseMock.verify();
  });
});
