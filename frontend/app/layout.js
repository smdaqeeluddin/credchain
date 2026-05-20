import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "../context/WalletContext";
import Navbar from "../components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CredChain | Blockchain Credential Verification",
  description: "Tamper-proof digital credentials on Ethereum",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <Navbar />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}