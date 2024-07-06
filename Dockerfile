FROM node:22-slim

WORKDIR /home/node/app

USER node

CMD ["tail", "-f", "/dev/null"]