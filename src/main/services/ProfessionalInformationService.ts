import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtProfessionalInformation } from '../schemas/courtProfessionalInformationSchema';

type CourtCodeField = 'magistrateCourtCode' | 'familyCourtCode' | 'tribunalCode' | 'countyCourtCode' | 'crownCourtCode';

type CourtTypeOption = {
  codeField: CourtCodeField;
  codeLabel: string;
  label: string;
  value: string;
};

export type ProfessionalInformationForm = Record<string, string | string[] | undefined>;

export type ProfessionalInformationError = {
  href: string;
  text: string;
};

export type ProfessionalInformationEntry = {
  code?: string;
  description?: string;
};

export type ProfessionalInformationViewModel = {
  accessScheme?: boolean;
  commonPlatform?: boolean;
  courtId: string;
  courtName: string;
  courtTypeOptions: CourtTypeOption[];
  dxCodes: ProfessionalInformationEntry[];
  errorSummary: ProfessionalInformationError[];
  faxNumbers: ProfessionalInformationEntry[];
  fieldErrors: Record<string, string>;
  gbs: string;
  interviewPhoneNumber: string;
  interviewRoomCount: string;
  interviewRooms?: boolean;
  pageTitle: string;
  selectedCourtTypes: string[];
  selectedCourtTypeCodes: Record<CourtCodeField, string>;
  videoHearings?: boolean;
};

export type SaveProfessionalInformationResult =
  | {
      status: 'saved';
      viewModel: ProfessionalInformationViewModel;
    }
  | {
      status: 'validationError';
      viewModel: ProfessionalInformationViewModel;
    }
  | HttpStatusCode;

export type FamilyCourtRemovalConfirmation = {
  courtName: string;
  required: boolean;
};

export const courtTypeOptions: CourtTypeOption[] = [
  {
    codeField: 'magistrateCourtCode',
    codeLabel: 'Magistrates court code',
    label: 'Magistrates court',
    value: 'magistrates',
  },
  {
    codeField: 'familyCourtCode',
    codeLabel: 'Family court code',
    label: 'Family court',
    value: 'family',
  },
  {
    codeField: 'tribunalCode',
    codeLabel: 'Tribunal code',
    label: 'Tribunal',
    value: 'tribunal',
  },
  {
    codeField: 'countyCourtCode',
    codeLabel: 'County court code',
    label: 'County court',
    value: 'county',
  },
  {
    codeField: 'crownCourtCode',
    codeLabel: 'Crown court code',
    label: 'Crown court',
    value: 'crown',
  },
];

const maxRepeatableEntries = 5;
const integerPattern = /^\d+$/;
const phoneNumberPattern = /^(?:\+44)?[0-9 ]{10,20}$/;
const faxNumberFormatError = 'Enter a fax number in the correct format, for example 01273 800 900 or 020 7450 4000';
const interviewRoomCountError = 'Enter a number of interview rooms between 1 and 150, or select No';

