import { NextFunction, Request, RequestHandler, Response } from 'express';
import multer, { MulterError } from 'multer';

import { dataApiRequestContext } from '../../requests/utils/dataApiRequestContext';

type UploadErrorCode = 'fileTooLarge' | 'invalidType' | 'missingFile' | 'unknownUploadError';

export type UploadErrorInfo = {
  code: UploadErrorCode;
  message: string;
};

export function photoUploadMiddleware(fieldName: string, fileSizeMB: number = 2): RequestHandler {
  const uploader = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: fileSizeMB * 1024 * 1024, files: 1 },
  });
  const single = uploader.single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    const requestContext = dataApiRequestContext.getStore();

    single(req, res, err => {
      if (err) {
        req.uploadError = mapUploadError(err, fileSizeMB);
      }

      if (requestContext) {
        return dataApiRequestContext.run(requestContext, next);
      }

      return next();
    });
  };
}

function mapUploadError(err: unknown, fileSizeMB: number): UploadErrorInfo {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return { code: 'fileTooLarge', message: `The selected file must be smaller than ${fileSizeMB}MB` };
    }

    return { code: 'unknownUploadError', message: 'There was a problem uploading the file' };
  }

  return { code: 'unknownUploadError', message: 'There was a problem uploading the file' };
}
