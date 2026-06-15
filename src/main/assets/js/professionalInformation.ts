type RepeatableType = 'dxCode' | 'faxNumber';

type RepeatableFieldName = 'dxCode' | 'dxCodeDescription' | 'faxNumber' | 'faxNumberDescription';

type RepeatableFieldConfig = {
  hint?: string;
  label: string;
  name: RepeatableFieldName;
};

type RepeatableConfig = {
  fields: readonly RepeatableFieldConfig[];
  heading: string;
  removeText: string;
};

const defaultMaxItems = 5;
const itemSelector = '[data-professional-information-item]';
const listSelector = '[data-professional-information-list]';
const removeButtonSelector = '[data-professional-information-remove]';

const repeatableConfigs: { readonly [key in RepeatableType]: RepeatableConfig } = {
  dxCode: {
    heading: 'DX code',
    fields: [
      {
        label: 'DX code',
        name: 'dxCode',
        hint: 'Please enter the DX code you wish to display.',
      },
      {
        label: 'Explanation',
        name: 'dxCodeDescription',
        hint: 'Enter the explanation text for this DX code.',
      },
    ],
    removeText: 'Remove DX code',
  },
  faxNumber: {
    heading: 'Fax number',
    fields: [
      {
        label: 'Fax number',
        name: 'faxNumber',
      },
      {
        label: 'Description',
        name: 'faxNumberDescription',
      },
    ],
    removeText: 'Remove Fax number',
  },
};

export function initProfessionalInformationRepeatableFields(): void {
  const lists = Array.from(document.querySelectorAll<HTMLElement>(listSelector));
  const listCounts = countRepeatableLists(lists);
  const listIndexes: Partial<Record<RepeatableType, number>> = {};

  lists.forEach(list => {
    const type = getRepeatableType(list.dataset.professionalInformationList);
    if (!type) {
      return;
    }

    const index = listIndexes[type] ?? 0;
    listIndexes[type] = index + 1;
    initialiseRepeatableList(list, type, listCounts[type] > 1 ? index : undefined);
  });
}

function initialiseRepeatableList(list: HTMLElement, type: RepeatableType, duplicateIndex?: number): void {
  const addButton = findAddButton(list, type);
  if (!addButton) {
    return;
  }

  if (duplicateIndex !== undefined) {
    list.dataset.professionalInformationIdPrefix = `professional-information-${type}-${duplicateIndex + 1}`;
  }

  if (list.dataset.professionalInformationInitialised !== 'true') {
    list.addEventListener('click', event => handleRemoveClick(event, list, type, addButton));
    list.dataset.professionalInformationInitialised = 'true';
  }

  if (addButton.dataset.professionalInformationInitialised !== 'true') {
    addButton.addEventListener('click', () => addRepeatableItem(list, type, addButton));
    addButton.dataset.professionalInformationInitialised = 'true';
  }

  reindexRepeatableItems(list, type);
  updateRepeatableControls(list, addButton);
}

function handleRemoveClick(
  event: MouseEvent,
  list: HTMLElement,
  type: RepeatableType,
  addButton: HTMLButtonElement
): void {
  const target = event.target as HTMLElement | null;
  const removeButton = target?.closest?.(removeButtonSelector) as HTMLButtonElement | null;
  if (!removeButton || removeButton.closest(listSelector) !== list) {
    return;
  }

  removeRepeatableItem(list, type, removeButton, addButton);
}

function addRepeatableItem(list: HTMLElement, type: RepeatableType, button: HTMLButtonElement): void {
  const items = getRepeatableItems(list);
  if (items.length >= getMaxItems(list)) {
    return;
  }

  const item = buildRepeatableItem(list, type, items.length);
  list.append(item);

  reindexRepeatableItems(list, type);
  updateRepeatableControls(list, button);
  item.querySelector<HTMLInputElement>('input')?.focus();
}

function removeRepeatableItem(
  list: HTMLElement,
  type: RepeatableType,
  button: HTMLButtonElement,
  addButton: HTMLButtonElement
): void {
  const item = button.closest(itemSelector);
  if (!item || item.closest(listSelector) !== list) {
    return;
  }

  item.remove();
  reindexRepeatableItems(list, type);
  updateRepeatableControls(list, addButton);
}

function buildRepeatableItem(list: HTMLElement, type: RepeatableType, index: number): HTMLElement {
  const config = repeatableConfigs[type];
  const item = document.createElement('div');
  item.className = 'professional-information-repeatable';
  item.dataset.professionalInformationItem = '';
  item.dataset.professionalInformationType = type;
  item.append(buildHeading(config.heading, index));
  item.append(
    ...config.fields.map(field => buildInput(list, field, index)),
    buildRemoveButton(config.removeText, index)
  );
  return item;
}

function buildHeading(text: string, index: number): HTMLParagraphElement {
  const heading = document.createElement('p');
  heading.className = 'govuk-body govuk-!-margin-bottom-1';
  heading.dataset.professionalInformationHeading = '';
  heading.textContent = `${text} ${index + 1}`;
  return heading;
}

