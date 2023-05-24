# walkie-talkie <img width="50" src="https://github.com/Kajatin/walkie-talkie/assets/33018844/7d856caa-e225-443b-846f-cb14d2065c48">
A simple WebRTC based walkie talkie app(-ish).

<p align="center">
  <img width="800" src="https://github.com/Kajatin/walkie-talkie/assets/33018844/2065974b-ca8a-44c2-9b79-163ee7ab07fa">
</p>

* `sudo docker build -t walkie-talkie-server .`
* `sudo docker run -p 4002:4002 walkie-talkie-server`
* `sudo docker build -t walkie-talkie-client .`
* `sudo docker run -p 3001:3001 walkie-talkie-client`

### TODO: write info

- [ ] Connect to server with a nickname
- [ ] Select who to talk to
- [ ] Allow multiple peers to connect and talk
- [ ] Disable talk option if someone else is talking
- [ ] Speech-to-text and text-to-speech
* [ ] Chat groups
* [ ] Disconnect button
