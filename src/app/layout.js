import "./globals.css";
import AppWalletProvider from "@/provider/AppWalletProvider";
import { Toaster } from "sonner";
export const metadata = {
  title: "Solana Token Creator",
  description: "Create your own Solana token",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppWalletProvider>
          <Toaster position="top-center" />
          {children}
        </AppWalletProvider>
      </body>
    </html>
  );
}