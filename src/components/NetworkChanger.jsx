// src/components/NetworkChanger.jsx
"use client";

import { useContext } from 'react'; // Upewnij się, że useContext jest zaimportowany
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
// Zaimportuj NetworkContext bezpośrednio
import { NetworkContext } from '../provider/AppWalletProvider'; // Dostosuj ścieżkę, jeśli jest inna

export default function NetworkChanger() {
  // Użyj useContext z NetworkContext
  const { network, setNetwork } = useContext(NetworkContext);

  const handleChange = (event) => {
    const selectedNetwork = event.target.value;
    switch (selectedNetwork) {
      case WalletAdapterNetwork.Mainnet:
        setNetwork(WalletAdapterNetwork.Mainnet);
        break;
      case WalletAdapterNetwork.Devnet:
        setNetwork(WalletAdapterNetwork.Devnet);
        break;
      case WalletAdapterNetwork.Testnet:
        setNetwork(WalletAdapterNetwork.Testnet);
        break;
      default:
        setNetwork(WalletAdapterNetwork.Mainnet); // Domyślnie lub można obsłużyć błąd
        break;
    }
  };

  return (
    <div className="network-changer-container mb-4 flex items-center justify-center">
      <label htmlFor="network-select" className="mr-2 text-sm font-medium text-gray-300">
        Sieć:
      </label>
      <select
        id="network-select"
        value={network}
        onChange={handleChange}
        className="rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value={WalletAdapterNetwork.Mainnet}>Mainnet</option>
        <option value={WalletAdapterNetwork.Devnet}>Devnet</option>
        <option value={WalletAdapterNetwork.Testnet}>Testnet</option>
      </select>
    </div>
  );
}