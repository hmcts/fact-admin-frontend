import { HttpStatusCode } from 'axios';

export type ContactSubmissionLike = {
  errorSummary: { href: string; text: string }[];
  selectedContactTypeId: string;
};

export type ContactSubmitFlowOutcome<TViewModel> =
  | { formViewModel: TViewModel; type: 'validation-error' }
  | { status: HttpStatusCode; type: 'save-error' }
  | { successPanelBody: string; type: 'saved' };

export type ContactWorkflowOptions<TSubmission extends ContactSubmissionLike, TItem, TViewModel> = {
  buildValidationViewModel: (submission: TSubmission, items: TItem[]) => TViewModel;
  getContactDescriptionTypeItems: (selectedId: string) => Promise<TItem[] | HttpStatusCode>;
  mergeApiErrors: (submission: TSubmission, apiErrors: Map<string, string>) => TSubmission;
  resolveSuccessPanelBody: () => Promise<string>;
  save: () => Promise<HttpStatusCode | Map<string, string> | undefined>;
  submission: TSubmission;
};

const successfulContactStatuses = [HttpStatusCode.Ok, HttpStatusCode.Created, HttpStatusCode.NoContent];

export async function runContactWorkflow<TSubmission extends ContactSubmissionLike, TItem, TViewModel>(
  options: ContactWorkflowOptions<TSubmission, TItem, TViewModel>
): Promise<ContactSubmitFlowOutcome<TViewModel>> {
  const validationOutcome = await buildValidationOutcome(options, options.submission);
  if (validationOutcome) {
    return validationOutcome;
  }

  const saveResult = await options.save();
  if (saveResult instanceof Map) {
    const submission = options.mergeApiErrors(options.submission, saveResult);
    return (await buildValidationOutcome(options, submission, true)) as ContactSubmitFlowOutcome<TViewModel>;
  }

  if (!saveResult || !successfulContactStatuses.includes(saveResult as HttpStatusCode)) {
    return {
      status: (saveResult as HttpStatusCode | undefined) ?? HttpStatusCode.InternalServerError,
      type: 'save-error',
    };
  }

  return { successPanelBody: await options.resolveSuccessPanelBody(), type: 'saved' };
}

async function buildValidationOutcome<TSubmission extends ContactSubmissionLike, TItem, TViewModel>(
  options: ContactWorkflowOptions<TSubmission, TItem, TViewModel>,
  submission: TSubmission,
  force = false
): Promise<ContactSubmitFlowOutcome<TViewModel> | undefined> {
  if (!force && !submission.errorSummary.length) {
    return undefined;
  }

  const items = await options.getContactDescriptionTypeItems(submission.selectedContactTypeId);
  if (typeof items === 'number') {
    return { status: items, type: 'save-error' };
  }

  return { formViewModel: options.buildValidationViewModel(submission, items), type: 'validation-error' };
}
