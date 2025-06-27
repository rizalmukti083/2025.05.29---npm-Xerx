// src/components/TokenForm.jsx
"use client";
import { useState, useEffect, useContext } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createUmi as umiCreateUmi } from "@metaplex-foundation/umi-bundle-defaults"; // Zmieniono nazwę importu, aby uniknąć konfliktu
import { walletAdapterIdentity as umiWalletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata as umiMplTokenMetadataPlugin } from "@metaplex-foundation/mpl-token-metadata";

// Importujemy całe moduły, aby sprawdzić dostępność funkcji
import * as mplToolbox from "@metaplex-foundation/mpl-toolbox";
import * as umiLib from "@metaplex-foundation/umi"; // Dla generateSigner, percentAmount, publicKey, none, etc.

import toast from "react-hot-toast";
import { NetworkContext } from "../provider/AppWalletProvider";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UilInfoCircle } from "@iconscout/react-unicons";

const TokenForm = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey: walletPublicKey } = wallet;
  const { network } = useContext(NetworkContext);

  const [umi, setUmi] = useState(null); // umi będzie instancją Umi

  const initialFormData = {
    name: "",
    symbol: "",
    description: "",
    decimals: 9,
    amount: 0,
    imageFile: null,
    websiteUrl: "",
    twitterUrl: "",
    telegramUrl: "",
    discordUrl: "",
    youtubeUrl: "",
    mediumUrl: "",
    githubUrl: "",
    instagramUrl: "",
    redditUrl: "",
    facebookUrl: "",
    revokeMintAuthority: true,
    revokeFreezeAuthority: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdTokenAddress, setCreatedTokenAddress] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (connection && walletPublicKey && wallet.connected) {
      console.log("[TokenForm] Inicjalizacja Umi z endpointem:", connection.rpcEndpoint);
      const newUmiInstance = umiCreateUmi(connection.rpcEndpoint)
        .use(umiWalletAdapterIdentity(wallet))
        .use(umiMplTokenMetadataPlugin());
      setUmi(newUmiInstance);
      console.log("[TokenForm] Umi zainicjalizowane.");
    } else {
      setUmi(null);
      console.log("[TokenForm] Warunki do inicjalizacji Umi nie są spełnione.", {
        connection: !!connection,
        walletPublicKey: !!walletPublicKey,
        connected: wallet.connected,
      });
    }
  }, [connection, walletPublicKey, wallet, wallet.connected]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Nazwa tokenu jest wymagana.";
    if (!formData.symbol.trim()) errors.symbol = "Symbol tokenu jest wymagany.";
    else if (formData.symbol.trim().length > 10) errors.symbol = "Symbol nie może przekraczać 10 znaków.";
    if (!formData.description.trim()) errors.description = "Opis tokenu jest wymagany.";
    if (formData.decimals === null || formData.decimals < 0 || formData.decimals > 9) errors.decimals = "Liczba miejsc dziesiętnych musi być między 0 a 9.";
    if (formData.amount === null || formData.amount <= 0) errors.amount = "Liczba tokenów musi być większa od 0.";
    if (!formData.imageFile) errors.imageFile = "Obrazek tokenu jest wymagany.";
    
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (formData.websiteUrl && !urlPattern.test(formData.websiteUrl)) errors.websiteUrl = "Niepoprawny URL strony.";
    if (formData.twitterUrl && !urlPattern.test(formData.twitterUrl)) errors.twitterUrl = "Niepoprawny URL Twittera.";
    if (formData.telegramUrl && !urlPattern.test(formData.telegramUrl)) errors.telegramUrl = "Niepoprawny URL Telegrama.";
    if (formData.discordUrl && !urlPattern.test(formData.discordUrl)) errors.discordUrl = "Niepoprawny URL Discorda.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    if (type === "file") {
      const file = files && files[0];
      if (file) {
        setFormData((prev) => ({ ...prev, imageFile: file }));
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setFormData((prev) => ({ ...prev, imageFile: null }));
        setImagePreview("");
      }
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : parseFloat(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const createToken = async (event) => {
    event.preventDefault();
    console.log("[TokenForm] Inicjacja createToken. Aktualny stan formData:", formData);
    if (!validateForm()) {
      toast.error("Proszę poprawić błędy w formularzu.");
      console.log("[TokenForm] Walidacja formularza nie powiodła się. Błędy:", formErrors);
      return;
    }

    if (!umi) {
      toast.error("UMI nie jest zainicjalizowane. Proszę podłączyć portfel i odświeżyć, jeśli problem się powtarza.");
      console.error("[TokenForm] Próba stworzenia tokenu bez zainicjalizowanego UMI.");
      return;
    }
    if (!walletPublicKey) {
      toast.error("Portfel nie jest połączony.");
      console.error("[TokenForm] Próba stworzenia tokenu bez połączonego portfela.");
      return;
    }

    setIsLoading(true);
    setCreatedTokenAddress(null);
    toast.loading("Rozpoczynanie procesu tworzenia tokenu...");

    let imageUrl = "";
    let metadataUrl = "";

    try {
      toast.dismiss(); toast.loading("Przesyłanie obrazka na IPFS (Pinata)...");
      const imageApiFormData = new FormData();
      imageApiFormData.append("file", formData.imageFile);
      const imageUploadResponse = await fetch("/api/pinata-upload", { method: "POST", body: imageApiFormData });
      if (!imageUploadResponse.ok) throw new Error((await imageUploadResponse.json()).message || "Błąd uploadu obrazka");
      const imageUploadResult = await imageUploadResponse.json();
      imageUrl = imageUploadResult.imageUrl;
      console.log("[TokenForm] Obrazek przesłany na Pinatę:", imageUrl);
      toast.dismiss(); toast.success("Obrazek przesłany!");

      toast.loading("Przygotowywanie metadanych tokenu...");
      const tokenMetadataObject = {
        name: formData.name.trim(),
        symbol: formData.symbol.trim(),
        description: formData.description.trim(),
        image: imageUrl,
        external_url: formData.websiteUrl.trim() || undefined,
        attributes: [], 
        properties: {
          files: [{ uri: imageUrl, type: formData.imageFile?.type || "image/png" }],
          category: "image",
        },
        extensions: {
          website: formData.websiteUrl.trim() || undefined,
          twitter: formData.twitterUrl.trim() || undefined,
          telegram: formData.telegramUrl.trim() || undefined,
          // ... (pozostałe linki)
          discord: formData.discordUrl.trim() || undefined,
          youtube: formData.youtubeUrl.trim() || undefined,
          medium: formData.mediumUrl.trim() || undefined,
          github: formData.githubUrl.trim() || undefined,
          instagram: formData.instagramUrl.trim() || undefined,
          reddit: formData.redditUrl.trim() || undefined,
          facebook: formData.facebookUrl.trim() || undefined,
        },
      };
      Object.keys(tokenMetadataObject.extensions).forEach(key => {
        if (tokenMetadataObject.extensions[key] === undefined) {
          delete tokenMetadataObject.extensions[key];
        }
      });
      if (Object.keys(tokenMetadataObject.extensions).length === 0) {
        delete tokenMetadataObject.extensions;
      }
      console.log("[TokenForm] Przygotowany obiekt metadanych:", tokenMetadataObject);
      toast.dismiss(); toast.success("Metadane przygotowane!");

      toast.loading("Przesyłanie metadanych JSON na IPFS (Pinata)...");
      const jsonUploadResponse = await fetch("/api/pinata-upload-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: tokenMetadataObject, fileName: `${formData.symbol.trim()}_metadata.json` }),
      });
      if (!jsonUploadResponse.ok) throw new Error((await jsonUploadResponse.json()).message || "Błąd uploadu JSON");
      const jsonUploadResult = await jsonUploadResponse.json();
      metadataUrl = jsonUploadResult.jsonUrl;
      console.log("[TokenForm] Metadane JSON przesłane na Pinatę:", metadataUrl);
      toast.dismiss(); toast.success("Metadane JSON przesłane!");

      toast.loading("Przygotowywanie transakcji blockchain...");
      const mint = umiLib.generateSigner(umi); // Używamy umiLib.generateSigner
      console.log(`[TokenForm] Adres Mint generowanego tokenu: ${mint.publicKey.toString()}`);

      let transactionBuilder = new umiLib.TransactionBuilder(); // Używamy umiLib.TransactionBuilder

      transactionBuilder = transactionBuilder.add(
        mplToolbox.createFungible(umi, { // Używamy mplToolbox.createFungible
          mint: mint,
          name: tokenMetadataObject.name,
          symbol: tokenMetadataObject.symbol,
          uri: metadataUrl,
          sellerFeeBasisPoints: umiLib.percentAmount(0), // Używamy umiLib.percentAmount
          isMutable: true, 
          decimals: Number(formData.decimals),
        })
      );
      console.log("[TokenForm] Dodano instrukcję createFungible.");

      if (formData.amount > 0) {
        const amountToMint = BigInt(formData.amount) * BigInt(10 ** Number(formData.decimals));
        transactionBuilder = transactionBuilder.add(
          mplToolbox.mintTokens(umi, { // Używamy mplToolbox.mintTokens
            mint: mint.publicKey,
            amount: amountToMint, 
            tokenOwner: umi.identity.publicKey, 
          })
        );
        console.log("[TokenForm] Dodano instrukcję mintTokens.");
      }
      
      if (formData.revokeMintAuthority) {
        transactionBuilder = transactionBuilder.add(
          mplToolbox.setAuthority(umi, { // Używamy mplToolbox.setAuthority
            account: mint.publicKey,
            currentAuthority: umi.identity, 
            authorityType: mplToolbox.TokenAuthorityType.MintTokens, // Używamy mplToolbox.TokenAuthorityType
            newAuthority: umiLib.none(), // Używamy umiLib.none()
          })
        );
        console.log("[TokenForm] Dodano instrukcję unieważnienia Mint Authority.");
      }

      if (formData.revokeFreezeAuthority) {
        transactionBuilder = transactionBuilder.add(
          mplToolbox.setAuthority(umi, { // Używamy mplToolbox.setAuthority
            account: mint.publicKey,
            currentAuthority: umi.identity, 
            authorityType: mplToolbox.TokenAuthorityType.FreezeAccount, // Używamy mplToolbox.TokenAuthorityType
            newAuthority: umiLib.none(), // Używamy umiLib.none()
          })
        );
        console.log("[TokenForm] Dodano instrukcję unieważnienia Freeze Authority.");
      }
      
      toast.dismiss(); toast.loading("Wysyłanie transakcji na blockchain...");
      console.log("[TokenForm] Próba wysłania zbudowanej transakcji...");
      
      const { signature } = await transactionBuilder.sendAndConfirm(umi, {
        confirm: { commitment: "finalized" },
      });

      if (!signature) {
           throw new Error("Nie udało się potwierdzić transakcji na blockchainie. Brak sygnatury.");
      }
      
      const signatureString = umi.transactions.coder.bs58.encode(signature);
      console.log(`[TokenForm] Transakcja pomyślna! Sygnatura: ${signatureString}`);
      
      toast.dismiss();
      setCreatedTokenAddress(mint.publicKey.toString());
      toast.success(`Token ${formData.name} (${formData.symbol}) pomyślnie stworzony i skonfigurowany!`);
      console.log("[TokenForm] Cały proces tworzenia tokenu zakończony sukcesem.");

    } catch (error) {
      console.error("[TokenForm] Błąd podczas tworzenia tokenu:", error);
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Błąd: ${errorMessage || "Nieznany błąd podczas tworzenia tokenu."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getSolscanCluster = () => {
    if (network === WalletAdapterNetwork.Mainnet) return "mainnet-beta";
    if (network === WalletAdapterNetwork.Devnet) return "devnet";
    if (network === WalletAdapterNetwork.Testnet) return "testnet";
    return "mainnet-beta";
  };

  const socialFields = [
    { name: "websiteUrl", label: "Website", placeholder: "https://twojastrona.com" },
    { name: "twitterUrl", label: "Twitter/X", placeholder: "https://twitter.com/profil" },
    { name: "telegramUrl", label: "Telegram", placeholder: "https://t.me/grupa" },
    { name: "discordUrl", label: "Discord", placeholder: "https://discord.gg/serwer" },
    { name: "youtubeUrl", label: "YouTube", placeholder: "https://youtube.com/kanal" },
    { name: "mediumUrl", label: "Medium", placeholder: "https://medium.com/@profil" },
    { name: "githubUrl", label: "Github", placeholder: "https://github.com/projekt" },
    { name: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/profil" },
    { name: "redditUrl", label: "Reddit", placeholder: "https://reddit.com/r/sub" },
    { name: "facebookUrl", label: "Facebook", placeholder: "https://facebook.com/strona" },
  ];

  return (
    <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto my-10">
      <h2 className="text-3xl font-bold text-center text-purple-400 mb-8">Stwórz Zaawansowany Token SPL</h2>
      {!wallet.connected || !walletPublicKey ? (
        <div className="text-center py-10"><p className="text-xl text-red-400">Proszę podłączyć portfel, aby kontynuować.</p></div>
      ) : (
        <form onSubmit={createToken} className="space-y-6">
          <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-lg font-semibold text-purple-300 px-2">Podstawowe Informacje</legend>
            <div className="space-y-4 mt-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nazwa Tokenu</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="input-primary" placeholder="Np. Mój Super Token" />
                {formErrors.name && <p className="error-text">{formErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-300">Symbol Tokenu</label>
                <input type="text" name="symbol" id="symbol" value={formData.symbol} onChange={handleChange} required maxLength={10} className="input-primary" placeholder="Np. MST" />
                {formErrors.symbol && <p className="error-text">{formErrors.symbol}</p>}
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">Opis Tokenu</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={3} className="input-primary" placeholder="Opisz swój token"></textarea>
                {formErrors.description && <p className="error-text">{formErrors.description}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="decimals" className="block text-sm font-medium text-gray-300">Miejsca Dziesiętne</label>
                  <input type="number" name="decimals" id="decimals" value={formData.decimals} onChange={handleChange} required min="0" max="9" className="input-primary" />
                  {formErrors.decimals && <p className="error-text">{formErrors.decimals}</p>}
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Liczba Tokenów (Podaż)</label>
                  <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required min="1" className="input-primary" />
                  {formErrors.amount && <p className="error-text">{formErrors.amount}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="imageFile" className="block text-sm font-medium text-gray-300">Obrazek Tokenu (Logo)</label>
                <input type="file" name="imageFile" id="imageFile" onChange={handleChange} required accept="image/png, image/jpeg, image/gif, image/svg+xml"
                       className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600" />
                {formErrors.imageFile && <p className="error-text">{formErrors.imageFile}</p>}
                {imagePreview && <div className="mt-4"><img src={imagePreview} alt="Podgląd" className="h-32 w-32 object-cover rounded-md shadow-lg mx-auto" /></div>}
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-lg font-semibold text-purple-300 px-2">Linki Społecznościowe (Opcjonalne)</legend>
            <div className="space-y-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {socialFields.map(field => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-300">{field.label}</label>
                  <input type="url" name={field.name} id={field.name} value={formData[field.name]} onChange={handleChange} className="input-primary" placeholder={field.placeholder} />
                  {formErrors[field.name] && <p className="error-text">{formErrors[field.name]}</p>}
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-lg font-semibold text-purple-300 px-2">Dodatkowe Ustawienia</legend>
            <div className="space-y-4 mt-2">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input id="revokeMintAuthority" name="revokeMintAuthority" type="checkbox" checked={formData.revokeMintAuthority} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-purple-600 focus:ring-purple-500" />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor="revokeMintAuthority" className="font-medium text-gray-300">Unieważnij Autorytet Mintowania</label>
                  <p className="text-xs text-gray-400 flex items-center">
                    <UilInfoCircle className="w-4 h-4 mr-1 text-blue-400 flex-shrink-0" />
                    <span>Zalecane! Uniemożliwia tworzenie nowych tokenów, zwiększając zaufanie.</span>
                  </p>
                </div>
              </div>
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input id="revokeFreezeAuthority" name="revokeFreezeAuthority" type="checkbox" checked={formData.revokeFreezeAuthority} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-purple-600 focus:ring-purple-500" />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor="revokeFreezeAuthority" className="font-medium text-gray-300">Unieważnij Autorytet Zamrażania</label>
                  <p className="text-xs text-gray-400 flex items-center">
                    <UilInfoCircle className="w-4 h-4 mr-1 text-blue-400 flex-shrink-0" />
                    <span>Zalecane! Uniemożliwia blokowanie tokenów na kontach, czyniąc token bezpieczniejszym.</span>
                  </p>
                </div>
              </div>
            </div>
          </fieldset>

          <div>
            <button type="submit" disabled={isLoading || !umi} 
                    className="w-full flex justify-center py-3 px-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? "Przetwarzanie..." : "Stwórz Token i Zastosuj Ustawienia"}
            </button>
          </div>

          {createdTokenAddress && (
            <div className="mt-6 p-4 bg-gray-700 rounded-md">
              <h3 className="text-lg font-semibold text-green-400">Token Stworzony Pomyślnie!</h3>
              <p className="text-sm text-gray-300 mt-1">Adres Mint: <a href={`https://solscan.io/token/${createdTokenAddress}${getSolscanCluster()}`} target="_blank" rel="noopener noreferrer" className="link-accent break-all">{createdTokenAddress}</a></p>
              <p className="text-xs text-gray-400 mt-3">Propagacja metadanych może zająć chwilę. Może być konieczna <a href={`https://solscan.io/token/update?token=${createdTokenAddress}&cluster=${getSolscanCluster().substring(1)}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-300">ręczna aktualizacja na Solscan</a>.</p>
            </div>
          )}
        </form>
      )}
      <style jsx>{`
        .input-primary {
          margin-top: 0.25rem; display: block; width: 100%;
          background-color: #374151; border-width: 1px; border-color: #4B5563; color: white;
          border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          padding: 0.75rem; font-size: 0.875rem;
        }
        .input-primary:focus {
          outline: 2px solid transparent; outline-offset: 2px;
          border-color: #8B5CF6; 
          box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.4);
        }
        .error-text { color: #EF4444; font-size: 0.75rem; margin-top: 0.25rem; }
        .btn-primary {
          border: 1px solid transparent; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          font-size: 0.875rem; font-weight: 500; color: white;
          background-image: linear-gradient(to right, #8B5CF6, #6366F1);
        }
        .btn-primary:hover { background-image: linear-gradient(to right, #7C3AED, #4F46E5); }
        .btn-primary:disabled { background-image: none; background-color: #4B5563; }
        .link-accent { color: #A78BFA; }
        .link-accent:hover { color: #C4B5FD; }
      `}</style>
    </div>
  );
};

export default TokenForm;