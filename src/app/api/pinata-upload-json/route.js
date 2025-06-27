// src/app/api/pinata-upload-json/route.js
import { NextResponse } from 'next/server';

// Odczytujemy klucze BEZ prefiksu NEXT_PUBLIC_
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const NEXT_PUBLIC_PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL; // Ten może pozostać publiczny

export async function POST(request) {
  console.log("[API Pinata Upload JSON] Otrzymano żądanie POST...");

  if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY || !NEXT_PUBLIC_PINATA_GATEWAY_URL) {
    console.error("[API Pinata Upload JSON] Zmienne środowiskowe Pinata (serwerowe lub bramka) nie są w pełni skonfigurowane.");
    return NextResponse.json({ success: false, message: "Konfiguracja serwera Pinata jest niekompletna." }, { status: 500 });
  }

  try {
    const jsonData = await request.json();
    const { metadata, fileName } = jsonData;

    if (!metadata || typeof metadata !== 'object' || !fileName) {
      return NextResponse.json({ success: false, message: "Niepoprawne dane wejściowe. Oczekiwano obiektu 'metadata' oraz 'fileName'." }, { status: 400 });
    }
    
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY, // Poprawiona nazwa zmiennej
        'pinata_secret_api_key': PINATA_SECRET_API_KEY, // Poprawiona nazwa zmiennej
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: { name: fileName },
        pinataOptions: { cidVersion: 0 }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[API Pinata Upload JSON] Błąd z API Pinata (status: ${response.status}):`, errorData);
      throw new Error(`Błąd API Pinata: ${response.status} ${response.statusText}. Szczegóły: ${errorData}`);
    }

    const result = await response.json();
    const jsonUrl = `${NEXT_PUBLIC_PINATA_GATEWAY_URL}/${result.IpfsHash}`;
    return NextResponse.json({ success: true, ipfsHash: result.IpfsHash, jsonUrl: jsonUrl }, { status: 200 });

  } catch (error) {
    console.error("[API Pinata Upload JSON] Wewnętrzny błąd serwera:", error);
    return NextResponse.json({ success: false, message: error.message || "Wewnętrzny błąd serwera." }, { status: 500 });
  }
}