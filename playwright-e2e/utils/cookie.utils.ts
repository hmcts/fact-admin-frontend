export class CookieUtils {
  // public async addAnalyticsCookie(user: UserCredentials): Promise<void> {
  //   /*
  //   note: cookie names and values can be different between services to check for your service you can accept the
  //   analytics cookies manually and then check the added cookie under Application -> Cookies in developer tools
  //    */
  //   if (user === config.users.citizen) {
  //     await this.addCitizenAnalyticsCookie(user.sessionFile);
  //   } else {
  //     await this.addManageCasesAnalyticsCookie(user.sessionFile);
  //   }
  // }

  private resolveHostname(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      try {
        return new URL(`https://${url}`).hostname;
      } catch (fallbackError) {
        throw new Error(
          `Failed to resolve hostname from URL "${url}": ${
            fallbackError instanceof Error ? fallbackError.message : fallbackError
          }`
        );
      }
    }
  }
}
