import Image from "next/image";

export default function Header(props: {
  connected: boolean;
  connectionId: string | null;
}) {
  const { connected, connectionId } = props;

  return (
    <div className="flex flex-col gap-2 justify-center items-center">
      <div className="flex flex-row gap-1 items-baseline hover:scale-110 transition-all">
        <div className="text-3xl text-retro-pink">Walkie Talkie</div>
        <Image
          src="/walkie-talkie.png"
          width={40}
          height={40}
          alt={""}
          className={connected ? "" : "grayscale"}
        />
      </div>

      <div className="flex flex-row gap-2 items-center">
        <div
          className={
            "w-4 h-4 rounded-full border-b-2 border-r-2 border-zinc-600 " +
            (connected ? "bg-retro-yellow" : "bg-retro-pink")
          }
        ></div>

        {connected ? (
          <>
            <div className="text-xl">Connected</div>
            <div className="text-base text-zinc-500 text-opacity-80">
              [#{connectionId}]
            </div>
          </>
        ) : (
          <div className="text-xl">Disconnected</div>
        )}
      </div>
    </div>
  );
}
