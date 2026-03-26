"use client";
import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/lib/useWallet";
import { usePolls } from "@/lib/usePolls";
import { Poll, STATUS, CATEGORIES, CATEGORY_ICONS } from "@/lib/contract";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import { formatDistanceToNow } from "date-fns";
import styles from "./admin.module.css";

type ToastState = { msg: string; type: "success"|"error"|"info" } | null;

export default function AdminPage() {
  const wallet = useWallet();
  const { polls, loading, isAdmin, loadPolls, approvePoll, rejectPoll, closePoll, deletePoll } = usePolls();
  const [toast, setToast] = useState<ToastState>(null);
  const [tab, setTab] = useState<"pending"|"active"|"closed">("pending");
  const [acting, setActing] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (msg: string, type: "success"|"error"|"info" = "info") => setToast({ msg, type });
  const clearToast = useCallback(() => setToast(null), []);

  const refresh = useCallback(async () => {
    const p = wallet.getProvider();
    if (p) await loadPolls(p, wallet.address);
  }, [wallet, loadPolls]);

  useEffect(() => {
    if (wallet.address) {
      refresh();
    }
  }, [wallet.address, refresh]);

  const handleConnect = async () => {
    await wallet.connect();
    if (wallet.address) {
      showToast("Wallet connected!", "success");
    }
  };

  const act = async (fn: () => Promise<void>, pollId: number, successMsg: string) => {
    setActing(pollId);
    try {
      await fn();
      showToast(successMsg, "success");
      await refresh();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message.slice(0, 80) : "Transaction failed", "error");
    } finally { setActing(null); }
  };

  const handleApprove = (poll: Poll) => act(async () => {
    const s = wallet.getSigner(); if (!s) throw new Error("No signer");
    await approvePoll(s, poll.id);
  }, poll.id, `Poll #${poll.id} approved and live!`);

  const handleReject = (poll: Poll) => act(async () => {
    const s = wallet.getSigner(); if (!s) throw new Error("No signer");
    await rejectPoll(s, poll.id);
  }, poll.id, `Poll #${poll.id} rejected.`);

  const handleClose = (poll: Poll) => act(async () => {
    const s = wallet.getSigner(); if (!s) throw new Error("No signer");
    await closePoll(s, poll.id, true);
  }, poll.id, `Poll #${poll.id} closed.`);

  const handleDelete = (poll: Poll) => {
    if (!confirm(`Delete poll #${poll.id}? This is permanent.`)) return;
    act(async () => {
      const s = wallet.getSigner(); if (!s) throw new Error("No signer");
      await deletePoll(s, poll.id, true);
    }, poll.id, `Poll #${poll.id} deleted.`);
  };

  const pending = polls.filter(p => p.status === STATUS.PENDING);
  const active  = polls.filter(p => p.status === STATUS.ACTIVE);
  const closed  = polls.filter(p => p.status === STATUS.CLOSED);

  const tabPolls = tab === "pending" ? pending : tab === "active" ? active : closed;

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

      <div className={styles.page}>
        {/* Admin Mode active */}
        {isAdmin && (
          <div className={styles.adminBanner}>
            <span className={styles.adminBannerIcon}>🔒</span>
            <p>
              You are connected as the <strong>Verified Auditor</strong>. You have exclusive rights to approve, reject, and manage all community polls.
            </p>
          </div>
        )}

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.breadcrumb}>Dashboard / Admin Panel</div>
            <h1 className={styles.pageTitle}>👑 Admin Panel</h1>
            <p className={styles.pageSub}>Review submitted polls, manage community content.</p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.hStat}>
              <span className={styles.hNum}>{pending.length}</span>
              <span className={styles.hLabel}>Pending Review</span>
            </div>
            <div className={styles.hStat}>
              <span className={styles.hNum}>{active.length}</span>
              <span className={styles.hLabel}>Live</span>
            </div>
            <div className={styles.hStat}>
              <span className={styles.hNum}>{closed.length}</span>
              <span className={styles.hLabel}>Closed</span>
            </div>
          </div>
        </div>

        {/* Not connected */}
        {!wallet.address ? (
          <div className={styles.gateBox}>
            <div className={styles.gateIcon}>🔐</div>
            <h2 className={styles.gateTitle}>Admin Access Required</h2>
            <p className={styles.gateSub}>Connect the owner wallet to access the admin panel.</p>
            <button className={styles.connectBtn} onClick={handleConnect}>Connect Wallet →</button>
          </div>
        ) : !isAdmin ? (
          <div className={styles.gateBox}>
            <div className={styles.gateIcon}>⛔</div>
            <h2 className={styles.gateTitle}>Access Denied</h2>
            <p className={styles.gateSub}>Only the contract owner can access this panel.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className={styles.tabs}>
              <button className={`${styles.tabBtn} ${tab==="pending" ? styles.activeTabBtn : ""}`} onClick={() => setTab("pending")}>
                Pending Review
                {pending.length > 0 && <span className={styles.badge}>{pending.length}</span>}
              </button>
              <button className={`${styles.tabBtn} ${tab==="active" ? styles.activeTabBtn : ""}`} onClick={() => setTab("active")}>
                Live Polls
                <span className={styles.greenDot} />
              </button>
              <button className={`${styles.tabBtn} ${tab==="closed" ? styles.activeTabBtn : ""}`} onClick={() => setTab("closed")}>
                Closed
              </button>
            </div>

            {/* Poll list */}
            {loading ? (
              <div className={styles.loadingMsg}>Loading polls...</div>
            ) : tabPolls.length === 0 ? (
              <div className={styles.emptyTab}>
                {tab === "pending" ? "🎉 No polls pending review!" : `No ${tab} polls.`}
              </div>
            ) : (
              <div className={styles.pollList}>
                {tabPolls.map(poll => {
                  const total = poll.votes.reduce((a,b)=>a+b,0);
                  const cat = CATEGORIES[poll.category] ?? "General";
                  const isActing = acting === poll.id;
                  return (
                    <div key={poll.id} className={styles.pollRow}>
                      <div className={styles.pollLeft}>
                        <div className={styles.pollTopMeta}>
                          <span className={styles.pollId}>#{String(poll.id).padStart(3,"0")}</span>
                          <span className={styles.pollCat}>{CATEGORY_ICONS[cat]} {cat}</span>
                          <span className={styles.pollTime}>
                            {formatDistanceToNow(new Date(poll.createdAt * 1000), {addSuffix:true})}
                          </span>
                        </div>
                        <h3 className={styles.pollQ}>{poll.question}</h3>
                        <div className={styles.pollOpts}>
                          {poll.options.map((o,i) => (
                            <span key={i} className={styles.optTag}>{o}</span>
                          ))}
                        </div>
                        <div className={styles.pollFootMeta}>
                          <span className={styles.creatorAddr}>
                            By: {poll.creator.slice(0,10)}...{poll.creator.slice(-6)}
                          </span>
                          {poll.expiresAt > 0 && (
                            <span className={styles.expiry}>
                              Expires: {new Date(poll.expiresAt*1000).toLocaleDateString()}
                            </span>
                          )}
                          {tab !== "pending" && (
                            <span className={styles.votesStat}>{total} votes</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.pollActions}>
                        {tab === "pending" && (
                          <>
                            <button
                              className={`${styles.approveBtn} ${isActing ? styles.acting : ""}`}
                              onClick={() => handleApprove(poll)}
                              disabled={isActing}
                            >
                              {isActing ? "..." : "✓ Approve"}
                            </button>
                            <button
                              className={`${styles.rejectBtn} ${isActing ? styles.acting : ""}`}
                              onClick={() => handleReject(poll)}
                              disabled={isActing}
                            >
                              {isActing ? "..." : "✕ Reject"}
                            </button>
                          </>
                        )}
                        {tab === "active" && (
                          <button
                            className={`${styles.closeBtn} ${isActing ? styles.acting : ""}`}
                            onClick={() => handleClose(poll)}
                            disabled={isActing}
                          >
                            {isActing ? "..." : "🔒 Close"}
                          </button>
                        )}
                        <button
                          className={`${styles.deleteBtn} ${isActing ? styles.acting : ""}`}
                          onClick={() => handleDelete(poll)}
                          disabled={isActing}
                        >
                          {isActing ? "..." : "🗑"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Toast message={toast?.msg ?? null} type={toast?.type} onClear={clearToast} />
    </>
  );
}