function buildInput(list: HTMLElement, field: RepeatableFieldConfig, index: number): HTMLElement {
  const formGroup = document.createElement('div');
  formGroup.className = 'govuk-form-group';
  formGroup.dataset.professionalInformationField = field.name;

  const id = inputId(list, field, index);
  const name = inputName(field, index);

  const label = document.createElement('label');
  label.className = 'govuk-label govuk-!-margin-bottom-1';
  label.htmlFor = id;
  label.textContent = field.label;
  formGroup.append(label);

  if (field.hint) {
    const hint = document.createElement('div');
    hint.className = 'govuk-hint';
    hint.id = hintId(id);
    hint.textContent = field.hint;
    formGroup.append(hint);
  }

  const input = document.createElement('input');
  input.className = 'govuk-input govuk-input--width-20';
  input.dataset.professionalInformationField = field.name;
  input.id = id;
  input.name = name;
  input.type = 'text';
  if (field.hint) {
    input.setAttribute('aria-describedby', hintId(id));
  }
  formGroup.append(input);

  return formGroup;
}

function buildRemoveButton(text: string, index: number): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'govuk-button govuk-button--warning professional-information-repeatable__remove';
  button.dataset.professionalInformationRemove = '';
  button.type = 'button';
  button.textContent = `${text} ${index + 1}`;
  return button;
}

function reindexRepeatableItems(list: HTMLElement, type: RepeatableType): void {
  const config = repeatableConfigs[type];

  getRepeatableItems(list).forEach((item, index) => {
    const heading = item.querySelector('[data-professional-information-heading]');
    if (heading) {
      heading.textContent = `${config.heading} ${index + 1}`;
    }

    config.fields.forEach(field => updateInput(item, list, field, index));
    updateRemoveButton(item, config, index);
  });
}

function updateInput(item: HTMLElement, list: HTMLElement, field: RepeatableFieldConfig, index: number): void {
  const input = findInput(item, field);
  if (!input) {
    return;
  }

  const id = inputId(list, field, index);
  input.id = id;
  input.name = inputName(field, index);
  input.dataset.professionalInformationField = field.name;

  const formGroup = input.closest<HTMLElement>('.govuk-form-group');
  if (formGroup) {
    formGroup.dataset.professionalInformationField = field.name;
  }

  const label = formGroup?.querySelector<HTMLLabelElement>('label');
  if (label) {
    label.htmlFor = id;
  }

  const hint = formGroup?.querySelector<HTMLElement>('.govuk-hint');
  if (hint) {
    hint.id = hintId(id);
    input.setAttribute('aria-describedby', hint.id);
  } else {
    input.removeAttribute('aria-describedby');
  }
}

function updateRemoveButton(item: HTMLElement, config: RepeatableConfig, index: number): void {
  const removeButton = item.querySelector<HTMLButtonElement>(removeButtonSelector);
  if (!removeButton) {
    return;
  }

  removeButton.textContent = `${config.removeText} ${index + 1}`;
  removeButton.hidden = index === 0;
}

function updateRepeatableControls(list: HTMLElement, button: HTMLButtonElement): void {
  const atMax = getRepeatableItems(list).length >= getMaxItems(list);
  button.hidden = atMax;
  button.classList.toggle('govuk-!-display-none', atMax);
  if (atMax) {
    button.setAttribute('aria-hidden', 'true');
  } else {
    button.removeAttribute('aria-hidden');
  }
}

function findInput(item: HTMLElement, field: RepeatableFieldConfig): HTMLInputElement | null {
  return (
    item.querySelector<HTMLInputElement>(`input[data-professional-information-field="${field.name}"]`) ??
    item.querySelector<HTMLInputElement>(`input[name^="${field.name}-"]`)
  );
}

function findAddButton(list: HTMLElement, type: RepeatableType): HTMLButtonElement | null {
  const scope = list.parentElement ?? document;
  const buttons = Array.from(
    scope.querySelectorAll<HTMLButtonElement>(`[data-professional-information-add="${type}"]`)
  );
  if (!buttons.length) {
    return null;
  }

  const siblingButton = buttons.find(button => {
    if (button.parentElement !== list.parentElement || !list.parentElement) {
      return false;
    }

    const siblings = Array.from(list.parentElement.children);
    return siblings.indexOf(button) > siblings.indexOf(list);
  });

  return siblingButton ?? buttons[0];
}

function getRepeatableItems(list: HTMLElement): HTMLElement[] {
  return Array.from(list.querySelectorAll<HTMLElement>(itemSelector));
}

function getMaxItems(list: HTMLElement): number {
  const parsedMaxItems = Number.parseInt(list.dataset.professionalInformationMax ?? '', 10);
  return Number.isFinite(parsedMaxItems) && parsedMaxItems > 0 ? parsedMaxItems : defaultMaxItems;
}

function inputId(list: HTMLElement, field: RepeatableFieldConfig, index: number): string {
  const name = inputName(field, index);
  const prefix = list.dataset.professionalInformationIdPrefix;
  return prefix ? `${prefix}-${name}` : name;
}

function inputName(field: RepeatableFieldConfig, index: number): string {
  return `${field.name}-${index}`;
}

function hintId(inputIdValue: string): string {
  return `${inputIdValue}-hint`;
}

function countRepeatableLists(lists: HTMLElement[]): Record<RepeatableType, number> {
  return lists.reduce(
    (counts, list) => {
      const type = getRepeatableType(list.dataset.professionalInformationList);
      if (type) {
        counts[type] += 1;
      }
      return counts;
    },
    {
      dxCode: 0,
      faxNumber: 0,
    }
  );
}

function getRepeatableType(value: string | undefined): RepeatableType | undefined {
  return value === 'dxCode' || value === 'faxNumber' ? value : undefined;
}
