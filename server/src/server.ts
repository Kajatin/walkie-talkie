import * as WebSocket from "ws";

let clients: {
  [connId: string]: {
    ws: WebSocket | null;
    nickname?: string;
  };
} = {};
const port = Number(process.env.PORT) || 4002;
const wss = new WebSocket.Server({ port: port });
console.log(`HTTP server listening on port ${port}`);

const sendToAll = (msg: string | WebSocket.RawData) => {
  Object.keys(clients).forEach((clientConnId) => {
    clients[clientConnId].ws?.send(msg);
  });
};

const sendToSelf = (connId: string, msg: string | WebSocket.RawData) => {
  try {
    clients[connId].ws?.send(msg);
  } catch (error) {
    console.error("sendToSelf error: ", error);
  }
};

const sendToAllButSelf = (connId: string, msg: string | WebSocket.RawData) => {
  Object.keys(clients).forEach((clientConnId) => {
    if (clientConnId !== connId) {
      clients[clientConnId].ws?.send(msg);
    }
  });
};

const sendTo = (connId: string, msg: string | WebSocket.RawData) => {
  try {
    clients[connId].ws?.send(msg);
  } catch (error) {
    console.error("sendTo error: ", error);
  }
};

wss.on("connection", (ws) => {
  const connId = Math.random().toString(36).slice(2);
  clients[connId] = { ws, nickname: "anonymous" };

  sendToAllButSelf(
    connId,
    JSON.stringify({
      newClient: {
        id: connId,
        nickname: clients[connId].nickname,
      },
    })
  );

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      //   console.log("Received message: ", msg);

      if (data.nickname) {
        clients[connId].nickname = data.nickname;

        // We notify all clients about new nickname
        sendToAllButSelf(
          connId,
          JSON.stringify({
            clientNickname: {
              id: connId,
              nickname: clients[connId].nickname,
            },
          })
        );

        // We notify the client itself about its nickname
        sendToSelf(
          connId,
          JSON.stringify({
            onConnect: {
              id: connId,
              clients: Object.keys(clients).map((clientConnId) => ({
                id: clientConnId,
                nickname: clients[clientConnId].nickname,
              })),
            },
          })
        );
      }

      if (data.offer || data.answer || data.revoke) {
        sendTo(data.peer, msg);
      }

      if (data.candidate) {
        sendToAllButSelf(connId, msg);
      }

      if (data.chat) {
        sendToAll(JSON.stringify({ chat: data.chat, sender: connId }));
      }
    } catch (error) {
      console.error('ws.on("message") error: ', error);
    }
  });

  ws.on("close", async () => {
    try {
      delete clients[connId];
      console.log("Removed connection: ", connId);

      sendToAll(
        JSON.stringify({
          disconnectedPeer: {
            id: connId,
          },
        })
      );
    } catch (error) {
      console.error('ws.on("close") error: ', error);
    }
  });
});
