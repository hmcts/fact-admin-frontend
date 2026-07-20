# ---- Base image ----
FROM hmctsprod.azurecr.io/base/node:22-alpine as base
COPY --chown=65532:65532 . .
USER root
RUN corepack enable
WORKDIR /opt/app
USER 65532:65532

# ---- Build image ----
FROM base as build
RUN yarn install && yarn build:prod

# ---- Runtime image ----
FROM build as runtime
RUN rm -rf webpack/ webpack.config.js
EXPOSE 3355
