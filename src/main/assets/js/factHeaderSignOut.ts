/**
 * Inserts a "Sign out" link into the header, if it has been tagged with the 'fact-header' attribute.
 * The link is inserted after the first anchor in the fact header.
 * If the fact header does not exist, or if it has no anchors, this function does nothing.
 */
const SIGN_OUT_HTML = '<a class="sign-out-link" href="/sso/logout"><strong>Sign out</strong></a>';

export function initFactHeaderSignOutLink(): void {
  const factHeader = document.querySelector('[fact-header]');
  if (!factHeader) {
    return;
  }

  const firstAnchor = factHeader.querySelector('a');
  if (!firstAnchor) {
    return;
  }

  // Prevent duplicate insertion if init runs more than once.
  if (factHeader.querySelector('a.sign-out-link[href="/sso/logout"]')) {
    return;
  }

  firstAnchor.insertAdjacentHTML('afterend', SIGN_OUT_HTML);
}
