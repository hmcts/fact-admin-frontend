# Fact Admin Frontend

## Getting Started

### Prerequisites

Running the application requires the following tools to be installed in your environment:

- [Node.js](https://nodejs.org/) **22.x** (minimum `>=22.22.0`)
- [Yarn](https://yarnpkg.com/) **4.x**
- [Docker](https://www.docker.com) (used locally for Redis)

### Running the application

Install dependencies:

```bash
yarn install
```

Build the frontend:

```bash
yarn build
```

(Advanced) Run webpack directly if needed:

```bash
yarn webpack
```

Run in development mode:

```bash
yarn start:dev
```

The application home page will be available at https://localhost:3355/

### Environment variables (local)

Set the required environment variables before running the app locally.

> Note: local app startup (`yarn start:dev`) reads environment variables from your shell/run configuration. Ensure these values are exported in your terminal (or configured in your IDE run config) before starting the app.

#### Required for app startup

```bash
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_LOCAL=true
```

#### Required for login/auth & API flows

```bash
SSO_APP_REG_ID=...
SSO_APP_REG_SECRET=...
SSO_APP_REG_TENANT_ID=...
API_APP_REG_ID=...
FRONTEND_APP_REG_ID=...
FRONTEND_APP_REG_SECRET=...
AZURE_TENANT_ID=...
```

`DATA_API_URL` defaults to `http://localhost:8989` and `FRONTEND_URL` defaults to `https://localhost:3355`; set them only when using non-default endpoints.

SSO test account credentials are required for login-based functional tests and should be requested via your team’s secure secret-management process (for example, your team lead/line manager).

#### Optional for functional tests (Playwright)

```bash
TEST_URL=...
PLAYWRIGHT_REPORTERS=...
PLAYWRIGHT_VIDEO_MODE=...
PW_ODHIN_CONSOLE_LOG=...
```

### Running Redis locally with Docker

We use Redis to store session data to ensure sessions are shared across multiple frontend instances.

This is configured in the [app.ts](./src/main/app.ts) file.

Alongside this, the local unit/route tests use a mock Redis implementation to simulate the interactions.

Use the Redis environment variables listed in [Environment variables (local)](#environment-variables-local) before starting Redis locally.

`REDIS_PASSWORD` is only needed when connecting to an environment Redis instance that requires authentication.

This repository's `docker-compose.yml` starts only a Redis container for local development.

Start Redis:

```bash
docker compose up -d
```

Stop Redis:

```bash
docker compose down
```

Redis is exposed on `127.0.0.1:6379`.

To run the frontend application, use the normal app commands (for example `yarn start:dev`).

### Healthcheck

The frontend exposes a health endpoint at `https://localhost:3355/health`, implemented in [`HealthController.ts`](src/main/controllers/HealthController.ts) using the [Nodejs Healthcheck](https://github.com/hmcts/nodejs-healthcheck) library.

The `/info` endpoint also reports downstream Data API health. That check is performed by [`OperationsApi.ts`](src/main/requests/OperationsApi.ts) via `checkHealth()`, which calls the Data API `/health` endpoint.

### Maintenance mode

Set `MAINTENANCE_MODE=true` to show a service unavailable page to authenticated Admin and Viewer users. SuperAdmin
users retain access to the application. If the variable is missing or set to any value other than `true`, maintenance
mode is disabled.

## Development

### Code style

We use [ESLint](https://github.com/typescript-eslint/typescript-eslint)
alongside [Stylelint](https://stylelint.io/) and [Prettier](https://prettier.io/).

Run lint checks:

```bash
yarn lint
```

Run autofix:

```bash
yarn lint:fix
```

Run Prettier only (optional):

```bash
yarn prettier --write .
```

Check formatting only:

```bash
yarn prettier --check .
```

### Testing

#### Unit tests

This template app uses [Jest](https://jestjs.io//) as the test engine. You can run unit tests by executing
the following command:

```bash
yarn test:unit
```

#### Functional tests (Playwright)

Functional tests are end-to-end tests run with Playwright.

Run the main functional suite (excludes `@smoke` tests):

```bash
yarn test:functional
```

Run smoke tests only:

```bash
yarn test:smoke
```

Run performance-tagged tests:

```bash
yarn test:performance
```

Run functional tests excluding both smoke and performance tags:

```bash
yarn test:functional:no-performance
```

#### Route tests

Here's how to run route tests:

```bash
yarn test:routes
```

#### Accessibility tests

Accessibility checks run as part of the functional test suite:

```bash
yarn test:functional
```

Make sure all the paths in your application are covered by accessibility tests (see [accessibility.spec.ts](src/test/functional/tests/accessibility.spec.ts)).

## Security

### CSRF prevention

A CSRF form macro is available in [`src/main/views/macros/csrf.njk`](src/main/views/macros/csrf.njk).

Use it in Nunjucks forms that require CSRF protection:

```njk
{% from "macros/csrf.njk" import csrfProtection %}
<form ...>
  ...
  {{ csrfProtection(csrfToken) }}
  ...
</form>
```

### Helmet

This application uses [Helmet](https://helmetjs.github.io/) to set security-related HTTP headers.

In addition to default Helmet behavior, the app explicitly configures:

- `Content-Security-Policy`
- `Referrer-Policy`
- `Strict-Transport-Security` (HSTS)
- `Cross-Origin-Opener-Policy`
- `Permissions-Policy`

Security header behavior is configured in [`src/main/modules/helmet/index.ts`](src/main/modules/helmet/index.ts), with environment values read from app config.

Example config:

```json
{
  "security": {
    "referrerPolicy": "origin"
  }
}
```

Make sure you have those values set correctly for your application.

## Contributing

Contributions are welcome. Please keep changes focused, update tests/docs where needed, and open a PR with a clear description of what changed and why.

### Pre-PR checklist

- Install dependencies: `yarn install`
- Build passes: `yarn build`
- Lint passes: `yarn lint`
- Unit tests pass: `yarn test:unit`
- Route tests pass: `yarn test:routes`
- Functional/a11y checks as needed: `yarn test:functional`
- Manual testing: verify core user flows locally

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
