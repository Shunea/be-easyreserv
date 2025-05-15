ARG RUN_IMG=node:18.16.0-alpine
ARG BUILD_IMG=node:18.16.0-alpine

###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM $BUILD_IMG As development

# Install build dependencies for node-gyp, libusb, and udev
RUN apk add --no-cache python3 make g++ linux-headers libusb-dev eudev-dev

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

# RUN npm install -g npm@9.8.1
RUN npm install --legacy-peer-deps

COPY --chown=node:node . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM $BUILD_IMG As build

# Install build dependencies for node-gyp, libusb, and udev
RUN apk add --no-cache python3 make g++ linux-headers libusb-dev eudev-dev

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN npm run build

ENV NODE_ENV production

RUN npm install --legacy-peer-deps --only=production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM $RUN_IMG As production

# Install runtime dependencies for udev
RUN apk add --no-cache tzdata eudev-dev

# Ensure libudev.so.1 is available
RUN ln -s /usr/lib/libudev.so /usr/lib/libudev.so.1 || true

ENV TZ=Europe/Chisinau

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD [ "node", "./dist/src/main.js" ]
