# walkie-talkie <img width="50" src="https://github.com/Kajatin/walkie-talkie/assets/33018844/7d856caa-e225-443b-846f-cb14d2065c48">
A simple WebRTC based walkie talkie app(-ish).

<p align="center">
  <img width="800" src="https://github.com/Kajatin/walkie-talkie/assets/33018844/f7f55b61-ff0a-4870-af6b-1d75788b6ae5">
</p>

This project is inspired by the walkie-talkie app on the Apple Watch. It is by no means
a complete clone of the app, but it is a fun project to learn more about WebRTC and
how to use it in a real world application.

This app allows you to connect to a server and talk to other people connected to the
same server. Currently you have the option to connect with a specific person. I
don't yet support multiple people in the same room, but that is something I want to
add in the future. There is a chat feature too, which is global, so everyone connected
to the server can see the messages and talk to each other.

## Stack

This project consists of two parts, the server and the client. The server is a simple
Node.js server that accepts websocket connections from clients. It facilitates the
communication between clients and keeps track of who is connected to the server.

The client is a Next.js app that uses React. It uses a websocket connection to the
server to communicate with other clients. WebRTC is used to establish a peer-to-peer
connection between clients.

## Deployment

The app is deployed on my home server using my own domain. [Check it out here](https://walkie.rolandkajatin.com).
It is served securely with the help of a [Let's Encrypt](https://letsencrypt.org/)
provided certificate managed and set up with [Certbot](https://certbot.eff.org/).
The app is then exposed through an [NGINX](https://www.nginx.com/) reverse proxy.

## Deployment with Docker

The app can be deployed with Docker. The server and client are separate Docker images
and can be run separately. The server is exposed on port 4002 and the client on port
3001.

### Server

* `cd server`
* `sudo docker build -t walkie-talkie-server .`
* `sudo docker run -p 4002:4002 walkie-talkie-server`

### Client

* `cd app`
* `sudo docker build -t walkie-talkie-client .`
* `sudo docker run -p 3001:3001 walkie-talkie-client`

---

## TODO

* [x] Connect to server with a nickname
* [x] Connect with a specific peer
* [ ] Allow multiple peers to connect and talk
* [ ] Disable talk option if someone else is talking
* [ ] Speech-to-text and text-to-speech
* [ ] Chat groups
* [x] Disconnect button
* [ ] Secure who can connect to the server

## Screenshots

<p align="center">
  <img width="800" src="https://github.com/Kajatin/walkie-talkie/assets/33018844/1e0dc68f-b566-4d11-a773-1d01ab08d7aa">
</p>

<p align="center">
  <img width="800" src="https://github.com/Kajatin/walkie-talkie/assets/33018844/2f59838a-6c43-404c-90a3-58d46be567c6">
</p>
