"use client";

import Head from "next/head";
import { useEffect, useRef, useState } from "react";

import Chat from "./Chat";
import Peers from "./Peers";
import Header from "./Header";
import Connect from "./Connect";

import { Client } from "./types";

export default function WalkieTalkie() {
  const [connected, setConnected] = useState(false);
  const [nickname, setNickname] = useState<string>("");
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [chat, setChat] = useState<{ chat: string; sender: string }[] | null>([
    { chat: "Welcome to Walkie Talkie!", sender: "System" },
    { chat: "Press the button to talk.", sender: "System" },
  ]);

  const socketRef = useRef<WebSocket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [offerDescription, setOfferDescription] = useState<{
    offer: RTCSessionDescription;
    from: string;
  } | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
    };
  }, []);

  return (
    <div>
      <Head>
        <title>Walkie Talkie</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col gap-6 justify-center w-screen p-10 items-center">
        <Header connected={connected} connectionId={connectionId} />

        {connected ? (
          <>
            <Peers
              clients={clients}
              connectionId={connectionId}
              peerConnection={peerConnection}
              socketRef={socketRef}
              setLocalStream={setLocalStream}
              offerDescription={offerDescription}
              setOfferDescription={setOfferDescription}
              localStream={localStream}
            />
            <Chat
              clients={clients}
              chat={chat}
              socketRef={socketRef}
              connectionId={connectionId}
            />
          </>
        ) : (
          <Connect
            nickname={nickname}
            setNickname={setNickname}
            socketRef={socketRef}
            setConnected={setConnected}
            setConnectionId={setConnectionId}
            setClients={setClients}
            setChat={setChat}
            peerConnection={peerConnection}
            setOfferDescription={setOfferDescription}
          />
        )}
      </div>
    </div>
  );
}
