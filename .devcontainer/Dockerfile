# node:22.23.2-bookworm
FROM node@sha256:1b84b89ada025e3b14543cbb837ffaa1c1b5273b841c5b94dd1a8f9c1d8cf7fe

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    sudo \
    ca-certificates \
  && npx playwright install-deps \
  && rm -rf /var/lib/apt/lists/* \
  && echo "node ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/node \
  && chmod 0440 /etc/sudoers.d/node \
  && corepack enable \
  && npm install --global @github/copilot

USER node
