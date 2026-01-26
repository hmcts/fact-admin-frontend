import { randomBytes } from 'crypto';

import * as express from 'express';
import helmet from 'helmet';

const googleAnalyticsDomain = ['*.googletagmanager.com', 'https://tagmanager.google.com', '*.google-analytics.com'];
const gov_uk_script_1 = "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='";
const self = "'self'";
const blockedFeatures = ['camera', 'geolocation', 'microphone', 'interest-cohort'];

export interface HelmetConfig {
  referrerPolicy?: ReferrerPolicy;
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
}

/**
 * Module that enables helmet in the application
 */
export class Helmet {
  constructor(
    private readonly config: HelmetConfig,
    private readonly developmentMode: boolean
  ) {}

  public enableFor(app: express.Express): void {
    this.installNonceGenerator(app);
    this.setContentSecurityPolicy(app);
    this.setCrossOriginPolicy(app);
    this.setHSTSPolicy(app);
    this.setReferrerPolicy(app);
    this.setPermissionsPolicy(app);
  }

  private setContentSecurityPolicy(app: express.Express) {
    const formAction = [self, '*.hmcts.net', '*.gov.uk'];
    const scriptSrc = [self, ...googleAnalyticsDomain, gov_uk_script_1, (req, res) => `'nonce-${res.locals.cspNonce}'`];

    if (this.developmentMode) {
      formAction.push('http://localhost:*', 'https://localhost:*');

      // Uncaught EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval'
      // is not an allowed source of script in the following Content Security Policy directive.
      scriptSrc.push("'unsafe-eval'");
    }

    app.use(
      helmet({
        contentSecurityPolicy: {
          useDefaults: false,
          directives: {
            baseUri: ["'none'"],
            frameAncestors: ["'none'"],
            formAction,
            connectSrc: [self],
            defaultSrc: ["'none'"],
            manifestSrc: [self],
            fontSrc: [self, 'data:'],
            imgSrc: [self, ...googleAnalyticsDomain],
            objectSrc: ["'none'"],
            scriptSrc,
            styleSrc: [self],
          },
        },
      })
    );
  }

  private setCrossOriginPolicy(app: express.Express): void {
    app.use(
      helmet.crossOriginOpenerPolicy({
        policy: 'same-origin',
      })
    );
  }

  private setHSTSPolicy(app: express.Express): void {
    app.use(
      helmet.hsts({
        maxAge: this.config.hsts?.maxAge ?? 31536000, // 1 year in seconds
        includeSubDomains: this.config.hsts?.includeSubDomains ?? true,
        preload: this.config.hsts?.preload ?? true,
      })
    );
  }

  private installNonceGenerator(app: express.Express) {
    // setup a nonce for script execution
    app.use((req, res, next) => {
      res.locals.cspNonce = randomBytes(16).toString('base64');
      next();
    });
  }

  private setReferrerPolicy(app: express.Express) {
    app.use(
      helmet.referrerPolicy({
        policy: this.config.referrerPolicy ?? 'same-origin',
      })
    );
  }

  private setPermissionsPolicy(app: express.Express): void {
    app.use((_req, res, next) => {
      res.setHeader('Permissions-Policy', blockedFeatures.map(f => f + '=()').join(', '));
      next();
    });
  }
}
