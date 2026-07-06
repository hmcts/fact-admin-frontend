import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtLock, PATH_TO_PAGE_MAP } from '../schemas/courtLockSchema';

// page string -> path string
const PAGE_TO_PATH_MAP = Object.fromEntries(
  Object.entries(PATH_TO_PAGE_MAP).map(([path, page]) => [page, path])
) as Record<string, string>;

export type CourtLocksViewModel = Partial<CourtLock> &
  {
    pagePath: string;
  }[];

export class CourtLockService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async getCourtLocks(courtId: string): Promise<CourtLocksViewModel | HttpStatusCode> {
    const courtLocks = await this.dataApiRequests.getCourtLocks(courtId);
    if (typeof courtLocks === 'number') {
      return courtLocks;
    }

    const pageLocks: CourtLocksViewModel = [];
    for (const lock of courtLocks) {
      pageLocks.push({
        ...lock,
        pagePath: PAGE_TO_PATH_MAP[lock.page],
      });
    }

    return pageLocks;
  }
}
