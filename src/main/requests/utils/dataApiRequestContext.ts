import { AsyncLocalStorage } from 'node:async_hooks';

type DataApiRequestContext = {
  userId?: string;
};

export const dataApiRequestContext = new AsyncLocalStorage<DataApiRequestContext>();

export function runWithDataApiUserId<T>(userId: string | undefined, callback: () => T): T {
  return dataApiRequestContext.run({ userId }, callback);
}
