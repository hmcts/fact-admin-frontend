import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import AccessibilityController from '../../../main/controllers/AccessibilityController';

jest.mock('../../../main/services/AccessibilityService', () => {
  const retrieve = jest.fn();
  const save = jest.fn();

  return {
    AccessibilityService: jest.fn().mockImplementation(() => ({
      retrieve,
      save,
    })),
    __mocks: {
      retrieve,
      save,
    },
  };
});

jest.mock('../../../main/utils/mapper', () => ({
  isHearingEnhancementEquipment: jest.fn((value: unknown) =>
    ['infraredAndHearingLoop', 'infrared', 'hearingLoop'].includes(String(value))
  ),
}));

jest.mock('../../../main/utils/valueParsers', () => ({
  isUuid: jest.fn(() => true),
  parseBoolean: jest.fn((value: unknown) => {
    if (value === true || value === 'true') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
    return undefined;
  }),
  parseLiftMetric: jest.fn((value: unknown) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : NaN;
    }
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : NaN;
  }),
}));

const { __mocks: serviceMocks } = jest.requireMock('../../../main/services/AccessibilityService');
const retrieveMock = serviceMocks.retrieve as jest.Mock;
const saveMock = serviceMocks.save as jest.Mock;

describe('AccessibilityController', () => {
  const controller = new AccessibilityController();

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
        'accessibility-edit',
        expect.objectContaining({
          courtId: req.params.courtId,
          model: expect.any(Object),
          pageTitle: 'Accessibility - Court A',
        })
      );
    });

    it('renders not found when retrieve returns not found', async () => {
      retrieveMock.mockResolvedValueOnce(HttpStatusCode.NotFound);

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' });
      const res = mockRes();

      await controller.renderEditView(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
      expect(res.render).toHaveBeenCalledWith('court-not-found');
    });

    it('renders error when retrieve returns numeric error', async () => {
      retrieveMock.mockResolvedValueOnce(HttpStatusCode.InternalServerError);

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' });
      const res = mockRes();

      await controller.renderEditView(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
      expect(res.render).toHaveBeenCalledWith('error');
    });
  });

  describe('updateCourt', () => {
    it('normalises posted values before save', async () => {
      saveMock.mockResolvedValueOnce({ name: 'Court A' });

      const req = mockReq(
        { courtId: '11111111-1111-1111-1111-111111111111' },
        {
          accessibleParking: 'true',
          accessibleParkingPhoneNumber: '01234567890',
          accessibleToiletDescription: 'Ground floor',
          accessibleEntrance: 'false',
          accessibleEntrancePhoneNumber: '01234567891',
          hearingEnhancementEquipment: 'infrared',
          lift: 'true',
          liftDoorWidth: 'abc',
          liftDoorLimit: '350',
          quietRoom: 'false',
        }
      );
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(saveMock).toHaveBeenCalledWith(
        req.params.courtId,
        expect.objectContaining({
          accessibleParking: true,
          accessibleEntrance: false,
          hearingEnhancementEquipment: 'infrared',
          lift: true,
          liftDoorWidth: NaN,
          liftDoorLimit: 350,
          quietRoom: false,
        })
      );

      expect(res.render).toHaveBeenCalledWith(
        'common-edit-success',
        expect.objectContaining({
          courtId: req.params.courtId,
          pageTitle: 'Accessibility saved - Court A',
        })
      );
    });

    it('re-renders edit view when save returns validation errors', async () => {
      saveMock.mockResolvedValueOnce({
        name: 'Court A',
        errors: { hearingEnhancementEquipment: ['Select what hearing enhancement equipment is available'] },
      });

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' }, {});
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'accessibility-edit',
        expect.objectContaining({
          pageTitle: 'Error: Accessibility - Court A',
        })
      );
    });

    it('renders error for numeric save status', async () => {
      saveMock.mockResolvedValueOnce(HttpStatusCode.InternalServerError);

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' }, {});
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
      expect(res.render).toHaveBeenCalledWith('error');
    });

    it('renders not found for invalid uuid', async () => {
      const { isUuid } = jest.requireMock('../../../main/utils/valueParsers');
      isUuid.mockReturnValueOnce(false);

      const req = mockReq({ courtId: 'bad-id' }, {});
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
      expect(res.render).toHaveBeenCalledWith('court-not-found');
    });

    it('supports numeric and non-string lift values during parsing', async () => {
      saveMock.mockResolvedValueOnce({ name: 'Court A' });

      const req = mockReq(
        { courtId: '11111111-1111-1111-1111-111111111111' },
        {
          accessibleParking: 'true',
          accessibleToiletDescription: 'Ground floor',
          accessibleEntrance: 'true',
          hearingEnhancementEquipment: 'hearingLoop',
          lift: 'true',
          liftDoorWidth: 125,
          liftDoorLimit: {},
          quietRoom: 'true',
        }
      );
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(saveMock).toHaveBeenCalledWith(
        req.params.courtId,
        expect.objectContaining({
          liftDoorWidth: 125,
          liftDoorLimit: undefined,
        })
      );
    });

    it('renders not found when save returns not found', async () => {
      saveMock.mockResolvedValueOnce(HttpStatusCode.NotFound);

      const req = mockReq({ courtId: '11111111-1111-1111-1111-111111111111' }, {});
      const res = mockRes();

      await controller.updateCourt(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
      expect(res.render).toHaveBeenCalledWith('court-not-found');
    });
  });
});
