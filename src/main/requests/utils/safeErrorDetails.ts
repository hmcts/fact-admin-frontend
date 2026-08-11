import { AxiosError, isAxiosError } from 'axios';
import { ZodError } from 'zod';

const MAX_VALIDATION_ISSUES = 10;

interface SafeValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface SafeErrorDetails {
  name: string;
  message: string;
  code?: string;
  status?: number;
  method?: string;
  requestPath?: string;
  issueCount?: number;
  issues?: SafeValidationIssue[];
}

export function toSafeErrorDetails(error: unknown): SafeErrorDetails {
  if (isAxiosError(error)) {
    return toSafeAxiosError(error);
  }

  if (error instanceof ZodError) {
    return toSafeZodError(error);
  }

  // handle generic Error objects as well as any other unknown error types

  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'An error occurred',
    };
  }

  return {
    name: 'UnknownError',
    message: 'An unknown error was thrown',
  };
}

function toSafeAxiosError(error: AxiosError) {
  const details: SafeErrorDetails = {
    name: error.name || 'AxiosError',
    message: error.message || 'Data API request failed',
  };
  if (error.response?.status !== undefined) {
    details.status = error.response.status;
  }
  if (error.config?.method) {
    details.method = error.config.method.toUpperCase();
  }

  const requestPath = getSafeRequestPath(error.config?.url);
  if (requestPath) {
    details.requestPath = requestPath;
  }

  return details;
}

function toSafeZodError(error: ZodError) {
  return {
    name: error.name,
    message: 'Data API response failed schema validation',
    issueCount: error.issues.length,
    issues: error.issues.slice(0, MAX_VALIDATION_ISSUES).map(issue => ({
      code: issue.code,
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  };
}

function getSafeRequestPath(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url, 'https://data-api.local').pathname;
  } catch {
    return url.split(/[?#]/, 1)[0];
  }
}
