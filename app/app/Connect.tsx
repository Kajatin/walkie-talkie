import React from "react";

import { Client } from "./types";

export default function Connect(props: {
  nickname: string;
  setNickname: (nickname: string) => void;
  socketRef: React.MutableRefObject<WebSocket | null>;
  setConnected: (connected: boolean) => void;
  setConnectionId: (connectionId: string | null) => void;
  setClients: (clients: Client[]) => void;
  setChat: (chat: { chat: string; sender: string }[] | null) => void;
  peerConnection: React.MutableRefObject<RTCPeerConnection | null>;
  setOfferDescription: (
    offerDescription: {
      offer: RTCSessionDescription;
      from: string;
    } | null
  ) => void;
}) {
  const {
    nickname,
    setNickname,
    socketRef,
    setConnectionId,
    setConnected,
    setClients,
    setChat,
    peerConnection,
    setOfferDescription,
  } = props;

  const connectToServer = () => {
    if (!nickname || nickname.length === 0) return;

    socketRef.current = new WebSocket("ws://localhost:4002");

    socketRef.current.addEventListener("open", function (event) {
      console.log("Connected to server");
      socketRef.current?.send(JSON.stringify({ nickname: nickname }));
      setConnected(true);
    });

    socketRef.current.addEventListener("close", function (event) {
      console.log("Disconnected from server");
      setClients([]);
      setConnected(false);
      setConnectionId(null);
    });

    socketRef.current.addEventListener("message", async function (event) {
      const data = JSON.parse(event.data);
      console.log("data", data);

      if (data.newClient) {
        setClients((prevClients) => {
          const newClients = [...prevClients, data.newClient];
          return newClients;
        });
      }

      if (data.clientNickname) {
        setClients((prevClients) => {
          const newClients = prevClients.map((client) => {
            if (client.id === data.clientNickname.id) {
              client.nickname = data.clientNickname.nickname;
            }
            return client;
          });
          return newClients;
        });
      }

      if (data.onConnect) {
        setClients(data.onConnect.clients);
        setConnectionId(data.onConnect.id);
      }

      if (data.disconnectedPeer) {
        setClients((prevClients) => {
          const newClients = prevClients.filter(
            (client) => client.id !== data.disconnectedPeer.id
          );
          return newClients;
        });
      }

      if (data.chat) {
        setChat((prevChat) => {
          const newChat = { chat: data.chat, sender: data.sender };
          if (prevChat) {
            return [...prevChat, newChat];
          } else {
            return [newChat];
          }
        });
      }

      if (data.offer) {
        setOfferDescription({
          offer: data.offer,
          from: data.from,
        });
      }

      if (data.revoke) {
        setOfferDescription(null);
      }

      if (data.answer) {
        const remoteDesc = new RTCSessionDescription(data.answer);
        await peerConnection.current?.setRemoteDescription(remoteDesc);
      }

      if (data.candidate) {
        await peerConnection.current?.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 mt-12 w-[80%] lg:w-[40%]">
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Nickname"
        className="text-xl text-zinc-200 rounded-xl px-3 py-2 bg-zinc-500 bg-opacity-40 outline-none focus:ring-2 focus:ring-indigo-300"
      />

      <button
        onClick={connectToServer}
        disabled={nickname.length === 0}
        className={
          "text-xl text-zinc-100 rounded-full px-3 py-2 bg-indigo-600 transition-all " +
          (nickname.length === 0 ? "" : "hover:scale-110")
        }
      >
        Connect
      </button>
    </div>
  );
}
