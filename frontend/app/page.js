"use client";
import Link from "next/link";
console.log("Contract address:", process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
import { useWallet } from "../context/WalletContext";

export default function Home() {
  const { account, connectWallet, loading } = useWallet();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 text-white px-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-6xl font-extrabold mb-4 tracking-tight">CredChain</h1>
        <p className="text-xl text-blue-200 mb-2">Blockchain-Based Decentralized Credential Verification</p>
        <p className="text-blue-300 mb-10 text-base">
          Issue tamper-proof academic and professional credentials on Ethereum.
          Verify instantly. No intermediaries. No forgery.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: "🎓", title: "Issue", desc: "Universities mint credentials as NFTs on-chain" },
            { icon: "🔒", title: "Own", desc: "Students hold credentials in their own wallet" },
            { icon: "✅", title: "Verify", desc: "Employers verify authenticity in one click" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white/10 backdrop-blur rounded-xl p-6 text-left border border-white/20">
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="font-bold text-lg mb-1">{title}</h3>
              <p className="text-blue-200 text-sm">{desc}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={loading}
              className="bg-white text-blue-900 font-bold px-8 py-3 rounded-xl hover:bg-blue-100 transition text-lg disabled:opacity-50"
            >
              {loading ? "Connecting..." : "Connect MetaMask to Start"}
            </button>
          ) : (
            <>
              <Link href="/dashboard" className="bg-white text-blue-900 font-bold px-8 py-3 rounded-xl hover:bg-blue-100 transition text-lg text-center">
                My Credentials
              </Link>
              <Link href="/verify" className="bg-blue-500 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-400 transition text-lg text-center">
                Verify a Credential
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}