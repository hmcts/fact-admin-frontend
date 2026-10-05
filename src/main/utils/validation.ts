export const validateBooleanField = (value: boolean | null | undefined, errorMessage: string): string[] | null => {
  if (value === undefined || value === null) {
    return [errorMessage];
  }
  return null;
};

export type RequiredBooleanFieldRule<TModel> = {
  key: keyof TModel & string;
  message: string;
  value: (model: TModel) => boolean | null | undefined;
  when?: (model: TModel) => boolean;
};

export const addError = (
  errors: Record<string, string[]>,
  key: string,
  messages?: string[] | undefined | null
): string[] | undefined => {
  if (!messages || messages.length === 0) {
    return;
  }

  const next = [...(errors[key] ?? []), ...messages];
  errors[key] = next;
  return next;
};

export type Rule = {
  key: string;
  validate: (model) => string[] | undefined | null;
};

export type ValidationRule<TContext, TError> = {
  when: (context: TContext) => boolean;
  createError: (context: TContext) => TError;
};

export const collectValidationErrors = <TContext, TError>(
  context: TContext,
  rules: ValidationRule<TContext, TError>[]
): TError[] => rules.filter(rule => rule.when(context)).map(rule => rule.createError(context));

export const validateRequiredBooleanFields = <TModel>(
  model: TModel,
  rules: RequiredBooleanFieldRule<TModel>[]
): Record<string, string[]> => {
  const collectedErrors = collectValidationErrors(
    model,
    rules.map(rule => ({
      when: (currentModel: TModel) => (rule.when ? rule.when(currentModel) : true),
      createError: (currentModel: TModel) => ({
        key: rule.key,
        messages: validateBooleanField(rule.value(currentModel), rule.message),
      }),
    }))
  );

  return collectedErrors.reduce<Record<string, string[]>>((errors, error) => {
    addError(errors, error.key, error.messages);
    return errors;
  }, {});
};

// Reusable pattern rule
export const patternRule = (key: string, regex: RegExp, message: string): Rule => ({
  key,
  validate: m => {
    const value = m[key] as unknown as string;
    if (!value) {
      return undefined;
    } // let required rules handle empty
    return regex.test(value) ? undefined : [message];
  },
});
