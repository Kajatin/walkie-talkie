"use client";

import { useEffect, useRef, useState } from "react";

import { Client } from "./types";

export default function Peers(props: {
  clients: Client[];
  connectionId: string | null;
  peerConnection: React.MutableRefObject<RTCPeerConnection | null>;
  socketRef: React.MutableRefObject<WebSocket | null>;
  walkieTalkieOffer: string | null;
  setWalkieTalkieOffer: (from: string | null) => void;
  localStream: MediaStream | null;
  selectedClient: Client | null;
  setSelectedClient: React.Dispatch<React.SetStateAction<Client | null>>;
}) {
  const {
    clients,
    connectionId,
    peerConnection,
    socketRef,
    walkieTalkieOffer,
    setWalkieTalkieOffer,
    localStream,
    selectedClient,
    setSelectedClient,
  } = props;

  const [talking, setTalking] = useState<boolean>(false);

  const revokeWalkieTalkieOffer = async (id: string) => {
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
    <div className="flex flex-col gap-1 items-center justify-center w-3/4 lg:w-1/2">
      {clients.length === 1 ? (
        <div className="text-lg">No one else is online right now</div>
      ) : (
        <div className="flex flex-row gap-1.5 p-2 overflow-x-scroll overflow-y-hidden no-scrollbar w-full">
          {clients.map((client) => {
            if (client.id === connectionId) return null;

            return (
              <div
                key={client.id}
                className={
                  "rounded-full px-3 py-2 text-lg transition-all cursor-pointer hover:scale-110 " +
                  (client.id === selectedClient?.id
                    ? "bg-retro-pink text-zinc-100"
                    : "bg-retro-yellow")
                }
                onClick={async () => {
                  if (client.id === connectionId) return;

                  if (selectedClient === client) {
                    await revokeWalkieTalkieOffer(client.id);
                    setSelectedClient(null);
                  } else {
                    console.log("sending offer");
                    socketRef.current?.send(
                      JSON.stringify({
                        walkieTalkieOffer: true,
                        peer: client.id,
                        from: connectionId,
                      })
                    );
                    console.log("sent offer", client);
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

      {walkieTalkieOffer && (
        <div className="flex flex-col mt-10 mb-6 gap-2 items-center justify-center text-xl">
          <div className="flex flex-row gap-3">
            <div className="animate-bounce text-retro-pink text-2xl font-medium">
              {clients.find((client) => client.id === walkieTalkieOffer)
                ?.nickname || "anonymous"}
            </div>
            <div className="">wants to connect</div>
          </div>

          <div className="flex flex-row gap-3">
            <button
              className="rounded-full px-3 py-2 bg-retro-pink transition-all hover:scale-110 text-zinc-100"
              onClick={async () => {
                const offer = await peerConnection.current?.createOffer();
                await peerConnection.current?.setLocalDescription(offer);
                socketRef.current?.send(
                  JSON.stringify({
                    offer: peerConnection.current?.localDescription,
                    peer: walkieTalkieOffer,
                    from: connectionId,
                  })
                );
              }}
            >
              Accept
            </button>

            <button
              className="rounded-full px-3 py-2 bg-zinc-500 transition-all hover:scale-110 text-zinc-100"
              onClick={async () => {
                await revokeWalkieTalkieOffer(walkieTalkieOffer);
                setWalkieTalkieOffer(null);
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      <button
        className={
          "w-fit text-4xl font-bold p-8 rounded-full uppercase my-10 transition-all " +
          (talking
            ? "bg-retro-yellow scale-110"
            : "bg-retro-pink hover:scale-110 text-zinc-100")
        }
        onClick={() => {
          if (!talking) {
            handleTalkButtonMouseDown();
          } else {
            handleTalkButtonMouseUp();
          }
        }}
      >
        <span
          className={
            "material-symbols-outlined mt-2 scale-125 transition-all " +
            (talking ? "animate-pulse" : "")
          }
        >
          {talking ? "graphic_eq" : "mic"}
        </span>
      </button>
    </div>
  );
}
