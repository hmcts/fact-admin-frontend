export type OpeningHoursLikeForm = {
  sameTime?: string;
  selectedDays?: string[];
  [key: string]: string | string[] | undefined;
};

export type WeekdayConfig = {
  idPrefix: string;
  name: string;
  value: string;
};

export type OpeningTimesDetailLike = {
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
};

export type TimeValidationMessages = {
  sameTimeField: string;
  sameTimeError: string;
  selectedDaysField: string;
  selectedDaysError: string;
  missingTimePartError: (label: string) => string;
  invalidTimePartError: (label: string, maximum: number) => string;
  openingAfterClosingError: string;
  closingBeforeOpeningError: string;
  openingEqualsClosingError: string;
  closingEqualsOpeningError: string;
};

export type TimeValidationLabels = {
  sameTimePartLabel: (timePart: string) => string;
  dayTimePartLabel?: (dayName: string, timePart: string) => string;
};

export const normalizeSelectedValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((selectedValue): selectedValue is string => typeof selectedValue === 'string');
  }

  return typeof value === 'string' ? [value] : [];
};

export const validateWeekdayOpeningTimes = (
  form: OpeningHoursLikeForm,
  days: WeekdayConfig[],
  messages: TimeValidationMessages,
  labels: TimeValidationLabels
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (form.sameTime !== 'yes' && form.sameTime !== 'no') {
    errors[messages.sameTimeField] = messages.sameTimeError;
    return errors;
  }

  if (form.sameTime === 'yes') {
    validateTimeGroup(errors, form, 'same', undefined, messages, labels);
    return errors;
  }

  const selectedDays = Array.isArray(form.selectedDays) ? form.selectedDays : [];
  if (selectedDays.length === 0) {
    errors[messages.selectedDaysField] = messages.selectedDaysError;
    return errors;
  }

  selectedDays.forEach(selectedDay => {
    const dayConfig = days.find(config => config.value === selectedDay);
    if (dayConfig) {
      validateTimeGroup(errors, form, dayConfig.idPrefix, dayConfig.name, messages, labels);
    }
  });

  return errors;
};

export const toErrorSummary = (errors: Record<string, string>): { href: string; text: string }[] =>
  Object.entries(errors).map(([field, text]) => ({ href: `#${field}`, text }));

export const formatTime = (hour: string, minute: string): string =>
  `${hour.trim().padStart(2, '0')}:${minute.trim().padStart(2, '0')}`;

export const mapSelectedDayOpeningTimes = (
  form: OpeningHoursLikeForm,
  days: WeekdayConfig[]
): OpeningTimesDetailLike[] =>
  normalizeSelectedValues(form.selectedDays)
    .map(day => days.find(dayConfig => dayConfig.value === day))
    .filter((dayConfig): dayConfig is WeekdayConfig => Boolean(dayConfig))
    .map(dayConfig => ({
      dayOfWeek: dayConfig.value,
      openingTime: formatTime(
        form[`${dayConfig.idPrefix}OpeningHour`] as string,
        form[`${dayConfig.idPrefix}OpeningMinute`] as string
      ),
      closingTime: formatTime(
        form[`${dayConfig.idPrefix}ClosingHour`] as string,
        form[`${dayConfig.idPrefix}ClosingMinute`] as string
      ),
    }));

const validateTimeGroup = (
  errors: Record<string, string>,
  form: OpeningHoursLikeForm,
  prefix: string,
  dayName: string | undefined,
  messages: TimeValidationMessages,
  labels: TimeValidationLabels
): void => {
  const openingHourKey = `${prefix}OpeningHour`;
  const openingMinuteKey = `${prefix}OpeningMinute`;
  const closingHourKey = `${prefix}ClosingHour`;
  const closingMinuteKey = `${prefix}ClosingMinute`;
  const fieldLabel = (timePart: string): string => {
    if (dayName) {
      return labels.dayTimePartLabel ? labels.dayTimePartLabel(dayName, timePart) : `${dayName} ${timePart}`;
    }

    return labels.sameTimePartLabel(timePart);
  };

  validateTimePart(errors, form[openingHourKey], openingHourKey, fieldLabel('opening hour'), 23, messages);
  validateTimePart(errors, form[openingMinuteKey], openingMinuteKey, fieldLabel('opening minute'), 59, messages);
  validateTimePart(errors, form[closingHourKey], closingHourKey, fieldLabel('closing hour'), 23, messages);
  validateTimePart(errors, form[closingMinuteKey], closingMinuteKey, fieldLabel('closing minute'), 59, messages);

  if (errors[openingHourKey] || errors[openingMinuteKey] || errors[closingHourKey] || errors[closingMinuteKey]) {
    return;
  }

  const openingTime = toMinutes(form[openingHourKey] as string, form[openingMinuteKey] as string);
  const closingTime = toMinutes(form[closingHourKey] as string, form[closingMinuteKey] as string);

  if (openingTime > closingTime) {
    errors[openingHourKey] = messages.openingAfterClosingError;
    errors[closingHourKey] = messages.closingBeforeOpeningError;
  } else if (openingTime === closingTime) {
    errors[openingHourKey] = messages.openingEqualsClosingError;
    errors[closingHourKey] = messages.closingEqualsOpeningError;
  }
};

const validateTimePart = (
  errors: Record<string, string>,
  value: string | string[] | undefined,
  key: string,
  label: string,
  maximum: number,
  messages: TimeValidationMessages
): void => {
  const valueText = typeof value === 'string' ? value.trim() : '';

  if (!valueText) {
    errors[key] = messages.missingTimePartError(label);
    return;
  }

  if (!/^\d{1,2}$/.test(valueText) || Number(valueText) > maximum) {
    errors[key] = messages.invalidTimePartError(label, maximum);
  }
};

const toMinutes = (hour: string, minute: string): number => Number(hour) * 60 + Number(minute);
