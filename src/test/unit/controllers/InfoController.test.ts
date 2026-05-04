import { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';
import type { SinonStub } from 'sinon';

import InfoController from '../../../main/controllers/InfoController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';

jest.mock('@hmcts/info-provider', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sinonLib = require('sinon');
  return {
    InfoContributor: sinonLib.stub().callsFake((url: string) => ({ url })),
    infoRequestHandler: sinonLib.stub(),
  };
});

describe('InfoController', () => {
  test('delegates to infoRequestHandler', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const infoProvider = require('@hmcts/info-provider');
    const infoRequestHandlerStub = infoProvider.infoRequestHandler as SinonStub;
    const infoContributorStub = infoProvider.InfoContributor as SinonStub;
    const handler = stub();
    infoRequestHandlerStub.returns(handler);

    const controller = new InfoController();
    const request = {} as never;
    const response = {
      end: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const next = stub();
    const checkHealthStub = stub(DataApiRequests.prototype, 'checkHealth').resolves(true);

    responseMock.expects('end').never();
    await controller.get(request, response, next);

    try {
      assert.calledOnce(checkHealthStub);
      assert.calledOnce(infoRequestHandlerStub);
      assert.calledOnce(infoContributorStub);
      assert.calledWithMatch(infoRequestHandlerStub, {
        extraBuildInfo: match({ name: 'FaCT Admin Frontend', dataApiUp: true }),
        info: {
          DataApi: match({ url: match.string }),
        },
      });
      assert.calledWith(handler, request, response, next);
      responseMock.verify();
    } finally {
      checkHealthStub.restore();
    }
  });
});
