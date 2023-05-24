"use client";

import { useEffect, useRef, useState } from "react";

import { Client } from "./types";

export default function Peers(props: {
  clients: Client[];
  connectionId: string | null;
  peerConnection: React.MutableRefObject<RTCPeerConnection | null>;
  socketRef: React.MutableRefObject<WebSocket | null>;
  setLocalStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
  offerDescription: {
    offer: RTCSessionDescription;
    from: string;
  } | null;
  setOfferDescription: (
    offerDescription: {
      offer: RTCSessionDescription;
      from: string;
    } | null
  ) => void;
  localStream: MediaStream | null;
}) {
  const {
    clients,
    connectionId,
    peerConnection,
    socketRef,
    setLocalStream,
    offerDescription,
    setOfferDescription,
    localStream,
  } = props;

  const audioRef = useRef<any>(null);
  const [talking, setTalking] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection();

    // When ICE Candidate is found, send it to the other peer
    peerConnection.current.onicecandidate = function (event) {
      if (event.candidate) {
        socketRef.current?.send(JSON.stringify({ candidate: event.candidate }));
      }
    };

    peerConnection.current.ontrack = function (event) {
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
  }, []);

  const startConnection = async (id: string) => {
    const offer = await peerConnection.current?.createOffer();
    await peerConnection.current?.setLocalDescription(offer);
    socketRef.current?.send(
      JSON.stringify({
        offer: peerConnection.current?.localDescription,
        peer: id,
        from: connectionId,
      })
    );
  };

  const revokeConnection = async (id: string) => {
    socketRef.current?.send(
      JSON.stringify({
        revoke: true,
        peer: id,
        from: connectionId,
      })
    );
  };

  const handleTalkButtonMouseDown = () => {
    // Enable all tracks
    localStream?.getTracks().forEach((track) => {
      track.enabled = true;
    });
    setTalking(true);
  };

  const handleTalkButtonMouseUp = () => {
    // Disable all tracks
    localStream?.getTracks().forEach((track) => {
      track.enabled = false;
    });
    setTalking(false);
  };

  return (
    <div className="flex flex-col gap-1 items-center justify-center">
      <audio ref={audioRef} autoPlay />

      {clients.length === 1 ? (
        <div className="text-lg text-zinc-400">
          No one else is online right now
        </div>
      ) : (
        <div className="flex flex-row gap-1 overflow-x-scroll overflow-y-hidden no-scrollbar w-3/4 lg:w-1/2">
          {clients.map((client) => {
            if (client.id === connectionId) return null;

            return (
              <div
                key={client.id}
                className={
                  "text-zinc-200 rounded-full px-3 py-2 text-lg bg-opacity-40 transition-all cursor-pointer " +
                  (client.id === selectedClient?.id
                    ? "bg-blue-500"
                    : client.id === connectionId
                    ? "bg-zinc-500"
                    : "bg-zinc-500 hover:bg-opacity-60")
                }
                onClick={async () => {
                  if (client.id === connectionId) return;

                  if (selectedClient === client) {
                    await revokeConnection(client.id);
                    setSelectedClient(null);
                  } else {
                    await startConnection(client.id);
                    setSelectedClient(client);
                  }
                }}
              >
                {client.nickname}
              </div>
            );
          })}
        </div>
      )}

      {offerDescription && (
        <div className="flex flex-col mt-10 mb-6 gap-2 items-center justify-center text-xl text-zinc-100">
          <div className="flex flex-row gap-3">
            <div className="animate-bounce text-indigo-500 text-2xl font-medium">
              {clients.find((client) => client.id === offerDescription.from)
                ?.nickname || "anonymous"}
            </div>
            <div className="text-zinc-200">wants to connect</div>
          </div>

          <div className="flex flex-row gap-3">
            <button
              className="rounded-full px-3 py-2 bg-indigo-500 transition-all hover:scale-110"
              onClick={async () => {
                const remoteDesc = new RTCSessionDescription(
                  offerDescription.offer
                );
                await peerConnection.current?.setRemoteDescription(remoteDesc);
                const answer = await peerConnection.current?.createAnswer();
                await peerConnection.current?.setLocalDescription(answer);
                socketRef.current?.send(
                  JSON.stringify({
                    answer: peerConnection.current?.localDescription,
                  })
                );
                setOfferDescription(null);
              }}
            >
              Accept
            </button>

            <button
              className="rounded-full px-3 py-2 bg-zinc-500 bg-opacity-40 transition-all hover:scale-110"
              onClick={async () => {}}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* <button
        className={
          "w-fit text-4xl font-bold p-8 rounded-full uppercase my-10 transition-all " +
          (talking
            ? "animate-pulse bg-amber-600 scale-110"
            : "bg-indigo-600 hover:scale-110")
        }
        onClick={() => {
          if (!talking) {
            handleTalkButtonMouseDown();
          } else {
            handleTalkButtonMouseUp();
          }
        }}
      >
        <span className="material-symbols-outlined mt-2 scale-125">mic</span>
      </button> */}
    </div>
  );
}
