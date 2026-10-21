# ---- Base image ----
FROM hmctsprod.azurecr.io/base/node:24-alpine@sha256:a727a2b7d510a6ac7dae811b2e235c54d3485080e61cf77c2a92927a1c0b4a9b AS base
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
