import type { HearingEnhancementEquipmentApi } from '../../schemas/accessibilitySchema';

export interface UpdateAccessibilityRequest {
  courtId?: string;
  accessibleParking?: boolean;
  accessibleParkingPhoneNumber?: string | null;
  accessibleToiletDescription?: string | null;
  accessibleToiletDescriptionCy?: string | null;
  accessibleEntrance?: boolean;
  accessibleEntrancePhoneNumber?: string | null;
  hearingEnhancementEquipment?: HearingEnhancementEquipmentApi;
  lift?: boolean;
  liftDoorWidth?: number | null;
  liftDoorLimit?: number | null;
  quietRoom?: boolean;
}
