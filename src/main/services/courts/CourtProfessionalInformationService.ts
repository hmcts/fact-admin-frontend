import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { CourtProfessionalInformation } from '../../schemas/courtProfessionalInformationSchema';
import {
  DX_CODE_MAX_LENGTH,
  DX_VALIDATION_ERROR,
  ENGLISH_TEXT_REGEX,
  FAX_NUMBER_VALIDATION_ERROR,
  GBS_VALIDATION_ERROR,
  INTEGER_REGEX,
  INTERVIEW_ROOM_COUNT_ERROR,
  MAX_REPEATABLE_ENTRIES,
  PHONE_NUMBER_REGEX,
  REPEATABLE_DESCRIPTION_MAX_LENGTH,
  WELSH_TEXT_REGEX,
} from '../../utils/variablesConstants';

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
  descriptionCy?: string;
  formIndex?: number;
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

type RepeatableApiError = {
  href: string;
  label: string;
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

export class CourtProfessionalInformationService {
  public constructor(private readonly courtApi = new CourtApi()) {}

  public async getViewModel(courtId: string): Promise<ProfessionalInformationViewModel | HttpStatusCode> {
    const courtResponse = await this.courtApi.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const professionalInformationResponse = await this.courtApi.getCourtProfessionalInformation(courtId);
    if (typeof professionalInformationResponse === 'number') {
      if (professionalInformationResponse !== HttpStatusCode.NotFound) {
        return professionalInformationResponse;
      }
      return this.buildViewModel(courtId, courtResponse.name, null);
    }

    return this.buildViewModel(courtId, courtResponse.name, professionalInformationResponse);
  }

  public async save(courtId: string, form: ProfessionalInformationForm): Promise<SaveProfessionalInformationResult> {
    const courtResponse = await this.courtApi.getCourtById(courtId);
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

    const saveResponse = await this.courtApi.saveCourtProfessionalInformation(courtId, this.toPayload(viewModel));

    if (typeof saveResponse === 'number') {
      return saveResponse;
    }

    if (saveResponse instanceof Map) {
      return {
        status: 'validationError',
        viewModel: this.withErrors(viewModel, this.mapApiErrors(saveResponse, viewModel)),
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
    const courtResponse = await this.courtApi.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const professionalInformationResponse = await this.courtApi.getCourtProfessionalInformation(courtId);
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

    const localAuthoritiesResponse = await this.courtApi.getCourtLocalAuthorities(courtId);
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
      dxCodes: this.toEntries(professionalInformation?.dxCodes, 'dxCode', 'explanation', 'explanationCy'),
      errorSummary: [],
      faxNumbers: this.toEntries(professionalInformation?.faxNumbers, 'faxNumber', 'description', 'descriptionCy'),
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
      dxCodes: this.extractRepeatableEntries(form, 'dxCode', 'dxCodeDescription', 'dxCodeDescriptionCy'),
      errorSummary: [],
      faxNumbers: this.extractRepeatableEntries(form, 'faxNumber', 'faxNumberDescription', 'faxNumberDescriptionCy'),
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
      } else if (!INTEGER_REGEX.test(code)) {
        errors.push({
          href: `#${option.codeField}`,
          text: `Enter a ${option.label.toLowerCase()} code using numbers only`,
        });
      }
    }

    if (viewModel.gbs.trim() && !ENGLISH_TEXT_REGEX.test(viewModel.gbs.trim())) {
      errors.push({
        href: '#gbs',
        text: GBS_VALIDATION_ERROR,
      });
    }

    if (viewModel.interviewRooms === true) {
      if (!viewModel.interviewRoomCount.trim()) {
        errors.push({
          href: '#interviewRoomCount',
          text: 'Enter the number of interview rooms',
        });
      } else if (!INTEGER_REGEX.test(viewModel.interviewRoomCount.trim())) {
        errors.push({
          href: '#interviewRoomCount',
          text: 'Enter the number of interview rooms using numbers only',
        });
      } else {
        const interviewRoomCount = Number(viewModel.interviewRoomCount.trim());
        if (interviewRoomCount < 1 || interviewRoomCount > 150) {
          errors.push({
            href: '#interviewRoomCount',
            text: INTERVIEW_ROOM_COUNT_ERROR,
          });
        }
      }
    }

    viewModel.dxCodes.forEach((dxCode, index) => {
      const formIndex = dxCode.formIndex ?? index;
      const code = dxCode.code?.trim() ?? '';
      const description = dxCode.description?.trim() ?? '';
      const descriptionCy = dxCode.descriptionCy?.trim() ?? '';
      const hasEnglishDescriptionOnly = Boolean(description) && !descriptionCy;
      const hasWelshDescriptionOnly = Boolean(descriptionCy) && !description;
      if (description && !code) {
        errors.push({
          href: `#dxCode-${formIndex}`,
          text: `DX code ${formIndex + 1}: You have entered a DX code explanation without a DX code, please add a code or remove the explanation`,
        });
      }
      if (descriptionCy && !code) {
        errors.push({
          href: `#dxCode-${formIndex}`,
          text: `DX code ${formIndex + 1}: You have entered a DX code Welsh explanation without a DX code, please add a code or remove the Welsh explanation`,
        });
      }
      if (hasEnglishDescriptionOnly) {
        errors.push({
          href: `#dxCodeDescriptionCy-${formIndex}`,
          text: `DX code ${formIndex + 1}: Because you provided an explanation in English, the Welsh translation is now mandatory`,
        });
      }
      if (hasWelshDescriptionOnly) {
        errors.push({
          href: `#dxCodeDescription-${formIndex}`,
          text: `DX code ${formIndex + 1}: Because you provided an explanation in Welsh, the English translation is now mandatory`,
        });
      }
      if (code.length > DX_CODE_MAX_LENGTH) {
        errors.push({
          href: `#dxCode-${formIndex}`,
          text: `DX code ${formIndex + 1}: DX code must be ${DX_CODE_MAX_LENGTH} characters or fewer`,
        });
      } else if (code && !ENGLISH_TEXT_REGEX.test(code)) {
        errors.push({
          href: `#dxCode-${formIndex}`,
          text: `DX code ${formIndex + 1}: ${DX_VALIDATION_ERROR}`,
        });
      }
      if (description.length > REPEATABLE_DESCRIPTION_MAX_LENGTH) {
        errors.push({
          href: `#dxCodeDescription-${formIndex}`,
          text: `DX code ${formIndex + 1} explanation: DX explanation must be ${REPEATABLE_DESCRIPTION_MAX_LENGTH} characters or fewer`,
        });
      } else if (description && !ENGLISH_TEXT_REGEX.test(description)) {
        errors.push({
          href: `#dxCodeDescription-${formIndex}`,
          text: `DX code ${formIndex + 1} explanation: ${DX_VALIDATION_ERROR}`,
        });
      }
      if (descriptionCy.length > REPEATABLE_DESCRIPTION_MAX_LENGTH) {
        errors.push({
          href: `#dxCodeDescriptionCy-${formIndex}`,
          text: `DX code ${formIndex + 1} Welsh explanation: DX Welsh explanation must be ${REPEATABLE_DESCRIPTION_MAX_LENGTH} characters or fewer`,
        });
      } else if (descriptionCy && !WELSH_TEXT_REGEX.test(descriptionCy)) {
        errors.push({
          href: `#dxCodeDescriptionCy-${formIndex}`,
          text: `DX code ${formIndex + 1} Welsh explanation: ${DX_VALIDATION_ERROR}`,
        });
      }
    });

    viewModel.faxNumbers.forEach((faxNumber, index) => {
      const formIndex = faxNumber.formIndex ?? index;
      const code = faxNumber.code?.trim() ?? '';
      const description = faxNumber.description?.trim() ?? '';
      const descriptionCy = faxNumber.descriptionCy?.trim() ?? '';
      const hasEnglishDescriptionOnly = Boolean(description) && !descriptionCy;
      const hasWelshDescriptionOnly = Boolean(descriptionCy) && !description;
      if (description && !code) {
        errors.push({
          href: `#faxNumber-${formIndex}`,
          text: `Fax number ${formIndex + 1}: You have entered a description without a fax number, please add a number or remove the description`,
        });
      }
      if (descriptionCy && !code) {
        errors.push({
          href: `#faxNumber-${formIndex}`,
          text: `Fax number ${formIndex + 1}: You have entered a Welsh description without a fax number, please add a number or remove the description`,
        });
      } else if (code && !PHONE_NUMBER_REGEX.test(code)) {
        errors.push({
          href: `#faxNumber-${formIndex}`,
          text: `Fax number ${formIndex + 1}: ${FAX_NUMBER_VALIDATION_ERROR}`,
        });
      }
      if (hasEnglishDescriptionOnly) {
        errors.push({
          href: `#faxNumberDescriptionCy-${formIndex}`,
          text: `Fax number ${formIndex + 1}: Because you provided an description in English, the Welsh translation is now mandatory`,
        });
      }
      if (hasWelshDescriptionOnly) {
        errors.push({
          href: `#faxNumberDescription-${formIndex}`,
          text: `Fax number ${formIndex + 1}: Because you provided an description in Welsh, the English translation is now mandatory`,
        });
      }
      if (description.length > REPEATABLE_DESCRIPTION_MAX_LENGTH) {
        errors.push({
          href: `#faxNumberDescription-${formIndex}`,
          text: `Fax number ${formIndex + 1} description: Fax description must be ${REPEATABLE_DESCRIPTION_MAX_LENGTH} characters or fewer`,
        });
      } else if (description && !ENGLISH_TEXT_REGEX.test(description)) {
        errors.push({
          href: `#faxNumberDescription-${formIndex}`,
          text: `Fax number ${formIndex + 1} description: ${DX_VALIDATION_ERROR}`,
        });
      }
      if (descriptionCy.length > REPEATABLE_DESCRIPTION_MAX_LENGTH) {
        errors.push({
          href: `#faxNumberDescriptionCy-${formIndex}`,
          text: `Fax number ${formIndex + 1} Welsh description: Fax description must be ${REPEATABLE_DESCRIPTION_MAX_LENGTH} characters or fewer`,
        });
      } else if (descriptionCy && !WELSH_TEXT_REGEX.test(descriptionCy)) {
        errors.push({
          href: `#faxNumberDescriptionCy-${formIndex}`,
          text: `Fax number ${formIndex + 1} Welsh description: ${DX_VALIDATION_ERROR}`,
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
          explanationCy: this.toNullableString(dxCode.descriptionCy),
        })),
      faxNumbers: viewModel.faxNumbers
        .filter(faxNumber => faxNumber.code?.trim())
        .map(faxNumber => ({
          faxNumber: faxNumber.code?.trim() ?? '',
          description: this.toNullableString(faxNumber.description),
          descriptionCy: this.toNullableString(faxNumber.descriptionCy),
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

  private mapApiErrors(
    errors: Map<string, string>,
    viewModel: ProfessionalInformationViewModel
  ): ProfessionalInformationError[] {
    return [...errors]
      .filter(([field]) => field.toLowerCase() !== 'timestamp')
      .map(([field, text]) => {
        const repeatableError = this.repeatableApiError(field, viewModel);
        const href = repeatableError?.href ?? this.apiErrorHref(field, text);
        const errorText = this.apiErrorText(field, text, href);
        return {
          href,
          text: repeatableError ? `${repeatableError.label}: ${errorText}` : errorText,
        };
      });
  }

  private apiErrorHref(field: string, text: string): string {
    const normalizedField = field.toLowerCase();
    const normalizedText = text.toLowerCase();
    const repeatableError = this.repeatableApiError(field);
    if (repeatableError) {
      return repeatableError.href;
    }
    if (this.matchesApiError(normalizedField, normalizedText, 'interviewRoomCount', 'interview room count')) {
      return '#interviewRoomCount';
    }
    if (this.matchesApiError(normalizedField, normalizedText, 'interviewPhoneNumber', 'interview phone number')) {
      return '#interviewPhoneNumber';
    }
    if (this.matchesApiError(normalizedField, normalizedText, 'interviewRooms', 'interview rooms')) {
      return '#interviewRooms';
    }
    if (this.matchesApiError(normalizedField, normalizedText, 'videoHearings', 'video hearing')) {
      return '#videoHearings';
    }
    if (this.matchesApiError(normalizedField, normalizedText, 'commonPlatform', 'common platform')) {
      return '#commonPlatform';
    }
    if (this.matchesApiError(normalizedField, normalizedText, 'accessScheme', 'access scheme')) {
      return '#accessScheme';
    }
    if (this.isFaxNumberDescriptionApiError(normalizedField, normalizedText)) {
      return '#faxNumberDescription-0';
    }
    if (this.isFaxNumberApiError(normalizedField, normalizedText)) {
      return '#faxNumber-0';
    }
    if (this.isGbsApiError(normalizedField, normalizedText)) {
      return '#gbs';
    }
    if (this.isDxCodeDescriptionApiError(normalizedField, normalizedText)) {
      return '#dxCodeDescription-0';
    }
    if (this.matchesApiError(normalizedField, normalizedText, 'dxCode', 'dx code')) {
      return '#dxCode-0';
    }
    const courtCodeHref = this.courtCodeApiErrorHref(normalizedField, normalizedText);
    if (courtCodeHref) {
      return courtCodeHref;
    }
    return field && field !== 'message' ? `#${field}` : '';
  }

  private repeatableApiError(
    field: string,
    viewModel?: ProfessionalInformationViewModel
  ): RepeatableApiError | undefined {
    const repeatableErrorMatch = field.match(
      /^(dxCodes|faxNumbers)\[(\d+)](?:\.(dxCode|explanation|explanationCy|faxNumber|description|descriptionCy))?$/i
    );
    if (!repeatableErrorMatch) {
      return undefined;
    }

    const [, listName, payloadIndex, fieldName] = repeatableErrorMatch;
    const formIndex = this.repeatableFormIndex(listName, Number(payloadIndex), viewModel);
    const displayIndex = formIndex + 1;
    const normalizedFieldName = fieldName?.toLowerCase();
    if (listName.toLowerCase() === 'dxcodes') {
      if (normalizedFieldName === 'explanation') {
        return {
          href: `#dxCodeDescription-${formIndex}`,
          label: `DX code ${displayIndex} explanation`,
        };
      }
      if (normalizedFieldName === 'explanationcy') {
        return {
          href: `#dxCodeDescriptionCy-${formIndex}`,
          label: `DX code ${displayIndex} Welsh explanation`,
        };
      }
      return {
        href: `#dxCode-${formIndex}`,
        label: `DX code ${displayIndex}`,
      };
    }

    if (normalizedFieldName === 'description') {
      return {
        href: `#faxNumberDescription-${formIndex}`,
        label: `Fax number ${displayIndex} description`,
      };
    }
    if (normalizedFieldName === 'descriptioncy') {
      return {
        href: `#faxNumberDescriptionCy-${formIndex}`,
        label: `Fax number ${displayIndex} Welsh description`,
      };
    }
    return {
      href: `#faxNumber-${formIndex}`,
      label: `Fax number ${displayIndex}`,
    };
  }

  private repeatableFormIndex(
    listName: string,
    payloadIndex: number,
    viewModel?: ProfessionalInformationViewModel
  ): number {
    const entries = listName.toLowerCase() === 'dxcodes' ? viewModel?.dxCodes : viewModel?.faxNumbers;
    const payloadEntries = entries?.filter(entry => entry.code?.trim()) ?? [];
    return payloadEntries[payloadIndex]?.formIndex ?? payloadIndex;
  }

  private apiErrorText(field: string, text: string, href?: string): string {
    const normalizedField = field.toLowerCase();
    const normalizedText = text.toLowerCase();
    if (
      normalizedField === 'interviewroomcount' ||
      normalizedText.includes('interview room count') ||
      normalizedText.includes('interviewroomcount')
    ) {
      return INTERVIEW_ROOM_COUNT_ERROR;
    }
    if (this.isFaxNumberFormatApiError(normalizedField, normalizedText)) {
      return FAX_NUMBER_VALIDATION_ERROR;
    }
    if (normalizedText.includes('invalid characters')) {
      if (href?.startsWith('#dxCode')) {
        return DX_VALIDATION_ERROR;
      }
      if (href === '#gbs') {
        return GBS_VALIDATION_ERROR;
      }
      if (href?.startsWith('#faxNumberDescription')) {
        return DX_VALIDATION_ERROR;
      }
      if (href?.startsWith('#faxNumber')) {
        return FAX_NUMBER_VALIDATION_ERROR;
      }
    }
    if (this.isFaxNumberInvalidCharactersApiError(normalizedField, normalizedText)) {
      return href?.startsWith('#faxNumberDescription') ? DX_VALIDATION_ERROR : FAX_NUMBER_VALIDATION_ERROR;
    }
    return text;
  }

  private isFaxNumberInvalidCharactersApiError(normalizedField: string, normalizedText: string): boolean {
    return normalizedField.includes('fax') && normalizedText.includes('invalid characters');
  }

  private isFaxNumberApiError(normalizedField: string, normalizedText: string): boolean {
    return (
      normalizedField.includes('fax') ||
      normalizedText.includes('fax') ||
      this.isFaxNumberFormatApiError(normalizedField, normalizedText)
    );
  }

  private isDxCodeDescriptionApiError(normalizedField: string, normalizedText: string): boolean {
    return (
      this.matchesApiError(normalizedField, normalizedText, 'dxCodeDescription', 'dx code explanation') ||
      (normalizedField.includes('dxcodes') && normalizedField.includes('explanation')) ||
      normalizedText.includes('explanation text')
    );
  }

  private isFaxNumberDescriptionApiError(normalizedField: string, normalizedText: string): boolean {
    return (
      this.matchesApiError(normalizedField, normalizedText, 'faxNumberDescription', 'fax number description') ||
      (normalizedField.includes('faxnumbers') && normalizedField.includes('description'))
    );
  }

  private isFaxNumberFormatApiError(normalizedField: string, normalizedText: string): boolean {
    return normalizedText.includes('regex') && (normalizedField.includes('fax') || normalizedText.includes('phone'));
  }

  private isGbsApiError(normalizedField: string, normalizedText: string): boolean {
    return normalizedField.includes('gbs') || normalizedText.includes('gbs code');
  }

  private matchesApiError(normalizedField: string, normalizedText: string, fieldName: string, label: string): boolean {
    const normalizedFieldName = fieldName.toLowerCase();
    return normalizedField.includes(normalizedFieldName) || normalizedText.includes(label);
  }

  private courtCodeApiErrorHref(normalizedField: string, normalizedText: string): string | undefined {
    const matchesCourtCode = (fieldName: CourtCodeField, label: string): boolean =>
      this.matchesApiError(normalizedField, normalizedText, fieldName, `${label} code`);

    if (matchesCourtCode('magistrateCourtCode', 'magistrates court')) {
      return '#magistrateCourtCode';
    }
    if (matchesCourtCode('familyCourtCode', 'family court')) {
      return '#familyCourtCode';
    }
    if (matchesCourtCode('tribunalCode', 'tribunal')) {
      return '#tribunalCode';
    }
    if (matchesCourtCode('countyCourtCode', 'county court')) {
      return '#countyCourtCode';
    }
    if (matchesCourtCode('crownCourtCode', 'crown court')) {
      return '#crownCourtCode';
    }

    return undefined;
  }

  private extractRepeatableEntries(
    form: ProfessionalInformationForm,
    codePrefix: string,
    descriptionPrefix: string,
    descriptionCyPrefix: string
  ): ProfessionalInformationEntry[] {
    const entries: ProfessionalInformationEntry[] = [];

    for (let index = 0; index < MAX_REPEATABLE_ENTRIES; index++) {
      const code = this.toString(form[`${codePrefix}-${index}`]);
      const description = this.toString(form[`${descriptionPrefix}-${index}`]);
      const descriptionCy = this.toString(form[`${descriptionCyPrefix}-${index}`]);
      if (code || description || descriptionCy || index === 0) {
        entries.push({ code, description, descriptionCy, formIndex: index });
      }
    }

    return entries.length ? entries : [{ code: '', description: '', descriptionCy: '', formIndex: 0 }];
  }

  private toEntries<T extends Record<string, unknown>>(
    items: T[] | null | undefined,
    codeKey: keyof T,
    descriptionKey: keyof T,
    descriptionCyKey: keyof T
  ): ProfessionalInformationEntry[] {
    const entries =
      items?.map((item, index) => ({
        code: this.toDisplayString(item[codeKey]),
        description: this.toDisplayString(item[descriptionKey]),
        descriptionCy: this.toDisplayString(item[descriptionCyKey]),
        formIndex: index,
      })) ?? [];

    return entries.length ? entries : [{ code: '', description: '', descriptionCy: '', formIndex: 0 }];
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
