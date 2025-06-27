// src/components/UserForm.jsx
"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { NetworkContext } from "../provider/AppWalletProvider"; // Zaimportuj NetworkContext
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"; // Import dla typów sieci
import toast from "react-hot-toast";

const UserForm = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [userTokens, setUserTokens] = useState([]);

  // Poprawione użycie NetworkContext
  const { network } = useContext(NetworkContext);

  const fetchBalance = useCallback(async () => {
    if (!connected || !publicKey) {
      setBalance(0);
      return;
    }
    try {
      const balanceLamports = await connection.getBalance(publicKey);
      setBalance(balanceLamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Błąd podczas pobierania salda SOL:", error);
      setBalance(0);
      toast.error("Nie udało się pobrać salda SOL.");
    }
  }, [publicKey, connection, connected]);

  const fetchUserTokens = useCallback(async () => {
    if (!connected || !publicKey) {
      setUserTokens([]);
      return;
    }
    setIsFetching(true);
    toast.loading("Pobieranie tokenów użytkownika...");

    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // Adres programu SPL Token
        }
      );

      const tokens = await Promise.all(
        tokenAccounts.value.map(async (accountInfo) => {
          const mintAddress = accountInfo.account.data.parsed.info.mint;
          const tokenAmount = accountInfo.account.data.parsed.info.tokenAmount;

          // Domyślne wartości
          let tokenName = "Nieznany Token";
          let tokenSymbol = "N/A";
          let tokenIcon = "/placeholder-icon.png"; // Domyślna ikonka placeholder

          try {
            // Próba pobrania metadanych tokena dla nazwy, symbolu i obrazka
            // Ta część wymaga bardziej zaawansowanej logiki do odczytu metadanych z URI (np. z użyciem Umi lub bezpośredniego fetch)
            // Poniżej uproszczony przykład - w rzeczywistości to jest bardziej skomplikowane
            // const metadata = await fetchMetadataForMint(mintAddress, connection); // Funkcja do zaimplementowania
            // if (metadata) {
            //   tokenName = metadata.name || tokenName;
            //   tokenSymbol = metadata.symbol || tokenSymbol;
            //   tokenIcon = metadata.image || tokenIcon;
            // }
            // Na razie ustawiamy tylko to co mamy:
            tokenSymbol = tokenAmount.uiAmountString.length > 5 ? mintAddress.substring(0,4) + '...' : tokenAmount.uiAmountString; // Przykładowy symbol
            tokenName = `Token ${mintAddress.substring(0,6)}...`;


          } catch (metadataError) {
            console.warn(`Nie udało się pobrać metadanych dla mint ${mintAddress}:`, metadataError);
          }

          return {
            address: mintAddress,
            name: tokenName,
            symbol: tokenSymbol,
            amount: tokenAmount.uiAmountString,
            decimals: tokenAmount.decimals,
            icon: tokenIcon,
          };
        })
      );

      setUserTokens(tokens.filter(token => parseFloat(token.amount) > 0)); // Pokaż tylko tokeny z saldem > 0
      toast.dismiss();
      if (tokens.length > 0) {
        toast.success("Tokeny użytkownika pobrane!");
      } else {
        toast.success("Nie znaleziono tokenów (innych niż SOL).");
      }
    } catch (error) {
      console.error("Błąd podczas pobierania tokenów użytkownika:", error);
      setUserTokens([]);
      toast.dismiss();
      toast.error("Nie udało się pobrać tokenów użytkownika.");
    } finally {
      setIsFetching(false);
    }
  }, [publicKey, connection, connected]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
      fetchUserTokens();
    } else {
      setBalance(0);
      setUserTokens([]);
    }
  }, [connected, publicKey, fetchBalance, fetchUserTokens]);

  const getSolscanLink = (address, type = "account") => {
    let clusterParam = "";
    if (network === WalletAdapterNetwork.Devnet) {
      clusterParam = "?cluster=devnet";
    } else if (network === WalletAdapterNetwork.Testnet) {
      clusterParam = "?cluster=testnet";
    }
    // Dla Mainnet Solscan nie wymaga parametru cluster, ale można go dodać dla spójności jeśli mainnet-beta jest akceptowany
    // else if (network === WalletAdapterNetwork.Mainnet) {
    //   clusterParam = "?cluster=mainnet-beta";
    // }
    return `https://solscan.io/${type}/${address}${clusterParam}`;
  };

  if (!connected || !publicKey) {
    return (
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg mx-auto my-10 text-center">
        <p className="text-xl text-red-400">Proszę podłączyć portfel, aby zobaczyć swoje aktywa.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto my-10">
      <h2 className="text-3xl font-bold text-center text-purple-400 mb-6">Moje Aktywa</h2>
      
      <div className="mb-6 p-4 bg-gray-700 rounded-md">
        <h3 className="text-lg font-semibold text-purple-300">Adres Portfela:</h3>
        <a 
          href={getSolscanLink(publicKey.toBase58(), "account")} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-purple-400 hover:text-purple-300 break-all"
        >
          {publicKey.toBase58()}
        </a>
      </div>

      <div className="mb-8 p-4 bg-gray-700 rounded-md">
        <h3 className="text-lg font-semibold text-purple-300">Saldo SOL:</h3>
        <p className="text-2xl text-white">{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} SOL</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-purple-300">Twoje Tokeny:</h3>
        <button
          onClick={() => {
            fetchBalance();
            fetchUserTokens();
          }}
          disabled={isFetching}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md disabled:opacity-50 flex items-center"
        >
          {isFetching ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          )}
          Odśwież
        </button>
      </div>

      {isFetching && userTokens.length === 0 && (
        <p className="text-center text-gray-400">Ładowanie tokenów...</p>
      )}

      {!isFetching && userTokens.length === 0 && (
        <p className="text-center text-gray-400 p-4 bg-gray-700 rounded-md">Nie posiadasz żadnych innych tokenów SPL lub trwa ich ładowanie.</p>
      )}

      {userTokens.length > 0 && (
        <div className="space-y-3">
          {userTokens.map((token) => (
            <div key={token.address} className="bg-gray-700 p-4 rounded-md shadow flex items-center space-x-4">
              <img src={token.icon || "/placeholder-icon.png"} alt={`${token.name} icon`} className="w-10 h-10 rounded-full bg-gray-600 object-cover"/>
              <div className="flex-grow">
                <h4 className="text-md font-semibold text-white">{token.name} ({token.symbol})</h4>
                <a 
                  href={getSolscanLink(token.address, "token")} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 break-all"
                >
                  {token.address}
                </a>
              </div>
              <div className="text-right">
                <p className="text-md font-semibold text-white">{parseFloat(token.amount).toLocaleString(undefined, { minimumFractionDigits: token.decimals, maximumFractionDigits: token.decimals })}</p>
                <p className="text-xs text-gray-400">{token.symbol}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        // Możesz dodać tu specyficzne style dla tego komponentu lub przenieść do globals.css
      `}</style>
    </div>
  );
};

export default UserForm;