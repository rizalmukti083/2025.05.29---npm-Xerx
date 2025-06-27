// src/app/mytokens/page.js

'use client'

// import NetworkChanger from "@/components/NetworkChanger"; // Bezpośredni import jest usunięty
import UserForm from "@/components/UserForm";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';

// Dynamicznie importujemy WalletMultiButton z opcją ssr: false
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false, loading: () => <div style={{ width: '136px', height: '48px', backgroundColor: '#222', borderRadius: '15px' }} /> } // Placeholder na czas ładowania
);

// Dynamicznie importujemy NetworkChanger z opcją ssr: false
const NetworkChangerDynamic = dynamic(
  async () => await import('@/components/NetworkChanger'),
  { ssr: false, loading: () => <div style={{ width: '180px', height: '40px', backgroundColor: '#222', borderRadius: '0.5rem' }} /> } // Placeholder na czas ładowania
);

export default function MyTokens() {
  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-start">
      <section className="container space-y-6 max-w-7xl w-full mx-auto p-4  flex flex-col justify-center items-center rounded-xl my-16">
        <div className="flex flex-col justify-center items-start gap-3">
          <h1 className="text-3xl font-bold">Your Tokens & NFTs</h1>
          <p className="tracking-wide leading-5">
            Connect your wallet to view all your tokens and NFTs on the Solana
            network. Whether you're on Mainnet or Devnet, this tool fetches and
            displays your assets seamlessly. Explore your holdings, manage your
            collections, and stay in control of your digital assets with ease.
          </p>
          <div className="flex gap-3">
            <WalletMultiButtonDynamic
              style={{
                borderRadius: 15,
                background: "transparent",
                border: "1px solid #737373",
              }}
            />
            <Link
              className=" flex justify-center items-center border border-neutral-500 hover:border-neutral-700 hover:text-white/70 transition-all duration-300 ease-in-out text-white font-bold p-3 rounded-xl "
              href={"/"}
            >
              <SquarePen className="w-4 h-4 mr-2" /> Create Token
            </Link>
          </div>
          <NetworkChangerDynamic /> {/* Używamy dynamicznie zaimportowanego NetworkChanger */}
        </div>
        <UserForm />
      </section>
    </main>
  );
}