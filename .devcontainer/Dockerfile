# node:24.22.0-bookworm
FROM node@sha256:6d2c7d5d074bf72f81ddc252b4fbb5d625bc028eeda49cb4b8c2ff8eda1ee617

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
