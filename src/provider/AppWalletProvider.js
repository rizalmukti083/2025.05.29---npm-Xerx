// src/provider/AppWalletProvider.js
"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import * as walletAdapterWallets from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

// Kontekst do zarządzania wybraną siecią
export const NetworkContext = createContext({
  network: WalletAdapterNetwork.Mainnet, // Domyślna wartość, np. Mainnet
  setNetwork: (network) => console.warn('NetworkContext.setNetwork nie zostało jeszcze nadpisane przez Providera'),
});

const AppWalletProvider = ({ children }) => {
  // Stan dla wybranej sieci, domyślnie Mainnet
  // Możesz zmienić domyślną sieć np. na Devnet, jeśli jest to preferowane środowisko deweloperskie
  const [network, setNetwork] = useState(WalletAdapterNetwork.Mainnet); 

  useEffect(() => {
    // Informacja o zmianie sieci w konsoli
    console.log(`[AppWalletProvider] Sieć zmieniona na: ${network}`);
  }, [network]);

  const endpoint = useMemo(() => {
    const mainnetRpc = process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || "";
    const devnetRpc = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "";
    const testnetRpc = process.env.NEXT_PUBLIC_SOLANA_TESTNET_RPC || "";
    
    let rpcUrl;

    if (network === WalletAdapterNetwork.Mainnet) {
      rpcUrl = mainnetRpc || clusterApiUrl(WalletAdapterNetwork.Mainnet);
      console.log(`[AppWalletProvider] Używam Mainnet RPC: ${rpcUrl} (Z ENV: ${mainnetRpc ? 'TAK' : 'NIE, fallback'})`);
    } else if (network === WalletAdapterNetwork.Devnet) {
      rpcUrl = devnetRpc || clusterApiUrl(WalletAdapterNetwork.Devnet);
      console.log(`[AppWalletProvider] Używam Devnet RPC: ${rpcUrl} (Z ENV: ${devnetRpc ? 'TAK' : 'NIE, fallback'})`);
    } else if (network === WalletAdapterNetwork.Testnet) {
      rpcUrl = testnetRpc || clusterApiUrl(WalletAdapterNetwork.Testnet);
      console.log(`[AppWalletProvider] Używam Testnet RPC: ${rpcUrl} (Z ENV: ${testnetRpc ? 'TAK' : 'NIE, fallback'})`);
    } else {
      // Domyślnie, jeśli sieć nie jest rozpoznana, można ustawić np. Mainnet
      // lub rzucić błąd, w zależności od preferencji.
      console.warn(`[AppWalletProvider] Nierozpoznana sieć: ${network}. Używam domyślnego RPC dla Mainnet.`);
      rpcUrl = mainnetRpc || clusterApiUrl(WalletAdapterNetwork.Mainnet);
    }
    
    console.log(`[AppWalletProvider] Finalny endpoint dla sieci ${network}: ${rpcUrl}`);
    return rpcUrl;
  }, [network]); // Zależność tylko od 'network'

  const wallets = useMemo(
    () => [
      new walletAdapterWallets.PhantomWalletAdapter(),
      new walletAdapterWallets.SolflareWalletAdapter(), // Solflare jest popularny
      new walletAdapterWallets.TrustWalletAdapter(),
      new walletAdapterWallets.LedgerWalletAdapter(), // Dla użytkowników Ledger
      // Można dodać więcej portfeli według potrzeb
      // new walletAdapterWallets.SafePalWalletAdapter(),
      // new walletAdapterWallets.TorusWalletAdapter(),
    ],
    [] 
  );

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </NetworkContext.Provider>
  );
};

export default AppWalletProvider;