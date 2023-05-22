"use client";

import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function WalkieTalkie() {
  const audioRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const [numClients, setNumClients] = useState<number>(0);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const [chat, setChat] = useState<{ chat: string; sender: string }[] | null>([
    { chat: "Welcome to Walkie Talkie!", sender: "System" },
    { chat: "Press the button to talk.", sender: "System" },
  ]);
  const [newChat, setNewChat] = useState<string>("");
  const [talking, setTalking] = useState<boolean>(false);

  const [socketConnected, setSocketConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const handleEnter = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        if (!newChat) return;

        socketRef.current?.send(JSON.stringify({ chat: newChat }));
        setNewChat("");
      }
    };
    window.addEventListener("keydown", handleEnter);
    return () => {
      window.removeEventListener("keydown", handleEnter);
    };
  }, [newChat]);

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection();
    socketRef.current = new WebSocket("wss://walkie.rolandkajatin.com/ws/");

    socketRef.current.addEventListener("open", function (event) {
      console.log("Connected to server");
      setSocketConnected(true);
    });

    socketRef.current.addEventListener("close", function (event) {
      console.log("Disconnected from server");
      setSocketConnected(false);
      setConnectionId(null);
      setNumClients(0);
    });

    socketRef.current.addEventListener("message", async function (event) {
      const data = JSON.parse(event.data);

      if (data.connId) {
        if (connectionId) return;
        setConnectionId(data.connId);
      }

      if (data.numClients) {
        setNumClients(data.numClients);
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
        console.log("data.offer", data.offer);
        const remoteDesc = new RTCSessionDescription(data.offer);
        await peerConnection.current?.setRemoteDescription(remoteDesc);
        const answer = await peerConnection.current?.createAnswer();
        await peerConnection.current?.setLocalDescription(answer);

        socketRef.current?.send(
          JSON.stringify({ answer: peerConnection.current?.localDescription })
        );
      }

      if (data.answer) {
        console.log("data.answer", data.answer);
        const remoteDesc = new RTCSessionDescription(data.answer);
        await peerConnection.current?.setRemoteDescription(remoteDesc);
      }

      if (data.candidate) {
        console.log("data.candidate", data.candidate);
        await peerConnection.current?.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    });

    // When ICE Candidate is found, send it to the other peer
    peerConnection.current.onicecandidate = function (event) {
      if (event.candidate) {
        console.log("event.candidate", event.candidate);
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

  const startConnection = async () => {
    const offer = await peerConnection.current?.createOffer();
    console.log("offer", offer);
    await peerConnection.current?.setLocalDescription(offer);
    socketRef.current?.send(
      JSON.stringify({ offer: peerConnection.current?.localDescription })
    );
  };

  return (
    <div>
      <Head>
        <title>Walkie Talkie</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col gap-2 justify-center w-screen p-10 items-center">
        <div className="flex flex-row gap-1 items-baseline hover:scale-110 transition-all">
          <div className="text-3xl text-indigo-500">Walkie Talkie</div>

          <Image src="/walkie-talkie.png" width={40} height={40} alt={""} />
        </div>

        <audio ref={audioRef} autoPlay />

        <div className="flex flex-row gap-2 items-center">
          <div
            className={
              "w-4 h-4 rounded-full " +
              (socketConnected ? "bg-green-500" : "bg-red-500")
            }
          ></div>

          {socketConnected ? (
            <div className="text-xl text-zinc-400">Connected</div>
          ) : (
            <div className="text-xl text-zinc-400">Disconnected</div>
          )}

          <div className="text-base text-zinc-500">[#{connectionId}]</div>
        </div>

        <button
          className={
            "text-4xl font-bold p-8 rounded-full uppercase my-10 transition-all " +
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
        </button>

        <div className="flex flex-row items-center justify-between w-3/4 lg:w-1/2 -mb-1 mt-4">
          <div className="flex flex-row gap-2 items-center">
            <div className="text-indigo-500 text-2xl font-medium hover:scale-110 transition-all">
              {numClients}
            </div>

            <div className="text-zinc-400 text-lg">
              {numClients === 1 ? "client" : "clients"} connected
            </div>
          </div>

          <div className="flex flex-row gap-2">
            <button
              className="text-zinc-500 ml-3 hover:text-zinc-400 transition-all"
              onClick={startConnection}
            >
              <span className="material-symbols-outlined">link</span>
            </button>

            {/* <button
              className="text-zinc-500 hover:text-zinc-400 transition-all"
              onClick={() => {
                if (!audioRef.current) return;
                audioRef.current.play();
              }}
            >
              <span className="material-symbols-outlined">volume_up</span>
            </button> */}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-2 border-zinc-600 rounded-xl p-3 w-3/4 lg:w-1/2">
          <div className="mt-4 flex flex-col gap-2 items-start w-full">
            {chat?.slice(-5).map((chat, index) => (
              <div
                key={index}
                className={
                  "flex flex-col rounded-lg px-2 py-1 bg-opacity-40 transition-all " +
                  (chat.sender === connectionId
                    ? "self-end bg-blue-500"
                    : "bg-zinc-500")
                }
              >
                <div className="text-zinc-400 text-sm">{chat.sender}</div>
                <div className="text-zinc-200 text-base">{chat.chat}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-row gap-3 justify-center">
            <input
              type="text"
              value={newChat}
              onChange={(e) => setNewChat(e.target.value)}
              placeholder="Send a message..."
              className="border border-zinc-600 rounded-md px-3 py-2 w-full outline-none bg-transparent"
            />

            <button
              className={
                "bg-indigo-500 transition-all rounded-md p-2 flex " +
                (newChat ? "opacity-100" : "opacity-60")
              }
              disabled={!newChat}
              onClick={() => {
                if (!newChat) return;

                socketRef.current?.send(JSON.stringify({ chat: newChat }));
                setNewChat("");
              }}
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
