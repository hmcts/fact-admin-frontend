import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { Lock, PATH_TO_PAGE_MAP } from '../schemas/lockSchema';
import { Subject } from '../schemas/subjectTypeSchema';

// page string -> path string
const PAGE_TO_PATH_MAP = Object.fromEntries(
  Object.entries(PATH_TO_PAGE_MAP).map(([path, page]) => [page, path])
) as Record<string, string>;

export type LocksViewModel = Partial<Lock> &
  {
    pagePath: string;
  }[];

export class LockService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async getLocks(subject: Subject, subjectId: string): Promise<LocksViewModel | HttpStatusCode> {
    const locks = await this.dataApiRequests.getLocks(subject, subjectId);
    if (typeof locks === 'number') {
      return locks;
    }

    const pageLocks: LocksViewModel = [];
    for (const lock of locks) {
      pageLocks.push({
        ...lock,
        pagePath: PAGE_TO_PATH_MAP[lock.page],
      });
    }

    return pageLocks;
  }
}
