export const validateBooleanField = (value: boolean | null | undefined, errorMessage: string): string[] | null => {
  if (value === undefined || value === null) {
    return [errorMessage];
  }
  return null;
};

export const addError = (
  errors: Record<string, string[]>,
  key: string,
  messages?: string[] | undefined | null
): string[] | undefined => {
  if (!messages) {
    return;
  }
  return (errors[key] = [...(errors[key] ?? []), ...messages]);
};

export type Rule = {
  key: string;
  validate: (model) => string[] | undefined | null;
};

//  Reusable pattern rule
export const patternRule = (key: string, regex: RegExp, message: string): Rule => ({
  key,
  validate: m => {
    const value = (m[key] as unknown as string)?.trim();
    if (!value) {
      return undefined;
    } // let required rules handle empty
    return regex.test(value) ? undefined : [message];
  },
});
