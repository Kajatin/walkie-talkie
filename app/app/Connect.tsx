import React, { useEffect } from "react";

export default function Connect(props: {
  nickname: string;
  setNickname: (nickname: string) => void;
  setCommittedNickname: (committedNickname: boolean) => void;
}) {
  const { nickname, setNickname, setCommittedNickname } = props;

  useEffect(() => {
    const handleEnter = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        if (!nickname) return;

        setCommittedNickname(true);
      }
    };
    window.addEventListener("keydown", handleEnter);
    return () => {
      window.removeEventListener("keydown", handleEnter);
    };
  }, [nickname]);

  return (
    <div className="flex flex-col gap-4 mt-12 w-[80%] lg:w-[40%]">
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Nickname"
        className="text-xl rounded-xl px-3 py-2 bg-zinc-100 bg-opacity-70 outline-none focus:ring-2 focus:ring-retro-yellow"
      />

      <button
        onClick={() => {
          if (!nickname) return;

          setCommittedNickname(true);
        }}
        disabled={nickname.length === 0}
        className="text-xl text-zinc-100 rounded-full px-3 py-2 bg-retro-pink transition-all hover:scale-110"
      >
        Connect
      </button>
    </div>
  );
}
