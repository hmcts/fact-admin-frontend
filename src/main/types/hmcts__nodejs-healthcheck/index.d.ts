declare module '@hmcts/nodejs-healthcheck' {
  import { Application } from 'express';

  export function addTo(app: Application, config: unknown): void;
  export function configure(...args: unknown[]): unknown;

  export function up(): unknown;
  export function down(): unknown;
  export function status(): unknown;

  export const web: unknown;
  export function raw(check: () => unknown): unknown;
}
