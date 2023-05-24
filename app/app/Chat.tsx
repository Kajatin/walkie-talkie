"use client";

import React, { useRef } from "react";
import { useEffect, useState } from "react";

import { Client } from "./types";

export default function Chat(props: {
  clients: Client[];
  chat: { chat: string; sender: string }[] | null;
  socketRef: React.MutableRefObject<WebSocket | null>;
  connectionId: string | null;
}) {
  const { clients, chat, socketRef, connectionId } = props;

  const chatRef = useRef<HTMLDivElement>(null);
  const [newChat, setNewChat] = useState<string>("");

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
    if (chatRef?.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat]);

  return (
    <div className="flex flex-col w-3/4 lg:w-1/2">
      <div className="flex flex-row gap-2 p-3 -mb-2 items-baseline">
        <div className="text-retro-pink text-2xl font-medium hover:scale-110 transition-all">
          {clients.length}
        </div>

        <div className="text-lg">
          {clients.length === 1 ? "client" : "clients"} connected
        </div>
      </div>

      <div className="flex flex-col gap-4 border-2 border-zinc-600 rounded-xl p-3 w-full bg-zinc-100 bg-opacity-20">
        <div
          ref={chatRef}
          className="mt-1 flex flex-col gap-2 items-start w-full overflow-y-scroll max-h-64 px-3"
        >
          {chat?.slice(-50).map((chat, index) => {
            const senderNickname =
              clients.find((client) => client.id === chat.sender)?.nickname ||
              "anonymous";

            return (
              <div
                key={index}
                className={
                  "flex flex-col rounded-lg px-2 py-1 transition-all " +
                  (chat.sender === connectionId
                    ? "self-end bg-retro-yellow"
                    : "bg-zinc-100 bg-opacity-70")
                }
              >
                <div className="opacity-60 text-sm">{senderNickname}</div>
                <div className="text-base">{chat.chat}</div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-row gap-3 justify-center">
          <input
            type="text"
            value={newChat}
            onChange={(e) => setNewChat(e.target.value)}
            placeholder="Send a message..."
            className="rounded-xl px-3 py-2 w-full bg-zinc-100 bg-opacity-70 outline-none focus:ring-2 focus:ring-retro-yellow"
          />

          <button
            className="bg-retro-pink transition-all rounded-full hover:scale-110 px-3 py-2 flex text-zinc-100"
            disabled={!newChat}
            onClick={() => {
              if (!newChat) return;

              socketRef.current?.send(JSON.stringify({ chat: newChat }));
              setNewChat("");
            }}
          >
            <span className="material-symbols-outlined">local_shipping</span>
          </button>
        </div>
      </div>
    </div>
  );
}
