import sinon, { restore, stub } from 'sinon';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { dataApi } from '../../../main/requests/utils/axiosConfig';

const dataApiRequests = new DataApiRequests();

const errorResponse = {
  response: {
    data: 'test error',
  },
};

const errorMessage = {
  message: 'test',
};

describe('DataApiRequests', () => {
  let getStub: sinon.SinonStub;

  beforeEach(() => {
    restore();
    getStub = stub(dataApi, 'get');
  });

  it('returns true when health status is UP', async () => {
    getStub.withArgs('/health').resolves({ data: { status: 'UP' } });
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(true);
  });

  it('returns false when health status is not UP', async () => {
    getStub.withArgs('/health').resolves({ data: { status: 'DOWN' } });
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(false);
  });

  it('returns false on error response', async () => {
    getStub.withArgs('/health').rejects(errorResponse);
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(false);
  });

  it('returns false on error message', async () => {
    getStub.withArgs('/health').rejects(errorMessage);
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(false);
  });
});
