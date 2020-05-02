####################################################
# To build your own image: 
#    > docker build --build-arg BUILD_VERSION=0.0.3 --build-arg BUILD_DATE=2019-05-19 -t probot/smee-io:latest .
#      (Protips: Add an another -t probot/smee-io:0.0.3 for a tag also for the version)
# To run your image once it's ready:
#    > docker run -d -p 3000:3000 --name smee-io probot/smee-io:latest
# To push the image into your docker repository (e.g.):
#    > docker push probot/smee-io:latest
# If you wish to remove your dangling images after build, please do the following:
#    > docker rmi $(docker images -f “dangling=true” -q)
####################################################

##############################################################################
# Build arguments
##############################################################################
ARG BUILD_VERSION
ARG BUILD_DATE
ARG PORT=3000

##############################################################################
# Build the container with Source code compiled
##############################################################################
FROM node:lts-alpine as build-env
## To allow caching before building, we need to remove 'postinstall' from the package.json
## > See about optimization: https://www.aptible.com/documentation/enclave/tutorials/faq/dockerfile-caching/npm-dockerfile-caching.html
WORKDIR /source
ADD . .
RUN npm ci

##############################################################################
# Build the final runtime container
# Note: Port must be > 1024. See https://stackoverflow.com/a/9947222/80527
##############################################################################
FROM node:lts-alpine
ARG PORT=3000
WORKDIR /app/smee-io
COPY --from=build-env /source .
RUN addgroup -S probot && \
    adduser -S -G probot smee-io && \
    chown -R smee-io:probot /app
USER smee-io

##############################################################################
# Define other environment variable if needed.
##############################################################################
ENV PORT=$PORT

EXPOSE $PORT
ENTRYPOINT [ "npm", "start" ]

##############################################################################
# Label the Image
##############################################################################
LABEL name="smee-io"
LABEL version=$BUILD_VERSION
LABEL description="Smee.io: https://smee.io/ \r\nReceives payloads then sends them to your locally running application."
LABEL org.label-schema.vendor="Smee.io" 
LABEL org.label-schema.build-date=$BUILD_DATE 
LABEL org.label-schema.version=$BUILD_VERSION 
LABEL org.label-schema.docker.cmd="docker run -p 3000:3000 -d probot/smee-io"
