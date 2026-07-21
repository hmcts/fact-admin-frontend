import { NextFunction, Request, RequestHandler, Response } from 'express';
import multer, { MulterError } from 'multer';

type UploadErrorCode = 'fileTooLarge' | 'invalidType' | 'missingFile' | 'unknownUploadError';

export type UploadErrorInfo = {
  code: UploadErrorCode;
  message: string;
};

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

export function photoUploadMiddleware(fieldName: string): RequestHandler {
  const single = uploader.single(fieldName);

  return (req: Request, _res: Response, next: NextFunction) => {
    single(req, _res, err => {
      if (!err) {
        return next();
      }

      // Convert Multer/unknown errors into a safe request-scoped object
      req.uploadError = mapUploadError(err);
      return next();
    });
  };
}

function mapUploadError(err: unknown): UploadErrorInfo {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return { code: 'fileTooLarge', message: 'The selected file must be smaller than 20MB' };
    }

    return { code: 'unknownUploadError', message: 'There was a problem uploading the file' };
  }

  return { code: 'unknownUploadError', message: 'There was a problem uploading the file' };
}