export class ProfessionalInformationService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async getViewModel(courtId: string): Promise<ProfessionalInformationViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const professionalInformationResponse = await this.dataApiRequests.getCourtProfessionalInformation(courtId);
    if (typeof professionalInformationResponse === 'number') {
      if (professionalInformationResponse !== HttpStatusCode.NotFound) {
        return professionalInformationResponse;
      }
      return this.buildViewModel(courtId, courtResponse.name, null);
    }

    return this.buildViewModel(courtId, courtResponse.name, professionalInformationResponse);
  }

  public async save(courtId: string, form: ProfessionalInformationForm): Promise<SaveProfessionalInformationResult> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const viewModel = this.buildSubmittedViewModel(courtId, courtResponse.name, form);
    const errorSummary = this.validate(viewModel);
    if (errorSummary.length) {
      return {
        status: 'validationError',
        viewModel: this.withErrors(viewModel, errorSummary),
      };
    }

    const saveResponse = await this.dataApiRequests.saveCourtProfessionalInformation(
      courtId,
      this.toPayload(viewModel)
    );

    if (typeof saveResponse === 'number') {
      return saveResponse;
    }

    if (saveResponse instanceof Map) {
      return {
        status: 'validationError',
        viewModel: this.withErrors(viewModel, this.mapApiErrors(saveResponse)),
      };
    }

    return {
      status: 'saved',
      viewModel,
    };
  }

  public async requiresFamilyCourtRemovalConfirmation(
    courtId: string,
    form: ProfessionalInformationForm
  ): Promise<FamilyCourtRemovalConfirmation | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const professionalInformationResponse = await this.dataApiRequests.getCourtProfessionalInformation(courtId);
    if (typeof professionalInformationResponse === 'number') {
      if (professionalInformationResponse !== HttpStatusCode.NotFound) {
        return professionalInformationResponse;
      }
      return {
        courtName: courtResponse.name,
        required: false,
      };
    }

    const currentlyHasFamilyCourtCode = Boolean(professionalInformationResponse?.codes?.familyCourtCode);
    const submittedHasFamilyCourtType = this.toArray(form.courtTypes).includes('family');
    if (!currentlyHasFamilyCourtCode || submittedHasFamilyCourtType) {
      return {
        courtName: courtResponse.name,
        required: false,
      };
    }

    const localAuthoritiesResponse = await this.dataApiRequests.getCourtLocalAuthorities(courtId);
    if (typeof localAuthoritiesResponse === 'number') {
      if (localAuthoritiesResponse !== HttpStatusCode.NotFound) {
        return localAuthoritiesResponse;
      }
      return {
        courtName: courtResponse.name,
        required: false,
      };
    }

    return {
      courtName: courtResponse.name,
      required: localAuthoritiesResponse.some(area =>
        area.localAuthorities.some(localAuthority => localAuthority.selected)
      ),
    };
  }

  private buildViewModel(
    courtId: string,
    courtName: string,
    professionalInformation: CourtProfessionalInformation | null
  ): ProfessionalInformationViewModel {
    const codes = professionalInformation?.codes;
    const selectedCourtTypeCodes = courtTypeOptions.reduce(
      (selectedCodes, option) => ({
        ...selectedCodes,
        [option.codeField]: this.toDisplayString(codes?.[option.codeField]),
      }),
      {} as Record<CourtCodeField, string>
    );

    return {
      accessScheme: professionalInformation?.professionalInformation.accessScheme,
      commonPlatform: professionalInformation?.professionalInformation.commonPlatform,
      courtId,
      courtName,
      courtTypeOptions,
      dxCodes: this.toEntries(professionalInformation?.dxCodes, 'dxCode', 'explanation'),
      errorSummary: [],
      faxNumbers: this.toEntries(professionalInformation?.faxNumbers, 'faxNumber', 'description'),
      fieldErrors: {},
      gbs: codes?.gbs ?? '',
      interviewPhoneNumber: professionalInformation?.professionalInformation.interviewPhoneNumber ?? '',
      interviewRoomCount: this.toDisplayString(professionalInformation?.professionalInformation.interviewRoomCount),
      interviewRooms: professionalInformation?.professionalInformation.interviewRooms,
      pageTitle: `Information for professionals - ${courtName}`,
      selectedCourtTypes: courtTypeOptions
        .filter(option => selectedCourtTypeCodes[option.codeField])
        .map(option => option.value),
      selectedCourtTypeCodes,
      videoHearings: professionalInformation?.professionalInformation.videoHearings,
    };
  }

  private buildSubmittedViewModel(
    courtId: string,
    courtName: string,
    form: ProfessionalInformationForm
  ): ProfessionalInformationViewModel {
    const selectedCourtTypes = this.toArray(form.courtTypes);
    const selectedCourtTypeCodes = courtTypeOptions.reduce(
      (selectedCodes, option) => ({
        ...selectedCodes,
        [option.codeField]: this.toString(form[option.codeField]),
      }),
      {} as Record<CourtCodeField, string>
    );

    return {
      accessScheme: this.toOptionalBoolean(form.accessScheme),
      commonPlatform: this.toOptionalBoolean(form.commonPlatform),
      courtId,
      courtName,
      courtTypeOptions,
      dxCodes: this.extractRepeatableEntries(form, 'dxCode', 'dxCodeDescription'),
      errorSummary: [],
      faxNumbers: this.extractRepeatableEntries(form, 'faxNumber', 'faxNumberDescription'),
      fieldErrors: {},
      gbs: this.toString(form.gbs),
      interviewPhoneNumber: this.toString(form.interviewPhoneNumber),
      interviewRoomCount: this.toString(form.interviewRoomCount),
      interviewRooms: this.toOptionalBoolean(form.interviewRooms),
      pageTitle: `Information for professionals - ${courtName}`,
      selectedCourtTypes,
      selectedCourtTypeCodes,
      videoHearings: this.toOptionalBoolean(form.videoHearings),
    };
  }

  private validate(viewModel: ProfessionalInformationViewModel): ProfessionalInformationError[] {
    const errors: ProfessionalInformationError[] = [];

    for (const option of courtTypeOptions) {
      if (!viewModel.selectedCourtTypes.includes(option.value)) {
        continue;
      }

      const code = viewModel.selectedCourtTypeCodes[option.codeField].trim();
      if (!code) {
        errors.push({
          href: `#${option.codeField}`,
          text: `Enter a ${option.label.toLowerCase()} code`,
        });
      } else if (!integerPattern.test(code)) {
        errors.push({
          href: `#${option.codeField}`,
          text: `Enter a ${option.label.toLowerCase()} code using numbers only`,
        });
      }
    }

    if (viewModel.interviewRooms === true) {
      if (!viewModel.interviewRoomCount.trim()) {
        errors.push({
          href: '#interviewRoomCount',
          text: 'Enter the number of interview rooms',
        });
      } else if (!integerPattern.test(viewModel.interviewRoomCount.trim())) {
        errors.push({
          href: '#interviewRoomCount',
          text: 'Enter the number of interview rooms using numbers only',
        });
      } else {
        const interviewRoomCount = Number(viewModel.interviewRoomCount.trim());
        if (interviewRoomCount < 1 || interviewRoomCount > 150) {
          errors.push({
            href: '#interviewRoomCount',
            text: interviewRoomCountError,
          });
        }
      }
    }

    viewModel.dxCodes.forEach((dxCode, index) => {
      if (dxCode.description?.trim() && !dxCode.code?.trim()) {
        errors.push({
          href: `#dxCode-${index}`,
          text: 'You have entered a DX code explanation without a DX code, please add a code or remove the explanation',
        });
      }
    });

    viewModel.faxNumbers.forEach((faxNumber, index) => {
      if (faxNumber.description?.trim() && !faxNumber.code?.trim()) {
        errors.push({
          href: `#faxNumber-${index}`,
          text: 'You have entered a description without a fax number, please add a number or remove the description',
        });
      } else if (faxNumber.code?.trim() && !phoneNumberPattern.test(faxNumber.code.trim())) {
        errors.push({
          href: `#faxNumber-${index}`,
          text: faxNumberFormatError,
        });
      }
    });

    return errors;
  }

  private toPayload(viewModel: ProfessionalInformationViewModel): CourtProfessionalInformation {
    const codeFields = courtTypeOptions.reduce(
      (codes, option) => {
        const value = viewModel.selectedCourtTypes.includes(option.value)
          ? this.toOptionalNumber(viewModel.selectedCourtTypeCodes[option.codeField])
          : null;
        return {
          ...codes,
          [option.codeField]: value,
        };
      },
      {} as Record<CourtCodeField, number | null>
    );
    const gbs = this.toNullableString(viewModel.gbs);
    const hasCodes = Object.values(codeFields).some(value => value !== null) || gbs !== null;

    return {
      professionalInformation: {
        accessScheme: viewModel.accessScheme ?? false,
        commonPlatform: viewModel.commonPlatform ?? false,
        interviewPhoneNumber: viewModel.interviewRooms ? this.toNullableString(viewModel.interviewPhoneNumber) : null,
        interviewRoomCount: viewModel.interviewRooms ? this.toOptionalNumber(viewModel.interviewRoomCount) : 0,
        interviewRooms: viewModel.interviewRooms ?? false,
        videoHearings: viewModel.videoHearings ?? false,
      },
      codes: hasCodes
        ? {
            ...codeFields,
            gbs,
          }
        : null,
      dxCodes: viewModel.dxCodes
        .filter(dxCode => dxCode.code?.trim())
        .map(dxCode => ({
          dxCode: dxCode.code?.trim() ?? '',
          explanation: this.toNullableString(dxCode.description),
        })),
      faxNumbers: viewModel.faxNumbers
        .filter(faxNumber => faxNumber.code?.trim())
        .map(faxNumber => ({
          faxNumber: faxNumber.code?.trim() ?? '',
          description: this.toNullableString(faxNumber.description),
        })),
    };
  }

  private withErrors(
    viewModel: ProfessionalInformationViewModel,
    errorSummary: ProfessionalInformationError[]
  ): ProfessionalInformationViewModel {
    return {
      ...viewModel,
      errorSummary,
      fieldErrors: errorSummary.reduce(
        (fieldErrors, error) => ({
          ...fieldErrors,
          [error.href.replace('#', '')]: error.text,
        }),
        {}
      ),
    };
  }

  private mapApiErrors(errors: Map<string, string>): ProfessionalInformationError[] {
    return [...errors]
      .filter(([field]) => field.toLowerCase() !== 'timestamp')
      .map(([field, text]) => ({
        href: this.apiErrorHref(field, text),
        text: this.apiErrorText(field, text),
      }));
  }

  private apiErrorHref(field: string, text: string): string {
    const normalizedField = field.toLowerCase();
    const normalizedText = text.toLowerCase();
    if (
      normalizedField === 'interviewroomcount' ||
      normalizedText.includes('interview room count') ||
      normalizedText.includes('interviewroomcount')
    ) {
      return '#interviewRoomCount';
    }
    if (this.isFaxNumberApiError(normalizedField, normalizedText)) {
      return '#faxNumber-0';
    }
    return field && field !== 'message' ? `#${field}` : '';
  }

  private apiErrorText(field: string, text: string): string {
    const normalizedField = field.toLowerCase();
    const normalizedText = text.toLowerCase();
    if (
      normalizedField === 'interviewroomcount' ||
      normalizedText.includes('interview room count') ||
      normalizedText.includes('interviewroomcount')
    ) {
      return interviewRoomCountError;
    }
    if (this.isFaxNumberApiError(normalizedField, normalizedText)) {
      return faxNumberFormatError;
    }
    return text;
  }

  private isFaxNumberApiError(normalizedField: string, normalizedText: string): boolean {
    return (
      normalizedField.includes('fax') ||
      normalizedText.includes('fax') ||
      (normalizedText.includes('phone number') && normalizedText.includes('regex'))
    );
  }

  private extractRepeatableEntries(
    form: ProfessionalInformationForm,
    codePrefix: string,
    descriptionPrefix: string
  ): ProfessionalInformationEntry[] {
    const entries: ProfessionalInformationEntry[] = [];

    for (let index = 0; index < maxRepeatableEntries; index++) {
      const code = this.toString(form[`${codePrefix}-${index}`]);
      const description = this.toString(form[`${descriptionPrefix}-${index}`]);
      if (code || description || index === 0) {
        entries.push({ code, description });
      }
    }

    return entries.length ? entries : [{ code: '', description: '' }];
  }

  private toEntries<T extends Record<string, unknown>>(
    items: T[] | null | undefined,
    codeKey: keyof T,
    descriptionKey: keyof T
  ): ProfessionalInformationEntry[] {
    const entries =
      items?.map(item => ({
        code: this.toDisplayString(item[codeKey]),
        description: this.toDisplayString(item[descriptionKey]),
      })) ?? [];

    return entries.length ? entries : [{ code: '', description: '' }];
  }

  private toArray(value: string | string[] | undefined): string[] {
    return [value].flat().filter((item): item is string => Boolean(item));
  }

  private toString(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || '' : value || '';
  }

  private toOptionalBoolean(value: string | string[] | undefined): boolean | undefined {
    const resolvedValue = this.toString(value);
    if (resolvedValue === 'true') {
      return true;
    }
    if (resolvedValue === 'false') {
      return false;
    }
    return undefined;
  }

  private toOptionalNumber(value: string | number | null | undefined): number | null {
    if (typeof value === 'number') {
      return value;
    }

    const resolvedValue = this.toDisplayString(value);
    return resolvedValue ? Number(resolvedValue) : null;
  }

  private toNullableString(value: string | null | undefined): string | null {
    const resolvedValue = value?.trim();
    return resolvedValue || null;
  }

  private toDisplayString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }
}
