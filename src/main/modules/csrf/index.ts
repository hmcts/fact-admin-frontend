import { csrfSync } from 'csrf-sync';
import { Application, NextFunction, Request, Response } from 'express';

type RequestWithAppSession = Request & {
  appSession?: {
    csrfToken?: string;
  };
};

export class CsrfProtection {
  private readonly csrf = csrfSync({
    getTokenFromRequest: req => {
      const token = req.body?._csrf;
      return typeof token === 'string' ? token : undefined;
    },
    getTokenFromState: req => (req as RequestWithAppSession).appSession?.csrfToken,
    storeTokenInState: (req, token) => {
      const session = (req as RequestWithAppSession).appSession;

      if (!session) {
        throw new Error('Cannot store CSRF token without an application session');
      }

      session.csrfToken = token ?? undefined;
    },
  });

  public enableFor(app: Application): void {
    app.use(
      '/add-service-centre',
      this.csrf.csrfSynchronisedProtection,
      (req: Request, res: Response, next: NextFunction) => {
        res.locals.csrfToken = this.csrf.generateToken(req);
        next();
      }
    );
  }
}
