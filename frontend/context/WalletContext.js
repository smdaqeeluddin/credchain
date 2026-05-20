"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contract";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isIssuer, setIsIssuer] = useState(false);
  const [issuerName, setIssuerName] = useState("");
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask from https://metamask.io");
      return;
    }
    setLoading(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();
      const credContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const issuerStatus = await credContract.approvedIssuers(accounts[0]);
      const name = issuerStatus ? await credContract.issuerNames(accounts[0]) : "";

      setAccount(accounts[0]);
      setProvider(web3Provider);
      setContract(credContract);
      setIsIssuer(issuerStatus);
      setIssuerName(name);
    } catch (err) {
      console.error("Connection failed:", err);
      alert("Failed to connect. Make sure MetaMask is on Sepolia network.");
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    setIsIssuer(false);
    setIssuerName("");
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) disconnectWallet();
        else connectWallet();
      });
    }
  }, []);

  return (
    <WalletContext.Provider value={{
      account, provider, contract, isIssuer, issuerName, loading,
      connectWallet, disconnectWallet,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);