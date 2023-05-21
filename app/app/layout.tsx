import "./globals.css";
import { Slackey } from "next/font/google";

const googleFont = Slackey({ weight: "400", subsets: ["latin"] });

export const metadata = {
  title: "Walkie Talkie",
  description: "Talk to your friends",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={googleFont.className}>{children}</body>
    </html>
  );
}
