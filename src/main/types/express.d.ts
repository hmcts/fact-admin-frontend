import { UploadErrorInfo } from '../controllers/helpers/multerUpload';

declare global {
  namespace Express {
    interface Request {
      uploadError?: UploadErrorInfo;
    }
  }
}

export {};
