import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade Portal",
  description: "Portail Trade — orchestration omnicanale IRD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
