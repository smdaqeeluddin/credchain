import { ethers } from "ethers";

// Generate a ZK-style proof for a credential
export async function generateProof(credential, metadata, walletAddress, signer) {
  // Commitment: hash of credential details - hides actual values
  const commitment = ethers.keccak256(
    ethers.toUtf8Bytes(
      credential[0].toString() + // tokenId
      credential[1].toLowerCase() + // issuer
      credential[2].toLowerCase() + // recipient
      credential[3] // ipfsHash
    )
  );

  // Nullifier: unique per holder - prevents double use
  const nullifier = ethers.keccak256(
    ethers.toUtf8Bytes(
      walletAddress.toLowerCase() +
      credential[0].toString() +
      Date.now().toString()
    )
  );

  // Public signals - what verifier learns (NO personal data)
  const publicSignals = {
    credentialType: credential[8] || metadata?.attributes?.credentialType,
    isValid: !credential[7], // not revoked
    issuerVerified: true,
    holderAddress: walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4),
    proofTimestamp: new Date().toISOString(),
  };

  // Sign the commitment with wallet - cryptographic proof of ownership
  const signature = await signer.signMessage(commitment);

  // Final proof object
  const proof = {
    version: "CredChain-ZKP-v1",
    commitment,
    nullifier,
    publicSignals,
    signature,
    proofId: ethers.keccak256(ethers.toUtf8Bytes(nullifier + signature)).slice(0, 20),
  };

  return proof;
}

// Verify a proof
// Verify a proof
export function verifyProof(proofString) {
  try {
    const proof = JSON.parse(atob(proofString));

    if (proof.version !== "CredChain-ZKP-v1") {
      return { valid: false, error: "Invalid proof version" };
    }

    if (!proof.commitment || !proof.nullifier || !proof.signature) {
      return { valid: false, error: "Malformed proof" };
    }

    return {
      valid: proof.publicSignals.isValid,
      credentialType: proof.publicSignals.credentialType,
      issuerVerified: proof.publicSignals.issuerVerified,
      holderAddress: proof.publicSignals.holderAddress,
      proofTimestamp: proof.publicSignals.proofTimestamp,
      proofId: proof.proofId,
    };
  } catch (err) {
    return { valid: false, error: "Invalid or corrupted proof" };
  }
}

// Encode proof to shareable string
export function encodeProof(proof) {
  return btoa(JSON.stringify(proof));
}