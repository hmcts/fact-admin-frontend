# ---- Base image ----
FROM hmctsprod.azurecr.io/base/node:22-alpine@sha256:fec7a28bb5228829fd60f8623557cacbe3a1f843f421b95e16ec075e70bf6d49 as base
USER root
RUN corepack enable
WORKDIR /opt/app
RUN chown -R 65532:65532 /opt/app
COPY --chown=65532:65532 . .
ENV HOME=/tmp
ENV COREPACK_HOME=/tmp/.corepack
USER 65532:65532

# ---- Build image ----
FROM base as build
RUN yarn install && yarn build:prod

# ---- Runtime image ----
FROM build as runtime
RUN rm -rf webpack/ webpack.config.js
EXPOSE 3355
