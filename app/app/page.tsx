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

  const audioRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const candidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [walkieTalkieOffer, setWalkieTalkieOffer] = useState<string | null>(
    null
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [committedNickname, setCommittedNickname] = useState(false);

  useEffect(() => {
    if (!committedNickname || !nickname || nickname.length === 0) return;

    socketRef.current?.send(JSON.stringify({ nickname: nickname }));
    setConnected(true);
  }, [committedNickname]);

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection();
    socketRef.current = new WebSocket("ws://localhost:4002");

    socketRef.current.addEventListener("open", function (event) {
      console.log("Connected to server");
    });

    socketRef.current.addEventListener("close", function (event) {
      console.log("Disconnected from server");
      setClients([]);
      setConnected(false);
      setConnectionId(null);
      setWalkieTalkieOffer(null);
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

      if (data.walkieTalkieOffer) {
        setWalkieTalkieOffer(data.from);
      }

      if (data.revoke) {
        setWalkieTalkieOffer(null);
        setSelectedClient(null);
      }

      if (data.offer) {
        console.log("offer", data);
        console.log("selectedClient", selectedClient);

        // if (data.from === selectedClient?.id) {
        console.log("offer from selected client");
        const remoteDesc = new RTCSessionDescription(data.offer);
        await peerConnection.current?.setRemoteDescription(remoteDesc);

        // Now that remote description is set, add all queued candidates
        for (const queuedCandidate of candidateQueue.current) {
          await peerConnection.current?.addIceCandidate(
            new RTCIceCandidate(queuedCandidate)
          );
        }
        // Clear the queue after all candidates are added
        candidateQueue.current = [];

        const answer = await peerConnection.current?.createAnswer();
        await peerConnection.current?.setLocalDescription(answer);
        socketRef.current?.send(
          JSON.stringify({
            answer: peerConnection.current?.localDescription,
            peer: data.from,
            from: connectionId,
          })
        );
        // }
      }

      if (data.answer) {
        console.log("answer", data);
        const remoteDesc = new RTCSessionDescription(data.answer);
        await peerConnection.current?.setRemoteDescription(remoteDesc);

        // Now that remote description is set, add all queued candidates
        for (const queuedCandidate of candidateQueue.current) {
          await peerConnection.current?.addIceCandidate(
            new RTCIceCandidate(queuedCandidate)
          );
        }
        // Clear the queue after all candidates are added
        candidateQueue.current = [];

        setWalkieTalkieOffer(null);
      }

      // if (data.candidate) {
      //   console.log("candidate", data);
      //   await peerConnection.current?.addIceCandidate(
      //     new RTCIceCandidate(data.candidate)
      //   );
      // }

      if (data.candidate) {
        const candidate = new RTCIceCandidate(data.candidate);

        if (peerConnection.current?.remoteDescription) {
          console.log("candidate", data);
          await peerConnection.current?.addIceCandidate(candidate);
        } else {
          // If remote description isn't set yet, add the candidate to the queue
          candidateQueue.current.push(data.candidate);
        }
      }
    });

    // When ICE Candidate is found, send it to the other peer
    peerConnection.current.onicecandidate = function (event) {
      console.log("event.candidate", event.candidate);
      if (event.candidate) {
        socketRef.current?.send(JSON.stringify({ candidate: event.candidate }));
      }
    };

    peerConnection.current.ontrack = function (event) {
      console.log("event.ontrack", event.streams);
      // event.streams[0] contains the audio data being received
      audioRef.current.srcObject = event.streams[0];
    };

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        stream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, stream);
          // Initially disable the tracks
          track.enabled = false;
        });

        // Save the stream so we can access it later
        setLocalStream(stream);
      });

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

        <audio ref={audioRef} autoPlay />

        {connected ? (
          <>
            <Peers
              clients={clients}
              connectionId={connectionId}
              peerConnection={peerConnection}
              socketRef={socketRef}
              walkieTalkieOffer={walkieTalkieOffer}
              setWalkieTalkieOffer={setWalkieTalkieOffer}
              localStream={localStream}
              selectedClient={selectedClient}
              setSelectedClient={setSelectedClient}
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
            setCommittedNickname={setCommittedNickname}
          />
        )}
      </div>
    </div>
  );
}
