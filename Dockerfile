# A temporary image that installs dependencies and
# builds the production-ready front-end bundles.

FROM node:14.21.2-alpine as bundles
WORKDIR /usr/src/smee.io
COPY package*.json ./
COPY webpack.config.js ./
COPY .babelrc ./
COPY src ./src
RUN ls

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    curl \
    gcc \
    musl-dev \
    openssl-dev \
    zlib-dev

# Download and install Python 2.7
RUN curl -O https://www.python.org/ftp/python/2.7.18/Python-2.7.18.tgz && \
    tar -xzf Python-2.7.18.tgz && \
    cd Python-2.7.18 && \
    ./configure --enable-optimizations && \
    make altinstall && \
    ln -s /usr/local/bin/python2.7 /usr/bin/python2
# Install the project's dependencies and build the bundles
RUN npm ci && npm run build && env NODE_ENV=production npm prune

# --------------------------------------------------------------------------------

FROM node:14.21.2-alpine
LABEL description="Smee.io"

# Let's make our home
WORKDIR /usr/src/smee.io

# RUN apk add --no-cache coreutils

RUN chown node:node /usr/src/smee.io -R

# This should be our normal running user
USER node

# Copy our dependencies
COPY --chown=node:node --from=bundles /usr/src/smee.io/node_modules /usr/src/smee.io/node_modules

# Copy our front-end code
COPY --chown=node:node --from=bundles /usr/src/smee.io/public /usr/src/smee.io/public

# We should always be running in production mode
ENV NODE_ENV production

# Copy various scripts and files
COPY --chown=node:node public ./public
COPY --chown=node:node lib ./lib
COPY --chown=node:node index.js ./index.js
COPY --chown=node:node package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
