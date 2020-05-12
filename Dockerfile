# A temporary image that installs dependencies and
# builds the production-ready front-end bundles.

FROM node:12-alpine as bundles
WORKDIR /usr/src/smee.io
COPY package*.json ./
COPY webpack.config.js ./
COPY .babelrc ./
COPY src ./src
RUN ls
# Install the project's dependencies and build the bundles
RUN npm ci && npm run build && env NODE_ENV=production npm prune

# --------------------------------------------------------------------------------

FROM node:12-alpine
LABEL description="Smee.io"

# Let's make our home
WORKDIR /usr/src/smee.io

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
