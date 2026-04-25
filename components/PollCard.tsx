"use client";
import { useState } from "react";
import { Poll, CATEGORIES, CATEGORY_ICONS, STATUS, CONTRACT_ADDRESS } from "@/lib/contract";
import { formatDistanceToNow, format } from "date-fns";
import styles from "./PollCard.module.css";

import {
  CrownIcon,
  CheckIcon,
  CrossIcon,
  LockIcon,
  TrashIcon,
  TrophyIcon,
  FireIcon,
  ThumbsUpIcon,
  MindBlownIcon,
  StatsIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  CATEGORY_SVG_ICONS,
} from "@/components/Icons";

interface Props {
  poll: Poll;
  isAdmin: boolean;
  walletAddress: string | null;
  onVote: (id: number) => void;
  onReact: (id: number, type: number) => void;
  onClose: (id: number, asAdmin: boolean) => void;
  onDelete: (id: number, asAdmin: boolean) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export default function PollCard({
  poll,
  isAdmin,
  walletAddress,
  onVote,
  onReact,
  onClose,
  onDelete,
  onApprove,
  onReject,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const total = poll.votes.reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...poll.votes, 0);
  const winnerIdx = total > 0 ? poll.votes.indexOf(maxVotes) : -1;
  const category = CATEGORIES[poll.category] ?? "General";
  const CatIcon = CATEGORY_SVG_ICONS[category];
  const canManage = poll.isCreator || isAdmin;

  const isExpired = poll.expiresAt > 0 && Date.now() / 1000 > poll.expiresAt;
  const isActive = poll.status === STATUS.ACTIVE && !isExpired;
  const isPending = poll.status === STATUS.PENDING;

  const statusLabel = isPending
    ? "Pending"
    : poll.status === STATUS.CLOSED
    ? "Closed"
    : isExpired
    ? "Expired"
    : "Live";

  const statusClass = isPending
    ? styles.sPending
    : poll.status === STATUS.CLOSED || isExpired
    ? styles.sClosed
    : styles.sLive;

  return (
    <article className={`${styles.card} ${!isActive ? styles.dimmed : ""}`}>
      {/* Top row */}
      <div className={styles.topRow}>
        <div className={styles.meta}>
          <span className={styles.catBadge}>
            {CatIcon && <CatIcon size={12} style={{ marginRight: '4px' }} />} {category}
          </span>
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {statusLabel}
          </span>
          {poll.isCreator && <span className={styles.yourBadge}>You</span>}
          {isAdmin && <span className={styles.adminBadge}><CrownIcon size={12} /></span>}
        </div>
        {canManage && (
          <div className={styles.menuWrap}>
            <button
              className={styles.menuBtn}
              onClick={() => setMenuOpen((o) => !o)}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                {isPending && isAdmin && (
                  <>
                    <button
                      className={styles.ddItem}
                      onClick={() => {
                        onApprove?.(poll.id);
                        setMenuOpen(false);
                      }}
                    >
                      <CheckIcon size={14} style={{ marginRight: '8px' }} /> Approve Poll
                    </button>
                    <button
                      className={styles.ddItem}
                      onClick={() => {
                        onReject?.(poll.id);
                        setMenuOpen(false);
                      }}
                    >
                      <CrossIcon size={14} style={{ marginRight: '8px' }} /> Reject Poll
                    </button>
                  </>
                )}
                {isActive && (
                  <button
                    className={styles.ddItem}
                    onClick={() => {
                      onClose(poll.id, isAdmin && !poll.isCreator);
                      setMenuOpen(false);
                    }}
                  >
                    <LockIcon size={14} style={{ marginRight: '8px' }} /> Close Poll
                  </button>
                )}
                <button
                  className={`${styles.ddItem} ${styles.danger}`}
                  onClick={() => {
                    onDelete(poll.id, isAdmin && !poll.isCreator);
                    setMenuOpen(false);
                  }}
                >
                  <TrashIcon size={14} style={{ marginRight: '8px' }} /> Delete {isAdmin && !poll.isCreator ? "(Admin)" : ""}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Question */}
      <h3 className={styles.question}>{poll.question}</h3>

      {/* Options with bars */}
      <div className={styles.options}>
        {poll.options.map((opt, i) => {
          const pct = total ? Math.round((poll.votes[i] / total) * 100) : 0;
          const isWinner = i === winnerIdx && total > 0;
          return (
            <div
              key={i}
              className={`${styles.optRow} ${isWinner ? styles.winnerRow : ""}`}
            >
              <div className={styles.optTop}>
                <span className={styles.optLabel}>
                  {isWinner && <TrophyIcon size={14} style={{ marginRight: '6px', color: '#ffb700', verticalAlign: 'middle' }} />}
                  {opt}
                </span>
                <span className={styles.optPct}>{pct}%</span>
              </div>
              <div className={styles.barBg}>
                <div
                  className={`${styles.barFill} ${
                    isWinner ? styles.goldBar : ""
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={styles.voteCount}>
                {poll.votes[i]} vote{poll.votes[i] !== 1 ? "s" : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Analytics toggle */}
      {expanded && (
        <div className={styles.analytics}>
          <div className={styles.analyticsGrid}>
            <div className={styles.aStat}>
              <span className={styles.aNum}>{total}</span>
              <span className={styles.aLabel}>Total Votes</span>
            </div>
            <div className={styles.aStat}>
              <span className={styles.aNum}>{poll.options.length}</span>
              <span className={styles.aLabel}>Options</span>
            </div>
            <div className={styles.aStat}>
              <span className={styles.aNum}>
                {poll.expiresAt > 0
                  ? format(new Date(poll.expiresAt * 1000), "MMM d")
                  : "∞"}
              </span>
              <span className={styles.aLabel}>Expires</span>
            </div>
            <div className={styles.aStat}>
              <span className={styles.aNum}>
                {formatDistanceToNow(new Date(poll.createdAt * 1000), {
                  addSuffix: true,
                })}
              </span>
              <span className={styles.aLabel}>Created</span>
            </div>
          </div>
          <div className={styles.creatorRow}>
            <span className={styles.creatorLabel}>Creator:</span>
            <a
              href={`https://sepolia.etherscan.io/address/${poll.creator}`}
              target="_blank"
              rel="noreferrer"
              className={styles.creatorAddr}
            >
              {poll.creator.slice(0, 8)}...{poll.creator.slice(-6)}
            </a>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        {/* Reactions */}
        <div className={styles.reactions}>
          <button
            className={`${styles.reactBtn} ${
              poll.reacted ? styles.reacted : ""
            }`}
            onClick={() => !poll.reacted && onReact(poll.id, 0)}
            disabled={poll.reacted || !walletAddress}
            title="Fire"
          >
            <FireIcon size={14} style={{ marginRight: '4px' }} /> {poll.fireCount}
          </button>
          <button
            className={`${styles.reactBtn} ${
              poll.reacted ? styles.reacted : ""
            }`}
            onClick={() => !poll.reacted && onReact(poll.id, 1)}
            disabled={poll.reacted || !walletAddress}
            title="Like"
          >
            <ThumbsUpIcon size={14} style={{ marginRight: '4px' }} /> {poll.likeCount}
          </button>
          <button
            className={`${styles.reactBtn} ${
              poll.reacted ? styles.reacted : ""
            }`}
            onClick={() => !poll.reacted && onReact(poll.id, 2)}
            disabled={poll.reacted || !walletAddress}
            title="Mind blown"
          >
            <MindBlownIcon size={14} style={{ marginRight: '4px' }} /> {poll.mindBlownCount}
          </button>
        </div>

        <div className={styles.footerRight}>
          <button
            className={styles.statsBtn}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Hide stats" : <><StatsIcon size={14} style={{ marginRight: '6px' }} /> Stats</>}
          </button>

          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className={styles.ethLink}
          >
            <ExternalLinkIcon size={14} />
          </a>

          {poll.voted ? (
            <span className={styles.votedTag}><CheckIcon size={12} style={{ marginRight: '4px' }} /> Voted</span>
          ) : isPending ? (
            isAdmin ? (
              <div className={styles.adminActions}>
                <button
                  className={styles.approveBtnMini}
                  onClick={() => onApprove?.(poll.id)}
                >
                  <CheckIcon size={12} style={{ marginRight: '4px' }} /> Approve
                </button>
              </div>
            ) : (
              <span className={styles.pendingTag}>Awaiting Admin</span>
            )
          ) : isActive ? (
            <button
              className={styles.voteBtn}
              onClick={() => onVote(poll.id)}
              disabled={!walletAddress}
            >
              Vote <ArrowRightIcon size={14} style={{ marginLeft: '4px' }} />
            </button>
          ) : (
            <span className={styles.endedTag}>Ended</span>
          )}
        </div>
      </div>
    </article>
  );
}

