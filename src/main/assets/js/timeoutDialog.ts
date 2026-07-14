type TimeoutDialogConfig = {
  timeout: number;
  countdown: number;
  keepAliveUrl: string;
  signOutUrl: string;
  timeoutUrl: string;
  title?: string;
  message: string;
  messageSuffix?: string;
  keepAliveButtonText: string;
  signOutButtonText: string;
  synchroniseTabs: boolean;
  hideSignOutButton: boolean;
  properties: {
    minutes: string;
    minute: string;
    seconds: string;
    second: string;
  };
};

type SessionActivityEvent = { timestamp: number };

type DialogControl = {
  addCloseHandler: (handler: () => void) => void;
  closeDialog: () => void;
  setAriaLabelledBy: (value?: string) => void;
};

const META_SELECTOR = 'meta[name="hmrc-timeout-dialog"]';
const ESCAPE_KEY = 'Escape';

const englishDefaults = {
  title: "You're about to be signed out",
  message: 'For your security, we will sign you out in',
  keepAliveButtonText: 'Stay signed in',
  signOutButtonText: 'Sign out',
  properties: {
    minutes: 'minutes',
    minute: 'minute',
    seconds: 'seconds',
    second: 'second',
  },
};

const welshDefaults = {
  title: 'Rydych ar fin cael eich allgofnodi',
  message: 'Er eich diogelwch, byddwn yn eich allgofnodi cyn pen',
  keepAliveButtonText: "Parhau i fod wedi'ch mewngofnodi",
  signOutButtonText: 'Allgofnodi',
  properties: {
    minutes: 'funud',
    minute: 'funud',
    seconds: 'eiliad',
    second: 'eiliad',
  },
};

