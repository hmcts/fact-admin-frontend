const DEFAULT_REDIRECT_DELAY_MS = 3000;

export function initLoadingRedirects(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.querySelectorAll<HTMLElement>('[data-redirect-url]').forEach(element => {
    const redirectUrl = element.dataset.redirectUrl;
    if (!redirectUrl) {
      return;
    }

    const parsedDelay = Number(element.dataset.redirectDelay);
    const redirectDelay = Number.isFinite(parsedDelay) && parsedDelay >= 0 ? parsedDelay : DEFAULT_REDIRECT_DELAY_MS;

    window.setTimeout(() => {
      window.location.assign(redirectUrl);
    }, redirectDelay);
  });
}
