declare module 'pa11y' {
  interface LaunchConfig {
    args?: string[];
    executablePath?: string;
    ignoreHTTPSErrors?: boolean;
  }

  interface ResultIssue {
    code: string;
    context: string;
    message: string;
    selector: string;
    type: string;
    typeCode: number;
  }

  interface Results {
    documentTitle: string;
    pageUrl: string;
    issues: ResultIssue[];
  }

  interface Options {
    chromeLaunchConfig?: LaunchConfig;
    hideElements?: string;
    timeout?: number;
  }

  function pa11y(url: string, options?: Options): Promise<Results>;

  namespace pa11y {
    function isValidAction(action: string): boolean;
  }

  export = pa11y;
}
