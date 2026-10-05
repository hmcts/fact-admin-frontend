# node:22.23.2-bookworm
FROM node@sha256:dd5847a04b0deee391fa145f1f4c6d214196668b6bcc7988ebed67249f226844

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
