// src/helpers/pinata.js
const pinataSDK = require('@pinata/sdk'); // Jeśli używasz SDK zamiast fetch
const stream = require('stream');

// Odczytujemy klucze BEZ prefiksu NEXT_PUBLIC_
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const NEXT_PUBLIC_PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL; // Ten może pozostać publiczny

if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY || !NEXT_PUBLIC_PINATA_GATEWAY_URL) {
  console.error("[Pinata Helper] Klucz API Pinata, Sekret API (serwerowe) lub URL Bramki nie są skonfigurowane w zmiennych środowiskowych!");
}

// Jeśli używasz SDK:
// const pinata = new pinataSDK(PINATA_API_KEY, PINATA_SECRET_API_KEY);
// Pamiętaj, że moje poprzednie API routes używały `fetch` bezpośrednio.
// Jeśli ten plik helpera nie jest już potrzebny, można go usunąć lub dostosować.

// Przykładowe funkcje (jeśli nadal używasz tego helpera z SDK po stronie serwera)
// Pamiętaj, że API Routes, które Ci podałem, już realizują tę logikę za pomocą `fetch`.

// export const uploadImageToPinata = async (buffer, fileName) => { ... };
// export const uploadJsonToPinata = async (jsonContent, fileName) => { ... };