import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();
  const { metadata } = body;

  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  console.log("API Key exists:", !!pinataApiKey);
  console.log("Secret Key exists:", !!pinataSecretKey);

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "pinata_api_key": pinataApiKey,
        "pinata_secret_api_key": pinataSecretKey,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: { name: `credential-${Date.now()}` },
      }),
    });

    const data = await response.json();
    console.log("Pinata response:", JSON.stringify(data));
    
    if (!response.ok) throw new Error(JSON.stringify(data));

    return NextResponse.json({ ipfsHash: data.IpfsHash });
  } catch (error) {
    console.log("Full error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}