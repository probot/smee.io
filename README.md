<h3 align="center"><a href="https://smee.io">smee.io</a></h3>

<p align="center">
  Webhook payload delivery service<br>
  <a href="#usage">Usage</a> •
  <a href="#how-it-works">How it works</a> •
  <a href="#deploying-your-own-smee.io">Deploying your own Smee.io</a> •
  <a href="#faq">FAQ</a>
</p>

<p align="center"><a href="https://travis-ci.com/probot/smee.io"><img src="https://badgen.now.sh/travis/probot/smee.io" alt="Build Status"></a> <a href="https://codecov.io/gh/probot/smee.io/"><img src="https://badgen.now.sh/codecov/c/github/probot/smee.io" alt="Codecov"></a></p>

<p align="center"><a href="https://github.com/probot/smee-client">Looking for <strong>probot/smee-client</strong>?</a></p>

## Usage

Smee is a webhook payload delivery service - it receives webhook payloads, and sends them to listening clients. You can generate a new channel by visiting https://smee.io, and get a unique URL to sent payloads to.

> **Heads up**! Smee.io is intended for use in development, not for production. It's a way to inspect payloads through a UI and receive them on a local machine, not as a proxy for production applications.

## How it works

Smee works with two components: smee.io, the public website, and the [`smee-client`](https://github.com/probot/smee-client). They talk to each other via [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), a type of connection that allows for messages to be sent from a source to any clients listening.

This means that channels are just an abstraction - all Smee does is get a payload and sends it to any _actively connected clients_.

## Deploying your own Smee.io

Smee.io is a simple Node.js application. You can deploy it any way you would deploy any other Node app. The easier solution is probably Heroku, or you can use the `Dockerfile` found in this repository to deploy a container.

Don't forget to point `smee-client` to your instance of `smee.io`:

```
smee --url https://your-smee.io/channel 
```

## FAQ

**How long do channels live for?**

Channels are always active - once a client is connected, Smee will send any payloads it gets at `/:channel` to those clients.

**Should I use this in production?**

No! Smee is not designed for production use - it is a development and testing tool. Note that channels are _not authenticated_, so if someone has your channel ID they can see the payloads being sent, so it is _not_ secure for production use.

**Are payloads ever stored?**

Webhook payloads are never stored on the server, or in any database; the Smee.io server is simply a pass-through. However, we do store payloads in `localStorage` in your browser, so that revisiting `https://smee.io/:channel` will persist the payloads you saw there last.
