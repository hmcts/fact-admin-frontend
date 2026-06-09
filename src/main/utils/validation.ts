export const validateBooleanField=(value: boolean | null | undefined, errorMessage: string): string[] | null=> {
  if (value === undefined || value === null) {
    return [errorMessage];
  }
  return null;
};
