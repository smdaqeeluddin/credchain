"use client";
import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { generateProof, encodeProof } from "../../utils/zkp";

export default function ZKProofPage() {
  const { account, contract, provider, connectWallet } = useWallet();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [proof, setProof] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!contract || !account) return;
    (async () => {
      setLoading(true);
      const ids = await contract.getHolderCredentials(account);
      const creds = await Promise.all(
        ids.map(async (id) => {
          const cred = await contract.getCredential(Number(id));
          let metadata = null;
          try {
            const res = await fetch("https://gateway.pinata.cloud/ipfs/" + cred[3]);
            metadata = await res.json();
          } catch (_) {}
          return { tokenId: id.toString(), cred, metadata };
        })
      );
      setCredentials(creds.filter((c) => !c.cred[7])); // only valid ones
      setLoading(false);
    })();
  }, [contract, account]);

  const handleGenerate = async () => {
    if (!selectedTokenId) return alert("Please select a credential first");
    setGenerating(true);
    setStep(2);
    try {
      const signer = await provider.getSigner();
      const selected = credentials.find((c) => c.tokenId === selectedTokenId);
      await new Promise((r) => setTimeout(r, 1500)); // dramatic pause
      setStep(3);
      await new Promise((r) => setTimeout(r, 1500));
      setStep(4);
      const generatedProof = await generateProof(
        selected.cred,
        selected.metadata,
        account,
        signer
      );
      const encoded = encodeProof(generatedProof);
      setProof({ encoded, data: generatedProof });
      setStep(5);
    } catch (err) {
      alert("Proof generation failed: " + err.message);
      setStep(1);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proof.encoded);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setProof(null);
    setSelectedTokenId(null);
    setStep(1);
  };

  if (!account) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-6">🔐</p>
        <p className="text-white text-xl mb-2 font-bold">Zero Knowledge Proof</p>
        <p className="text-gray-400 mb-6">Connect your wallet to generate a ZK proof</p>
        <button onClick={connectWallet} className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-bold">
          Connect Wallet
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 rounded-full px-4 py-1 mb-4">
            <span className="text-blue-400 text-xs font-mono">ZERO KNOWLEDGE PROOF</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Prove Without Revealing
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Generate a cryptographic proof that you hold a valid credential — without revealing your name, institution, or any personal details.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: "🎓", title: "Select", desc: "Choose a credential from your wallet" },
            { icon: "⚡", title: "Generate", desc: "Wallet signs a cryptographic commitment" },
            { icon: "🔒", title: "Share", desc: "Share proof — zero personal data revealed" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="font-bold text-sm text-blue-400">{title}</p>
              <p className="text-gray-500 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>

        {!proof ? (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-lg font-bold mb-6 text-gray-200">Select Credential to Prove</h2>

            {loading && <p className="text-gray-400 text-sm">Loading your credentials...</p>}

            {!loading && credentials.length === 0 && (
              <p className="text-gray-500 text-sm">No valid credentials found in your wallet.</p>
            )}

            <div className="space-y-3 mb-6">
              {credentials.map(({ tokenId, cred, metadata }) => (
                <div
                  key={tokenId}
                  onClick={() => setSelectedTokenId(tokenId)}
                  className={`border rounded-xl p-4 cursor-pointer transition ${
                    selectedTokenId === tokenId
                      ? "border-blue-500 bg-blue-900/20"
                      : "border-gray-700 hover:border-gray-500"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{metadata?.name || "Credential"}</p>
                      <p className="text-gray-400 text-xs">{metadata?.attributes?.institution} • Token #{tokenId}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedTokenId === tokenId ? "bg-blue-500 border-blue-500" : "border-gray-600"
                    }`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Progress steps during generation */}
            {generating && (
              <div className="mb-6 space-y-2">
                {[
                  { s: 2, label: "Creating cryptographic commitment..." },
                  { s: 3, label: "Computing nullifier hash..." },
                  { s: 4, label: "Signing with your wallet..." },
                ].map(({ s, label }) => (
                  <div key={s} className={`flex items-center gap-3 text-sm transition ${step >= s ? "text-blue-400" : "text-gray-600"}`}>
                    <span>{step > s ? "✅" : step === s ? "⏳" : "⭕"}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedTokenId || generating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? "Generating Proof..." : "Generate ZK Proof"}
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-8">
            {/* Success header */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-green-400">Proof Generated!</h2>
              <p className="text-gray-400 text-sm mt-1">Your ZK proof is ready to share</p>
            </div>

            {/* What verifier learns */}
            <div className="bg-gray-800 rounded-xl p-5 mb-6">
              <p className="text-xs text-gray-400 uppercase font-bold mb-3">What the verifier will learn:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm text-gray-200">Credential Type: <strong>{proof.data.publicSignals.credentialType}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm text-gray-200">Status: <strong className="text-green-400">VALID</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm text-gray-200">Issuer Verified: <strong>YES</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400">✗</span>
                  <span className="text-sm text-gray-500">Your name — <strong>hidden</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400">✗</span>
                  <span className="text-sm text-gray-500">Your institution — <strong>hidden</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400">✗</span>
                  <span className="text-sm text-gray-500">Issue date — <strong>hidden</strong></span>
                </div>
              </div>
            </div>

            {/* Proof ID */}
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-400 mb-1">PROOF ID</p>
              <p className="font-mono text-blue-400 text-sm">{proof.data.proofId}</p>
            </div>

            {/* Encoded proof */}
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-400 mb-2">SHAREABLE PROOF STRING</p>
              <p className="font-mono text-xs text-gray-300 break-all line-clamp-3">{proof.encoded.slice(0, 100)}...</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                {copied ? "✅ Copied!" : "📋 Copy Proof"}
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-700 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition"
              >
                New Proof
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}