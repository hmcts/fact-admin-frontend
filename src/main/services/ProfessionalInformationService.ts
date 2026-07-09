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

const maxRepeatableEntries = 5;
const integerPattern = /^\d+$/;
const phoneNumberPattern = /^(?:\+44)?[0-9 ]{10,20}$/;
const genericDescriptionPattern = /^[A-Za-z0-9 ()':,\-;.]+$/;
const dxCodeMaxLength = 200;
const repeatableDescriptionMaxLength = 250;
const faxNumberFormatError = 'Enter a fax number in the correct format, for example 01273 800 900 or 020 7450 4000';
const interviewRoomCountError = 'Enter a number of interview rooms between 1 and 150, or select No';
const invalidCharactersError = 'Value contains invalid characters';

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
          text: `DX code ${formIndex + 1}: You have entered a DX code welsh explanation without a DX code, please add a code or remove the welsh explanation`,
        });
      }
      if (hasEnglishDescriptionOnly) {
        errors.push({
          href: `#dxCodeDescriptionCy-${formIndex}`,
          text: `DX code ${formIndex + 1}: Enter a Welsh explanation`,
        });
      }
      if (hasWelshDescriptionOnly) {
        errors.push({
          href: `#dxCodeDescription-${formIndex}`,
          text: `DX code ${formIndex + 1}: Enter an explanation`,
        });
      }
      if (code.length > dxCodeMaxLength) {
        errors.push({
          href: `#dxCode-${formIndex}`,
          text: `DX code ${formIndex + 1}: DX code must be ${dxCodeMaxLength} characters or fewer`,
        });
      } else if (code && !genericDescriptionPattern.test(code)) {
        errors.push({
          href: `#dxCode-${formIndex}`,
          text: `DX code ${formIndex + 1}: ${invalidCharactersError}`,
        });
      }
      if (description.length > repeatableDescriptionMaxLength) {
        errors.push({
          href: `#dxCodeDescription-${formIndex}`,
          text: `DX code ${formIndex + 1} explanation: DX explanation must be ${repeatableDescriptionMaxLength} characters or fewer`,
        });
      } else if (description && !genericDescriptionPattern.test(description)) {
        errors.push({
          href: `#dxCodeDescription-${formIndex}`,
          text: `DX code ${formIndex + 1} explanation: ${invalidCharactersError}`,
        });
      }
      if (descriptionCy.length > repeatableDescriptionMaxLength) {
        errors.push({
          href: `#dxCodeDescriptionCy-${formIndex}`,
          text: `DX code ${formIndex + 1} welsh explanation: DX welsh explanation must be ${repeatableDescriptionMaxLength} characters or fewer`,
        });
      } else if (descriptionCy && !genericDescriptionPattern.test(descriptionCy)) {
        errors.push({
          href: `#dxCodeDescriptionCy-${formIndex}`,
          text: `DX code ${formIndex + 1} welsh explanation: ${invalidCharactersError}`,
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
      } else if (descriptionCy && !code) {
        errors.push({
          href: `#faxNumber-${formIndex}`,
          text: `Fax number ${formIndex + 1}: You have entered a welsh description without a fax number, please add a number or remove the description`,
        });
      } else if (code && !phoneNumberPattern.test(code)) {
        errors.push({
          href: `#faxNumber-${formIndex}`,
          text: `Fax number ${formIndex + 1}: ${faxNumberFormatError}`,
        });
      }
      if (hasEnglishDescriptionOnly) {
        errors.push({
          href: `#faxNumberDescriptionCy-${formIndex}`,
          text: `Fax number ${formIndex + 1}: Enter a Welsh description`,
        });
      }
      if (hasWelshDescriptionOnly) {
        errors.push({
          href: `#faxNumberDescription-${formIndex}`,
          text: `Fax number ${formIndex + 1}: Enter a description`,
        });
      }
      if (description.length > repeatableDescriptionMaxLength) {
        errors.push({
          href: `#faxNumberDescription-${formIndex}`,
          text: `Fax number ${formIndex + 1} description: Fax description must be ${repeatableDescriptionMaxLength} characters or fewer`,
        });
      } else if (description && !genericDescriptionPattern.test(description)) {
        errors.push({
          href: `#faxNumberDescription-${formIndex}`,
          text: `Fax number ${formIndex + 1} description: ${invalidCharactersError}`,
        });
      }
      if (descriptionCy.length > repeatableDescriptionMaxLength) {
        errors.push({
          href: `#faxNumberDescriptionCy-${formIndex}`,
          text: `Fax number ${formIndex + 1} welsh description: Fax description must be ${repeatableDescriptionMaxLength} characters or fewer`,
        });
      } else if (descriptionCy && !genericDescriptionPattern.test(descriptionCy)) {
        errors.push({
          href: `#faxNumberDescriptionCy-${formIndex}`,
          text: `Fax number ${formIndex + 1} welsh description: ${invalidCharactersError}`,
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
        const errorText = this.apiErrorText(field, text);
        return {
          href: repeatableError?.href ?? this.apiErrorHref(field, text),
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
      /^(dxCodes|faxNumbers)(?:\[(\d+)])(?:\.(dxCode|explanation|faxNumber|description))?$/i
    );
    if (!repeatableErrorMatch) {
      return undefined;
    }

    const [, listName, payloadIndex, fieldName] = repeatableErrorMatch;
    const formIndex = this.repeatableFormIndex(listName, Number(payloadIndex), viewModel);
    const displayIndex = formIndex + 1;
    if (listName.toLowerCase() === 'dxcodes') {
      if (fieldName?.toLowerCase() === 'explanation') {
        return {
          href: `#dxCodeDescription-${formIndex}`,
          label: `DX code ${displayIndex} explanation`,
        };
      }
      return {
        href: `#dxCode-${formIndex}`,
        label: `DX code ${displayIndex}`,
      };
    }

    if (fieldName?.toLowerCase() === 'description') {
      return {
        href: `#faxNumberDescription-${formIndex}`,
        label: `Fax number ${displayIndex} description`,
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
    if (this.isFaxNumberFormatApiError(normalizedField, normalizedText)) {
      return faxNumberFormatError;
    }
    return text;
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

    for (let index = 0; index < maxRepeatableEntries; index++) {
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
