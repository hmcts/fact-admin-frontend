import { Request } from 'express';
import { stub } from 'sinon';
import type { SinonStub } from 'sinon';

export const mockRequest = (data: unknown): Request => {
  const req: Partial<Request> & { i18n?: { getDataByLanguage: SinonStub }; lng?: string } = {
    body: '',
    i18n: {
      getDataByLanguage: stub().returns(data),
    },
    lng: 'en',
    params: {},
  };

  return req as Request;
};
