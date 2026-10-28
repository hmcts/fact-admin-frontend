# ---- Base image ----
FROM hmctsprod.azurecr.io/base/node:24-alpine AS base
USER root
RUN corepack enable
WORKDIR /opt/app
RUN chown -R 65532:65532 /opt/app
COPY --chown=65532:65532 . .
ENV HOME=/tmp
ENV COREPACK_HOME=/tmp/.corepack
USER 65532:65532

# ---- Build image ----
FROM base AS build
RUN yarn install && yarn build:prod

# ---- Runtime image ----
FROM build AS runtime
RUN rm -rf webpack/ webpack.config.js
EXPOSE 3355
