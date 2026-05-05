import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import DownloadController from '../../../main/controllers/DownloadController';
import { DownloadCsvService } from '../../../main/services/DownloadCsvService';
import { mockRequest } from '../mocks/mockRequest';

describe('DownloadController', () => {
  test('downloads the CSV when the export succeeds', async () => {
    const controller = new DownloadController();
    const response = {
      send: () => '',
      setHeader: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    const responseMock = mock(response);
    const getDownloadCsvStub = stub(DownloadCsvService.prototype, 'getDownloadCsv').resolves({
      csv: 'Name\nReading Crown Court',
      filename: 'courts-2026-05-05.csv',
    });

    responseMock
      .expects('setHeader')
      .once()
      .withArgs('Content-Disposition', 'attachment; filename="courts-2026-05-05.csv"');
    responseMock.expects('setHeader').once().withArgs('Content-Type', 'text/csv; charset=utf-8');
    responseMock.expects('send').once().withArgs('Name\nReading Crown Court');

    try {
      await controller.get(request, response);
      assert.calledOnce(getDownloadCsvStub);
      responseMock.verify();
    } finally {
      getDownloadCsvStub.restore();
    }
  });

  test('renders the generic error page when the export fails', async () => {
    const controller = new DownloadController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    const responseMock = mock(response);
    const getDownloadCsvStub = stub(DownloadCsvService.prototype, 'getDownloadCsv').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(getDownloadCsvStub);
      responseMock.verify();
    } finally {
      getDownloadCsvStub.restore();
    }
  });
});
