// src/app/api/pinata-upload/route.js
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

// Odczytujemy klucze BEZ prefiksu NEXT_PUBLIC_ - są dostępne tylko na serwerze
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const NEXT_PUBLIC_PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL; // Ten może pozostać publiczny

async function buffer(readable) {
  // ... (bez zmian)
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(request) {
  console.log("[API Pinata Upload] Otrzymano żądanie POST...");

  if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY || !NEXT_PUBLIC_PINATA_GATEWAY_URL) {
    console.error("[API Pinata Upload] Zmienne środowiskowe Pinata (serwerowe lub bramka) nie są w pełni skonfigurowane.");
    return NextResponse.json({ success: false, message: "Konfiguracja serwera Pinata jest niekompletna." }, { status: 500 });
  }

  try {
    // ... (reszta logiki bez zmian do momentu wywołania fetch) ...
    const formData = await request.formData();
    const file = formData.get('file'); 

    if (!file) {
      return NextResponse.json({ success: false, message: "Nie dostarczono pliku." }, { status: 400 });
    }
    const fileName = file.name || 'token-image';
    const fileBuffer = await buffer(file.stream());
    const pinataFormData = new FormData();
    pinataFormData.append('file', new Blob([fileBuffer]), fileName);
    const pinataMetadata = JSON.stringify({ name: fileName });
    pinataFormData.append('pinataMetadata', pinataMetadata);
    const pinataOptions = JSON.stringify({ cidVersion: 0 });
    pinataFormData.append('pinataOptions', pinataOptions);
    
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        // 'Content-Type': 'multipart/form-data' jest ustawiane automatycznie przez fetch z FormData
        'pinata_api_key': PINATA_API_KEY, // Poprawiona nazwa zmiennej
        'pinata_secret_api_key': PINATA_SECRET_API_KEY, // Poprawiona nazwa zmiennej
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[API Pinata Upload] Błąd z API Pinata (status: ${response.status}):`, errorData);
      throw new Error(`Błąd API Pinata: ${response.status} ${response.statusText}. Szczegóły: ${errorData}`);
    }

    const result = await response.json();
    const imageUrl = `${NEXT_PUBLIC_PINATA_GATEWAY_URL}/${result.IpfsHash}`;
    return NextResponse.json({ success: true, ipfsHash: result.IpfsHash, imageUrl: imageUrl }, { status: 200 });

  } catch (error) {
    console.error("[API Pinata Upload] Wewnętrzny błąd serwera:", error);
    return NextResponse.json({ success: false, message: error.message || "Wewnętrzny błąd serwera." }, { status: 500 });
  }
}