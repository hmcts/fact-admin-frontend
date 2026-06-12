type RepeatableConfig = {
  heading: string;
  firstLabel: string;
  firstName: string;
  firstHint?: string;
  secondLabel: string;
  secondName: string;
  secondHint?: string;
  removeText: string;
};

const repeatableConfigs: Record<string, RepeatableConfig> = {
  dxCode: {
    heading: 'DX code',
    firstLabel: 'DX code',
    firstName: 'dxCode',
    firstHint: 'Please enter the DX code you wish to display.',
    secondLabel: 'Explanation',
    secondName: 'dxCodeDescription',
    secondHint: 'Enter the explanation text for this DX code.',
    removeText: 'Remove DX code',
  },
  faxNumber: {
    heading: 'Fax number',
    firstLabel: 'Fax number',
    firstName: 'faxNumber',
    secondLabel: 'Description',
    secondName: 'faxNumberDescription',
    removeText: 'Remove Fax number',
  },
};

export function initProfessionalInformationRepeatableFields(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-professional-information-add]').forEach(button => {
    button.addEventListener('click', () => addRepeatableItem(button));
    updateRepeatableControls(button);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-professional-information-remove]').forEach(button => {
    button.addEventListener('click', () => removeRepeatableItem(button));
  });
}

function addRepeatableItem(button: HTMLButtonElement): void {
  const type = button.dataset.professionalInformationAdd;
  if (!type) {
    return;
  }

  const list = document.querySelector<HTMLElement>(`[data-professional-information-list="${type}"]`);
  const config = repeatableConfigs[type];
  if (!list || !config) {
    return;
  }

  const maxItems = Number(list.dataset.professionalInformationMax || '5');
  const itemCount = list.querySelectorAll('[data-professional-information-item]').length;
  if (itemCount >= maxItems) {
    return;
  }

  const item = buildRepeatableItem(type, config, itemCount);
  list.append(item);
  item.querySelector<HTMLButtonElement>('[data-professional-information-remove]')?.addEventListener('click', event => {
    removeRepeatableItem(event.currentTarget as HTMLButtonElement);
  });

  updateRepeatableControls(button);
  item.querySelector<HTMLInputElement>('input')?.focus();
}

function removeRepeatableItem(button: HTMLButtonElement): void {
  const item = button.closest('[data-professional-information-item]');
  const list = button.closest<HTMLElement>('[data-professional-information-list]');
  if (!item || !list) {
    return;
  }

  item.remove();
  const type = list.dataset.professionalInformationList;
  if (type) {
    reindexRepeatableItems(list, type);
  }
  const addButton = document.querySelector<HTMLButtonElement>(`[data-professional-information-add="${type}"]`);
  if (addButton) {
    updateRepeatableControls(addButton);
  }
}

function buildRepeatableItem(type: string, config: RepeatableConfig, index: number): HTMLElement {
  const item = document.createElement('div');
  item.className = 'professional-information-repeatable';
  item.dataset.professionalInformationItem = '';
  item.append(buildHeading(config.heading, index));
  item.append(
    buildInput(config.firstName, index, config.firstLabel, config.firstHint),
    buildInput(config.secondName, index, config.secondLabel, config.secondHint),
    buildRemoveButton(config.removeText, index)
  );
  item.dataset.professionalInformationType = type;
  return item;
}

function buildHeading(text: string, index: number): HTMLParagraphElement {
  const heading = document.createElement('p');
  heading.className = 'govuk-body govuk-!-margin-bottom-1';
  heading.dataset.professionalInformationHeading = '';
  heading.textContent = `${text} ${index + 1}`;
  return heading;
}

function buildInput(namePrefix: string, index: number, labelText: string, hintText?: string): HTMLElement {
  const formGroup = document.createElement('div');
  formGroup.className = 'govuk-form-group';

  const id = `${namePrefix}-${index}`;
  const label = document.createElement('label');
  label.className = 'govuk-label govuk-!-margin-bottom-1';
  label.htmlFor = id;
  label.textContent = labelText;
  formGroup.append(label);

  if (hintText) {
    const hint = document.createElement('div');
    hint.className = 'govuk-hint';
    hint.id = `${id}-hint`;
    hint.textContent = hintText;
    formGroup.append(hint);
  }

  const input = document.createElement('input');
  input.className = 'govuk-input govuk-input--width-20';
  input.id = id;
  input.name = id;
  input.type = 'text';
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

function reindexRepeatableItems(list: HTMLElement, type: string): void {
  const config = repeatableConfigs[type];
  if (!config) {
    return;
  }

  list.querySelectorAll<HTMLElement>('[data-professional-information-item]').forEach((item, index) => {
    const heading = item.querySelector('[data-professional-information-heading]');
    if (heading) {
      heading.textContent = `${config.heading} ${index + 1}`;
    }
    updateInput(item, config.firstName, index);
    updateInput(item, config.secondName, index);

    const removeButton = item.querySelector<HTMLButtonElement>('[data-professional-information-remove]');
    if (removeButton) {
      removeButton.textContent = `${config.removeText} ${index + 1}`;
      removeButton.hidden = index === 0;
    }
  });
}

function updateInput(item: HTMLElement, namePrefix: string, index: number): void {
  const input = item.querySelector<HTMLInputElement>(`input[name^="${namePrefix}-"]`);
  if (!input) {
    return;
  }

  const id = `${namePrefix}-${index}`;
  input.id = id;
  input.name = id;
  item.querySelector<HTMLLabelElement>(`label[for^="${namePrefix}-"]`)?.setAttribute('for', id);
}

function updateRepeatableControls(button: HTMLButtonElement): void {
  const type = button.dataset.professionalInformationAdd;
  const list = document.querySelector<HTMLElement>(`[data-professional-information-list="${type}"]`);
  if (!list) {
    return;
  }

  const maxItems = Number(list.dataset.professionalInformationMax || '5');
  const items = list.querySelectorAll<HTMLElement>('[data-professional-information-item]');
  const atMax = items.length >= maxItems;
  button.hidden = atMax;
  button.classList.toggle('govuk-!-display-none', atMax);
  if (atMax) {
    button.setAttribute('aria-hidden', 'true');
  } else {
    button.removeAttribute('aria-hidden');
  }

  items.forEach((item, index) => {
    const removeButton = item.querySelector<HTMLButtonElement>('[data-professional-information-remove]');
    if (removeButton) {
      removeButton.hidden = index === 0;
    }
  });
}
