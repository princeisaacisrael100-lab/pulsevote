"use client";
import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/lib/useWallet";
import { usePolls } from "@/lib/usePolls";
import { Poll, CATEGORIES, CATEGORY_ICONS, STATUS, CONTRACT_ADDRESS } from "@/lib/contract";
import Navbar from "@/components/Navbar";
import PollCard from "@/components/PollCard";
import VoteModal from "@/components/VoteModal";
import SubmitPollModal from "@/components/SubmitPollModal";
import Toast from "@/components/Toast";
import styles from "./page.module.css";

type FilterTab = "all" | "live" | "closed" | "my";
type ToastState = { msg: string; type: "success"|"error"|"info" } | null;

export default function Home() {
  const wallet = useWallet();
  const {
    polls,
    loading,
    error,
    isAdmin,
    loadPolls,
    submitPoll,
    castVote,
    sendReaction,
    approvePoll,
    rejectPoll,
    closePoll,
    deletePoll,
  } = usePolls();

  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [catFilter, setCatFilter] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") =>
    setToast({ msg, type });
  const clearToast = useCallback(() => setToast(null), []);

  const refresh = useCallback(
    async (addr: string | null) => {
      const p = wallet.getProvider();
      if (p) await loadPolls(p, addr); // Load all polls
    },
    [wallet, loadPolls]
  );

  // Load polls on mount or when address changes
  useEffect(() => {
    const p = wallet.getProvider();
    if (p) {
      loadPolls(p, wallet.address); // Load all polls
    }
  }, [wallet.address, wallet.getProvider, loadPolls]);

  const handleConnect = async () => {
    await wallet.connect();
    if (wallet.address) {
      showToast("Wallet connected!", "success");
    }
  };

  const handleVote = (pollId: number) => {
    if (!wallet.address) {
      showToast("Connect your wallet to vote.", "error");
      return;
    }
    const poll = polls.find((p) => p.id === pollId);
    if (poll) setActivePoll(poll);
  };

  const handleSubmitVote = async (optionIndex: number): Promise<string> => {
    const signer = wallet.getSigner();
    if (!signer || !activePoll) throw new Error("No signer");
    const hash = await castVote(signer, activePoll.id, optionIndex);
    showToast("Vote recorded on-chain! ✓", "success");
    await refresh(wallet.address);
    return hash;
  };

  const handleReact = async (pollId: number, type: number) => {
    const signer = wallet.getSigner();
    if (!signer) {
      showToast("Connect your wallet first.", "error");
      return;
    }
    try {
      await sendReaction(signer, pollId, type);
      showToast("Reaction added!", "success");
      await refresh(wallet.address);
    } catch {
      showToast("Could not add reaction.", "error");
    }
  };

  const handleSubmitPoll = async (
    question: string,
    options: string[],
    expiresAt: number,
    category: number
  ) => {
    const signer = wallet.getSigner();
    if (!signer) throw new Error("Connect wallet first");
    await submitPoll(signer, question, options, expiresAt, category);
    showToast("Poll submitted for admin review!", "success");
    await refresh(wallet.address);
  };

  const handleApprove = async (pollId: number) => {
    const signer = wallet.getSigner();
    if (!signer) return;
    try {
      await approvePoll(signer, pollId);
      showToast("Poll approved!", "success");
      await refresh(wallet.address);
    } catch {
      showToast("Failed to approve.", "error");
    }
  };

  const handleReject = async (pollId: number) => {
    const signer = wallet.getSigner();
    if (!signer) return;
    try {
      await rejectPoll(signer, pollId);
      showToast("Poll rejected.", "success");
      await refresh(wallet.address);
    } catch {
      showToast("Failed to reject.", "error");
    }
  };

  const handleClose = async (pollId: number, asAdmin: boolean) => {
    const signer = wallet.getSigner();
    if (!signer) return;
    try {
      await closePoll(signer, pollId, asAdmin);
      showToast("Poll closed.", "success");
      await refresh(wallet.address);
    } catch {
      showToast("Only the poll creator can close this.", "error");
    }
  };

  const handleDelete = async (pollId: number, asAdmin: boolean) => {
    if (!confirm("Permanently delete this poll?")) return;
    const signer = wallet.getSigner();
    if (!signer) return;
    try {
      await deletePoll(signer, pollId, asAdmin);
      showToast("Poll deleted.", "success");
      await refresh(wallet.address);
    } catch {
      showToast("Only the poll creator can delete this.", "error");
    }
  };

  // Filtering
  const filtered = polls.filter((p) => {
    const isExpired = p.expiresAt > 0 && Date.now() / 1000 > p.expiresAt;
    const isLive = p.status === STATUS.ACTIVE && !isExpired;
    const isClosed = p.status === STATUS.CLOSED || isExpired;

    if (filter === "live" && !isLive) return false;
    if (filter === "closed" && !isClosed) return false;
    if (filter === "my" && !p.isCreator) return false;

    if (catFilter !== null && p.category !== catFilter) return false;
    if (search && !p.question.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const totalVotes = polls.reduce(
    (s, p) => s + p.votes.reduce((a, b) => a + b, 0),
    0
  );
  const liveCount = polls.filter(
    (p) => p.status === STATUS.ACTIVE && p.expiresAt > Date.now() / 1000
  ).length;

  if (!mounted) return null;

  return (
    <>
      <Navbar
        address={wallet.address}
        short={wallet.short}
        loading={wallet.loading}
        isAdmin={isAdmin}
        onConnect={handleConnect}
      />

      {/* Admin Mode active */}
      {isAdmin && (
        <div className={styles.adminBanner}>
          <span className={styles.adminBannerIcon}>🔒</span>
          <p>
            You are connected as the <strong>Verified Auditor</strong>. You have exclusive rights to approve, reject, and manage all community polls.
          </p>
        </div>
      )}

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroPill}>⚡ Powered by Ethereum · Sepolia</div>
          <h1 className={styles.heroTitle}>
            The pulse of<br />
            <span className={styles.heroGold}>community decisions</span>
          </h1>
          <p className={styles.heroSub}>
            Submit a proposal, cast your vote, react to polls — everything recorded immutably on-chain.
            Admin-curated for quality and fairness.
          </p>
          <div className={styles.heroBtns}>
            {wallet.address ? (
              <button className={styles.primaryBtn} onClick={() => setShowSubmit(true)}>
                + Submit a Poll
              </button>
            ) : (
              <button className={styles.primaryBtn} onClick={handleConnect}>
                Connect Wallet →
              </button>
            )}
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank" rel="noreferrer"
              className={styles.ghostBtn}
            >
              View Contract ↗
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{wallet.address ? polls.length : "—"}</span>
            <span className={styles.statLabel}>Total Polls</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{wallet.address ? liveCount : "—"}</span>
            <span className={styles.statLabel}>Live Now</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{wallet.address ? totalVotes : "—"}</span>
            <span className={styles.statLabel}>Total Votes</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{wallet.address ? polls.filter(p => p.voted).length : "—"}</span>
            <span className={styles.statLabel}>My Votes</span>
          </div>
        </div>
      </div>

      {/* Polls section */}
      <div className={styles.container}>

        {/* Filters */}
        <div className={styles.filtersRow}>
          <div className={styles.filterTabs}>
            {(["all", "live", "closed", "my"] as FilterTab[]).map((f) => (
              <button
                key={f}
                className={`${styles.tab} ${filter === f ? styles.activeTab : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "All"
                  : f === "live"
                  ? "🟢 Live"
                  : f === "closed"
                  ? "⚫ Closed"
                  : "👤 My Proposals"}
              </button>
            ))}
          </div>

          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search polls..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category chips */}
        <div className={styles.catRow}>
          <button
            className={`${styles.catChip} ${catFilter === null ? styles.activeCat : ""}`}
            onClick={() => setCatFilter(null)}
          >All</button>
          {CATEGORIES.map((c, i) => (
            <button
              key={i}
              className={`${styles.catChip} ${catFilter === i ? styles.activeCat : ""}`}
              onClick={() => setCatFilter(catFilter === i ? null : i)}
            >
              {CATEGORY_ICONS[c]} {c}
            </button>
          ))}
        </div>

        {/* Content */}
        {!wallet.address ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🗳️</div>
            <h3 className={styles.emptyTitle}>Connect to participate</h3>
            <p className={styles.emptySub}>Connect your MetaMask wallet on Sepolia to view and vote on community polls.</p>
            <button className={styles.primaryBtn} onClick={handleConnect}>Connect Wallet →</button>
          </div>
        ) : loading ? (
          <div className={styles.grid}>
            {[1,2,3].map(i => (
              <div key={i} className={styles.skeleton}>
                <div className={styles.skel} style={{width:"50%",height:"12px"}} />
                <div className={styles.skel} style={{width:"85%",height:"20px",marginTop:"14px"}} />
                <div className={styles.skel} style={{width:"100%",height:"6px",marginTop:"24px"}} />
                <div className={styles.skel} style={{width:"100%",height:"6px",marginTop:"10px"}} />
                <div className={styles.skel} style={{width:"70%",height:"6px",marginTop:"10px"}} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3 className={styles.emptyTitle}>No polls found</h3>
            <p className={styles.emptySub}>
              {polls.length === 0
                ? "No polls have been approved yet. Be the first to submit one!"
                : "Try a different filter or search term."}
            </p>
            {polls.length === 0 && (
              <button className={styles.primaryBtn} onClick={() => setShowSubmit(true)}>Submit a Poll →</button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                isAdmin={isAdmin}
                walletAddress={wallet.address}
                onVote={handleVote}
                onReact={handleReact}
                onApprove={handleApprove}
                onReject={handleReject}
                onClose={handleClose}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {error && <div className={styles.errorBanner}>⚠ {error}</div>}
      </div>

      {/* FAB */}
      {wallet.address && (
        <button className={styles.fab} onClick={() => setShowSubmit(true)} title="Submit a poll">
          +
        </button>
      )}

      {/* Modals */}
      {activePoll && (
        <VoteModal poll={activePoll} onClose={() => setActivePoll(null)} onSubmit={handleSubmitVote} />
      )}
      {showSubmit && (
        <SubmitPollModal onClose={() => setShowSubmit(false)} onSubmit={handleSubmitPoll} />
      )}

      <Toast message={toast?.msg ?? null} type={toast?.type} onClear={clearToast} />
    </>
  );
}
