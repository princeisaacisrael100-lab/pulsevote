"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, Poll, STATUS } from "@/lib/contract";

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const getContract = useCallback(
    (sp: ethers.Signer | ethers.providers.Provider) =>
      new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, sp), []);

  const loadPolls = useCallback(async (
    provider: ethers.providers.Web3Provider,
    walletAddress: string | null,
    statusFilter?: number
  ) => {
    setLoading(true); setError(null);
    try {
      const contract = getContract(provider);
      if (walletAddress) {
        const admin = await contract.isOwnerAddress(walletAddress);
        setIsAdmin(admin);
      }

      const total = (await contract.totalPolls()).toNumber();
      if (total === 0) { setPolls([]); setLoading(false); return; }

      const loaded: Poll[] = [];
      for (let i = 0; i < total; i++) {
        try {
          const [question, options, votes, creator, createdAt, expiresAt,
                 status, category, fireCount, likeCount, mindBlownCount] =
            await contract.getPoll(i);

          const s = Number(status);
          // skip deleted always; if filter set skip non-matching
          if (s === STATUS.DELETED) continue;
          if (statusFilter !== undefined && s !== statusFilter) continue;

          const voted = walletAddress ? await contract.didVote(i, walletAddress) : false;
          const reacted = walletAddress ? await contract.didReact(i, walletAddress) : false;
          const isCreator = walletAddress
            ? creator.toLowerCase() === walletAddress.toLowerCase() : false;

          loaded.push({
            id: i, question,
            options: [...options],
            votes: (votes as ethers.BigNumber[]).map(v => v.toNumber()),
            creator, createdAt: Number(createdAt), expiresAt: Number(expiresAt),
            status: s, category: Number(category),
            fireCount: Number(fireCount), likeCount: Number(likeCount),
            mindBlownCount: Number(mindBlownCount),
            voted, reacted, isCreator,
          });
        } catch { continue; }
      }
      setPolls(loaded);
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : String(e)).slice(0, 120));
    } finally { setLoading(false); }
  }, [getContract]);

  const submitPoll = useCallback(async (
    signer: ethers.Signer, question: string,
    options: string[], expiresAt: number, category: number
  ) => {
    const tx = await getContract(signer).submitPoll(question, options, expiresAt, category);
    await tx.wait();
  }, [getContract]);

  const castVote = useCallback(async (signer: ethers.Signer, id: number, option: number): Promise<string> => {
    const tx = await getContract(signer).vote(id, option);
    await tx.wait(); return tx.hash;
  }, [getContract]);

  const sendReaction = useCallback(async (signer: ethers.Signer, id: number, type: number) => {
    const tx = await getContract(signer).react(id, type);
    await tx.wait();
  }, [getContract]);

  const approvePoll = useCallback(async (signer: ethers.Signer, id: number) => {
    const tx = await getContract(signer).approvePoll(id); await tx.wait();
  }, [getContract]);

  const rejectPoll = useCallback(async (signer: ethers.Signer, id: number) => {
    const tx = await getContract(signer).rejectPoll(id); await tx.wait();
  }, [getContract]);

  const closePoll = useCallback(async (signer: ethers.Signer, id: number, asAdmin = false) => {
    const fn = asAdmin ? "adminClosePoll" : "closePoll";
    const tx = await getContract(signer)[fn](id); await tx.wait();
  }, [getContract]);

  const deletePoll = useCallback(async (signer: ethers.Signer, id: number, asAdmin = false) => {
    const fn = asAdmin ? "adminDeletePoll" : "deletePoll";
    const tx = await getContract(signer)[fn](id); await tx.wait();
  }, [getContract]);

  return {
    polls, loading, error, isAdmin,
    loadPolls, submitPoll, castVote, sendReaction,
    approvePoll, rejectPoll, closePoll, deletePoll,
  };
}
