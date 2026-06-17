import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import BuildingFacilitiesController from '../../../main/controllers/BuildingFacilitiesController';

// Mock service module used by controller
jest.mock('../../../main/services/BuildingFacilitiesService', () => {
  const retrieve = jest.fn();
  const save = jest.fn();

  return {
    BuildingFacilitiesService: jest.fn().mockImplementation(() => ({
      retrieve,
      save,
    })),
    __mocks: {
      retrieve,
      save,
    },
  };
});

jest.mock('../../../main/utils/valueParsers', () => ({
  isUuid: jest.fn(() => true),
  parseBoolean: jest.fn(() => true),
}));
jest.mock('../../../main/utils/mapper', () => ({
  mapFoodAndDrink: jest.fn(() => ({
    freeWaterDispensers: false,
    snackVendingMachines: false,
    drinkVendingMachines: false,
    cafeteria: false,
  })),
  addFoodAndDrink: jest.fn(m => m),
}));

const { __mocks: serviceMocks } = jest.requireMock('../../../main/services/BuildingFacilitiesService');
const retrieveMock = serviceMocks.retrieve as jest.Mock;
const saveMock = serviceMocks.save as jest.Mock;

describe('BuildingFacilitiesController', () => {
  const controller = new BuildingFacilitiesController();

  type MockResponse = Response & {
    status: jest.Mock;
    render: jest.Mock;
  };

  const mockReq = (params: Request['params'], body: Request['body'] = {}): Request =>
    ({ params, body }) as unknown as Request;

  const mockRes = (): MockResponse => {
    const res = {
      status: jest.fn(),
      render: jest.fn(),
    } as unknown as MockResponse;

    res.status.mockReturnValue(res);
    res.render.mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renderEditView', () => {
    it('renders not found for invalid uuid', async () => {
      const { isUuid } = jest.requireMock('../../../main/utils/valueParsers');
      isUuid.mockReturnValueOnce(false);

      const req = mockReq({ courtId: 'bad-id' });
      const res = mockRes();

      await controller.renderEditView(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
      expect(res.render).toHaveBeenCalledWith('court-not-found');
    });

    it('renders edit view for valid model', async () => {
      retrieveMock.mockResolvedValueOnce({ id: 'cid', name: 'Court A' });

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' });
      const res = mockRes();

      await controller.renderEditView(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'building-facilities-edit',
        expect.objectContaining({
          courtId: req.params.courtId,
          model: expect.any(Object),
          pageTitle: 'Building Facilities - Court A',
        })
      );
    });

    it('uses first courtId value when route param is an array', async () => {
      retrieveMock.mockResolvedValueOnce({ id: 'cid', name: 'Court A' });

      const req = mockReq({ courtId: ['11111111-1111-1111-1111-111111111111'] });
      const res = mockRes();

      await controller.renderEditView(req, res);

      expect(retrieveMock).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
      expect(res.render).toHaveBeenCalledWith(
        'building-facilities-edit',
        expect.objectContaining({ courtId: '11111111-1111-1111-1111-111111111111' })
      );
    });

    it('renders error when retrieve returns numeric error', async () => {
      retrieveMock.mockResolvedValueOnce(HttpStatusCode.InternalServerError);

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' });
      const res = mockRes();

      await controller.renderEditView(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
      expect(res.render).toHaveBeenCalledWith('error');
    });

    it('renders not found when retrieve returns not found', async () => {
      retrieveMock.mockResolvedValueOnce(HttpStatusCode.NotFound);

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' });
      const res = mockRes();

      await controller.renderEditView(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
      expect(res.render).toHaveBeenCalledWith('court-not-found');
    });
  });

  describe('updateCourt', () => {
    it('renders not found for invalid uuid', async () => {
      const { isUuid } = jest.requireMock('../../../main/utils/valueParsers');
      isUuid.mockReturnValueOnce(false);

      const req = mockReq({ courtId: 'bad-id' }, {});
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
      expect(res.render).toHaveBeenCalledWith('court-not-found');
    });

    it('passes waitingAreaChildren and resolved courtId to save', async () => {
      saveMock.mockResolvedValueOnce({ name: 'Court A' });

      const req = mockReq(
        { courtId: '11111111-1111-1111-1111-111111111111' },
        {
          parking: 'true',
          foodAndDrink: ['cafeteria'],
          waitingArea: 'true',
          waitingAreaChildren: 'true',
          quietRoom: 'false',
          babyChanging: 'false',
          wifi: 'true',
        }
      );
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(saveMock).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', {
        babyChanging: true,
        cafeteria: false,
        courtId: '11111111-1111-1111-1111-111111111111',
        drinkVendingMachines: false,
        freeWaterDispensers: false,
        parking: true,
        quietRoom: true,
        snackVendingMachines: false,
        waitingArea: true,
        waitingAreaChildren: true,
        wifi: true,
      });

      expect(res.render).toHaveBeenCalledWith(
        'common-edit-success',
        expect.objectContaining({
          courtId: '11111111-1111-1111-1111-111111111111',
          courtName: 'Court A',
          pageTitle: 'Building Facilities saved - Court A',
          successPanelBody: 'Building Facilities details for Court A have been saved successfully.',
          successPanelTitle: 'Building Facilities details saved',
        })
      );
    });

    it('uses first courtId value on save when route param is an array', async () => {
      saveMock.mockResolvedValueOnce({ name: 'Court A' });

      const req = mockReq({ courtId: ['11111111-1111-1111-1111-111111111111'] }, {});
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(saveMock).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', expect.any(Object));
    });

    it('renders not found when save returns not found', async () => {
      saveMock.mockResolvedValueOnce(HttpStatusCode.NotFound);

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' }, {});
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
      expect(res.render).toHaveBeenCalledWith('court-not-found');
    });

    it('renders error when save returns numeric error', async () => {
      saveMock.mockResolvedValueOnce(HttpStatusCode.InternalServerError);

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' }, {});
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
      expect(res.render).toHaveBeenCalledWith('error');
    });

    it('re-renders edit with validation errors', async () => {
      saveMock.mockResolvedValueOnce({
        name: 'Court A',
        errors: { waitingAreaChildren: ['Select yes or no'] },
      });

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' }, {});
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'building-facilities-edit',
        expect.objectContaining({
          courtId: req.params.courtId,
          pageTitle: 'Error: Building Facilities - Court A',
        })
      );
    });
  });
});
