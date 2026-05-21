"use client";
import Link from "next/link";
import { useWallet } from "../context/WalletContext";

export default function Navbar() {
  const { account, isIssuer, issuerName, connectWallet, disconnectWallet, loading } = useWallet();

  return (
    <nav className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-2xl font-bold tracking-tight">CredChain</Link>
        <Link href="/verify" className="hover:text-blue-300 transition">Verify</Link>
<Link href="/zkproof" className="hover:text-purple-300 transition">🔐 ZK Proof</Link>
        {account && (
          <>
            <Link href="/dashboard" className="hover:text-blue-300 transition">My Credentials</Link>
            {isIssuer && (
              <Link href="/issuer" className="hover:text-green-300 transition font-semibold">
                Issue Credential
              </Link>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {account ? (
          <>
            {isIssuer && (
              <span className="bg-green-600 text-xs px-2 py-1 rounded-full">
                Issuer: {issuerName}
              </span>
            )}
            <span className="text-blue-300 text-sm font-mono">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button
              onClick={disconnectWallet}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={connectWallet}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded font-semibold transition disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect MetaMask"}
          </button>
        )}
      </div>
    </nav>
  );
}