export function initTimeoutDialog(): void {
  if (typeof document === 'undefined' || !globalThis.window) {
    return;
  }

  const meta = document.querySelector<HTMLMetaElement>(META_SELECTOR);
  if (!meta || meta.dataset.timeoutDialogInitialised === 'true') {
    return;
  }

  const settings = buildSettings(meta);
  if (!settings) {
    return;
  }

  meta.dataset.timeoutDialogInitialised = 'true';

  const cleanupFunctions: (() => void)[] = [];
  let currentTimer: ReturnType<typeof setTimeout> | undefined;

  const sessionChannel =
    settings.synchroniseTabs && globalThis.BroadcastChannel !== undefined
      ? new globalThis.BroadcastChannel('session-activity')
      : undefined;

  const getDateNow = (): number => Date.now();

  const cleanup = (): void => {
    while (cleanupFunctions.length > 0) {
      cleanupFunctions.shift()?.();
    }
  };

  const setupDialogTimer = (timeOfLastActivity = getDateNow()): void => {
    const signoutTime = timeOfLastActivity + settings.timeout * 1000;
    const delta = getDateNow() - timeOfLastActivity;
    const secondsUntilTimeoutDialog = settings.timeout - settings.countdown;

    const timeoutId = globalThis.setTimeout(
      () => {
        setupDialog(signoutTime);
      },
      Math.max(secondsUntilTimeoutDialog * 1000 - delta, 0)
    );

    cleanupFunctions.push(() => {
      globalThis.clearTimeout(timeoutId);
      if (currentTimer !== undefined) {
        globalThis.clearTimeout(currentTimer);
        currentTimer = undefined;
      }
    });
  };

  const broadcastSessionActivity = (): void => {
    sessionChannel?.postMessage({ timestamp: getDateNow() } satisfies SessionActivityEvent);
  };

  const keepAliveAndClose = (): void => {
    cleanup();
    setupDialogTimer();
    ajaxGet(settings.keepAliveUrl);
    broadcastSessionActivity();
  };

  const signOut = (): void => {
    globalThis.location.assign(settings.signOutUrl);
  };

  const timeout = (): void => {
    globalThis.location.assign(settings.timeoutUrl);
  };

  const setupDialog = (signoutTime: number): void => {
    const contentElement = document.createElement('div');

    if (settings.title) {
      const title = createElementWithText(
        '<h1 id="hmrc-timeout-heading" class="govuk-heading-m push--top">',
        settings.title
      );
      contentElement.appendChild(title);
    }

    const countdownElement = createElement('<span id="hmrc-timeout-countdown" class="hmrc-timeout-dialog__countdown">');
    const audibleMessage = createElement(
      '<p id="hmrc-timeout-message" class="govuk-visually-hidden screenreader-content" aria-live="assertive">'
    );
    const visualMessage = createElementWithText(
      '<p class="govuk-body hmrc-timeout-dialog__message" aria-hidden="true">',
      settings.message
    );

    visualMessage.appendChild(document.createTextNode(' '));
    visualMessage.appendChild(countdownElement);
    if (settings.messageSuffix) {
      visualMessage.appendChild(document.createTextNode(` ${settings.messageSuffix}`));
    }

    const staySignedInButton = createElementWithText(
      '<button id="hmrc-timeout-keep-signin-btn" class="govuk-button">',
      settings.keepAliveButtonText
    );

    const buttonGroup = document.createElement('div');
    buttonGroup.classList.add('govuk-button-group');
    buttonGroup.appendChild(staySignedInButton);

    contentElement.appendChild(visualMessage);
    contentElement.appendChild(audibleMessage);
    staySignedInButton.addEventListener('click', keepAliveAndClose);

    if (!settings.hideSignOutButton) {
      const signOutButton = createElementWithText(
        '<a id="hmrc-timeout-sign-out-link" class="govuk-link hmrc-timeout-dialog__link">',
        settings.signOutButtonText
      );
      signOutButton.setAttribute('href', settings.signOutUrl);
      signOutButton.addEventListener('click', signOut);
      buttonGroup.appendChild(signOutButton);
    }

    contentElement.appendChild(buttonGroup);

    const dialogControl = displayDialog(contentElement);
    cleanupFunctions.push(() => {
      dialogControl.closeDialog();
    });

    dialogControl.addCloseHandler(keepAliveAndClose);
    dialogControl.setAriaLabelledBy('hmrc-timeout-heading hmrc-timeout-message');

    const getMillisecondsRemaining = (): number => signoutTime - getDateNow();
    const getSecondsRemaining = (): number => Math.round(getMillisecondsRemaining() / 1000);

    const getHumanText = (counter: number): string => {
      if (counter < 60) {
        return `${counter} ${settings.properties[counter === 1 ? 'second' : 'seconds']}.`;
      }

      const minutes = Math.ceil(counter / 60);
      return `${minutes} ${settings.properties[minutes === 1 ? 'minute' : 'minutes']}.`;
    };

    const roundSecondsUp = (counter: number): number => {
      if (counter > 60) {
        return counter;
      }
      if (counter < 20) {
        return 20;
      }
      return Math.ceil(counter / 20) * 20;
    };

    const getAudibleHumanText = (counter: number): string => {
      const humanText = getHumanText(roundSecondsUp(counter));
      const messageParts = [settings.message, ' ', humanText];
      if (settings.messageSuffix) {
        messageParts.push(' ', settings.messageSuffix);
      }
      return messageParts.join('');
    };

    const updateTextIfChanged = (element: HTMLElement, text: string): void => {
      if (element.innerText !== text) {
        element.innerText = text;
      }
    };

    const updateCountdown = (counter: number): void => {
      updateTextIfChanged(countdownElement, getHumanText(counter));
      updateTextIfChanged(audibleMessage, getAudibleHumanText(counter));
    };

    const getNextTimeout = (): number => {
      const remaining = getMillisecondsRemaining();
      const roundedRemaining = Math.floor(remaining / 1000) * 1000;
      if (roundedRemaining <= 60000) {
        return remaining - roundedRemaining || 1000;
      }
      return remaining - (roundedRemaining - (roundedRemaining % 60000 || 60000));
    };

    const runUpdate = (): void => {
      const counter = Math.max(getSecondsRemaining(), 0);
      updateCountdown(counter);
      if (counter === 0) {
        timeout();
        return;
      }

      currentTimer = globalThis.setTimeout(runUpdate, getNextTimeout());
    };

    runUpdate();
  };

  if (sessionChannel) {
    sessionChannel.onmessage = (event: MessageEvent<SessionActivityEvent>): void => {
      cleanup();
      setupDialogTimer(event.data.timestamp);
    };
  }

  setupDialogTimer();
}

function buildSettings(meta: HTMLMetaElement): TimeoutDialogConfig | undefined {
  const timeout = toInt(meta.dataset.timeout);
  const countdown = toInt(meta.dataset.countdown);
  const keepAliveUrl = toStringValue(meta.dataset.keepAliveUrl);
  const signOutUrl = toStringValue(meta.dataset.signOutUrl);

  if (!timeout || !countdown || !keepAliveUrl || !signOutUrl) {
    return undefined;
  }

  const isWelsh = toStringValue(meta.dataset.language) === 'cy';
  const localisedDefaults = isWelsh ? welshDefaults : englishDefaults;

  const timeoutUrl = toStringValue(meta.dataset.timeoutUrl) || signOutUrl;

  return {
    timeout,
    countdown,
    keepAliveUrl,
    signOutUrl,
    timeoutUrl,
    title: toStringValue(meta.dataset.title) || localisedDefaults.title,
    message: toStringValue(meta.dataset.message) || localisedDefaults.message,
    messageSuffix: toStringValue(meta.dataset.messageSuffix),
    keepAliveButtonText: toStringValue(meta.dataset.keepAliveButtonText) || localisedDefaults.keepAliveButtonText,
    signOutButtonText: toStringValue(meta.dataset.signOutButtonText) || localisedDefaults.signOutButtonText,
    synchroniseTabs: toBoolean(meta.dataset.synchroniseTabs),
    hideSignOutButton: toBoolean(meta.dataset.hideSignOutButton),
    properties: localisedDefaults.properties,
  };
}

