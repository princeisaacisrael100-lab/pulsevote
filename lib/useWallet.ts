"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { SEPOLIA_CHAIN_ID } from "@/lib/contract";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask not found.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const chainId = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;
      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch {
          setError("Please switch to Sepolia.");
          setLoading(false);
          return;
        }
      }
      setAddress(accounts[0]);
    } catch {
      setError("Connection rejected.");
    } finally {
      setLoading(false);
    }
  }, []);

  const getProvider = useCallback(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new ethers.providers.Web3Provider(
      window.ethereum as ethers.providers.ExternalProvider
    );
  }, []);

  const getSigner = useCallback(
    () => getProvider()?.getSigner() ?? null,
    [getProvider]
  );

  // Auto-connect and listeners
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    // Check if already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts: any) => {
        if (accounts.length > 0) setAddress(accounts[0]);
      })
      .catch(() => { });

    // Listeners
    const handleAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress(accounts.length > 0 ? accounts[0] : null);
    };
    const handleChain = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccounts);
      window.ethereum?.removeListener("chainChanged", handleChain);
    };
  }, []);

  const short = useMemo(
    () => (address ? address.slice(0, 6) + "..." + address.slice(-4) : null),
    [address]
  );

  return useMemo(
    () => ({ address, short, loading, error, connect, getProvider, getSigner }),
    [address, short, loading, error, connect, getProvider, getSigner]
  );
}

