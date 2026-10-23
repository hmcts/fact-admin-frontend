# ---- Base image ----
FROM hmctsprod.azurecr.io/base/node:24-alpine@sha256:5b91108b2d5ce1b0acdb1e352c0fb3a8150ff24ba7923191cc39a4e3293c3bd4 AS base
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