function createElement(markup: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = markup;
  return wrapper.firstElementChild as HTMLElement;
}

function createElementWithText(markup: string, text: string): HTMLElement {
  const element = createElement(markup);
  element.innerText = text;
  return element;
}

function displayDialog(elementToDisplay: HTMLElement): DialogControl {
  const dialog = createElement(
    '<div id="hmrc-timeout-dialog" tabindex="-1" role="dialog" aria-modal="true" class="hmrc-timeout-dialog">'
  );
  const overlay = createElement('<div id="hmrc-timeout-overlay" class="hmrc-timeout-overlay">');
  const resetFunctions: (() => void)[] = [];
  const closeHandlers: (() => void)[] = [];
  let isClosed = false;

  dialog.appendChild(elementToDisplay);

  if (!document.documentElement.classList.contains('noScroll')) {
    document.documentElement.classList.add('noScroll');
    resetFunctions.push(() => {
      document.documentElement.classList.remove('noScroll');
    });
  }

  document.body.appendChild(dialog);
  document.body.appendChild(overlay);

  resetFunctions.push(() => {
    removeElement(dialog);
    removeElement(overlay);
  });

  const activeElementAtOpen = document.activeElement as HTMLElement | null;

  const keepFocus = (event: FocusEvent): void => {
    if (event.target !== dialog && !dialog.contains(event.target as Node)) {
      event.stopPropagation();
      dialog.focus();
    }
  };

  dialog.focus();
  document.addEventListener('focus', keepFocus, true);
  resetFunctions.push(() => {
    document.removeEventListener('focus', keepFocus, true);
    activeElementAtOpen?.focus();
  });

  const nonDialogSelectors = [
    '#skiplink-container',
    'body > header',
    '#global-cookie-message',
    'main',
    'body > footer',
    'body > .govuk-skip-link',
    '.cbanner-govuk-cookie-banner',
    'body > .govuk-width-container',
  ];

  document.querySelectorAll<HTMLElement>(nonDialogSelectors.join(', ')).forEach(nonDialogElement => {
    const priorValue = nonDialogElement.getAttribute('aria-hidden');
    nonDialogElement.setAttribute('aria-hidden', 'true');
    resetFunctions.push(() => {
      if (priorValue) {
        nonDialogElement.setAttribute('aria-hidden', priorValue);
      } else {
        nonDialogElement.removeAttribute('aria-hidden');
      }
    });
  });

  const touchMoveHandler = (event: TouchEvent): void => {
    const touches = event.touches.length > 0 ? event.touches : event.changedTouches;
    if (touches.length === 1) {
      event.preventDefault();
    }
  };

  document.addEventListener('touchmove', touchMoveHandler, true);
  resetFunctions.push(() => {
    document.removeEventListener('touchmove', touchMoveHandler, true);
  });

  const close = (): void => {
    if (isClosed) {
      return;
    }
    isClosed = true;

    while (resetFunctions.length > 0) {
      resetFunctions.shift()?.();
    }
  };

  const closeAndInform = (): void => {
    if (isClosed) {
      return;
    }

    closeHandlers.forEach(handler => {
      handler();
    });
    close();
  };

  const keydownListener = (event: KeyboardEvent): void => {
    if (event.key === ESCAPE_KEY) {
      closeAndInform();
    }
  };

  document.addEventListener('keydown', keydownListener);
  resetFunctions.push(() => {
    document.removeEventListener('keydown', keydownListener);
  });

  return {
    closeDialog(): void {
      close();
    },
    setAriaLabelledBy(value?: string): void {
      if (value) {
        dialog.setAttribute('aria-labelledby', value);
      } else {
        dialog.removeAttribute('aria-labelledby');
      }
    },
    addCloseHandler(handler: () => void): void {
      closeHandlers.push(handler);
    },
  };
}

function toInt(value: string | undefined | null): number | undefined {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toStringValue(value: string | undefined | null): string | undefined {
  if (value === '') {
    return undefined;
  }
  return typeof value === 'string' ? value : undefined;
}

function toBoolean(value: string | undefined | null): boolean {
  return String(value).toLowerCase() === 'true';
}

function removeElement(element: HTMLElement): void {
  element.remove();
}

function ajaxGet(url: string): void {
  const request = new XMLHttpRequest();
  request.open('GET', url);
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  request.send();
}
