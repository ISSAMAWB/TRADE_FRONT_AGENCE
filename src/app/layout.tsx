import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Trade Portal",
  description: "Portail Trade — orchestration omnicanale IRD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
