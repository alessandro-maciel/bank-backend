FROM node:20-slim
#debian
RUN apt-get update -y && apt-get install -y \
    procps \
    git

RUN npm install -g @nestjs/cli@10.0.0

WORKDIR /home/node/app

USER node

# ler o dispositivo nulo do linux
CMD [ "tail", "-f", "/dev/null" ]
