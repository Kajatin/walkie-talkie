import * as WebSocket from "ws";

let clients = {};
const port = Number(process.env.PORT) || 4002;
const wss = new WebSocket.Server({ port: port });
console.log(`HTTP server listening on port ${port}`);

wss.on("connection", (ws) => {
  const connId = Math.random().toString(36).slice(2);
  clients[connId] = { ws };

  Object.keys(clients).forEach((clientConnId) => {
    if (clientConnId !== connId) {
      clients[clientConnId].ws.send(
        JSON.stringify({
          numClients: Object.keys(clients).length,
        })
      );
    } else {
      // Send the client their connId
      clients[connId].ws.send(
        JSON.stringify({
          connId: connId,
          numClients: Object.keys(clients).length,
        })
      );
    }
  });

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      //   console.log("Received message: ", msg);

      if (data.offer || data.answer) {
        // Relay the offer or answer to all other clients
        Object.keys(clients).forEach((clientConnId) => {
          if (clientConnId !== connId) {
            clients[clientConnId].ws.send(msg);
          }
        });
      }

      if (data.candidate) {
        // Relay the candidate to all other clients
        Object.keys(clients).forEach((clientConnId) => {
          if (clientConnId !== connId) {
            clients[clientConnId].ws.send(msg);
          }
        });
      }

      if (data.chat) {
        // send message to all clients
        Object.keys(clients).forEach((clientConnId) => {
          clients[clientConnId].ws.send(
            JSON.stringify({
              chat: data.chat,
              sender: connId,
            })
          );
        });
      }
    } catch (error) {
      console.error('ws.on("message") error: ', error);
    }
  });

  ws.on("close", async () => {
    try {
      delete clients[connId];
      console.log("Deleted peer: ", connId);

      // Notify all clients of disconnected peer
      Object.keys(clients).forEach((clientConnId) => {
        clients[clientConnId].ws.send(
          JSON.stringify({
            connIdOut: connId,
            numClients: Object.keys(clients).length,
          })
        );
      });
    } catch (error) {
      console.error('ws.on("close") error: ', error);
    }
  });
});
