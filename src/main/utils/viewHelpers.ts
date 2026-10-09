import { SORT_ICON_PATHS } from './constants/messageConstants';

export type AriaSort = 'ascending' | 'descending' | 'none';

export function buildSortIconSvg(ariaSort: AriaSort): string {
  return [
    '<svg class="homepage-sort-icon" width="22" height="22" focusable="false" aria-hidden="true" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">',
    SORT_ICON_PATHS[ariaSort],
    '</svg>',
  ].join('');
}
