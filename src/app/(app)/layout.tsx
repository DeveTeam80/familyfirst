import type { Metadata } from "next";
import "../../app/globals.css";
import Providers from "../providers";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Family First",
  description: "Stay connected with your family",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header>
            {children}
          </Header>
        </Providers>
      </body>
    </html>
  );
}