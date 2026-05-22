import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../../../utils/contract";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const tokenId = parts[parts.length - 1];
    const id = BigInt(tokenId);

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const cred = await contract.getCredential(id);

    if (!cred || cred[5].toString() === "0") {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    const expiresAt = Number(cred[6]);
    const isExpired = expiresAt > 0 && expiresAt < Math.floor(Date.now() / 1000);

    return NextResponse.json({
      tokenId: cred[0].toString(),
      issuer: cred[1],
      recipient: cred[2],
      ipfsHash: cred[3],
      issuedAt: new Date(Number(cred[5]) * 1000).toISOString(),
      expiresAt: expiresAt > 0 ? new Date(expiresAt * 1000).toISOString() : null,
      credentialType: cred[8],
      status: cred[7] ? "REVOKED" : isExpired ? "EXPIRED" : "VALID",
      valid: !cred[7] && !isExpired,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}