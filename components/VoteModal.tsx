"use client";
import { useState } from "react";
import { Poll } from "@/lib/contract";
import styles from "./VoteModal.module.css";

interface Props {
  poll: Poll | null;
  onClose: () => void;
  onSubmit: (optionIndex: number) => Promise<string>;
}

export default function VoteModal({ poll, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!poll) return null;

  const handleSubmit = async () => {
    if (selected === null) return;
    setLoading(true); setErr(null);
    try {
      const hash = await onSubmit(selected);
      setTxHash(hash);
      setTimeout(onClose, 2800);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message.slice(0, 100) : "Transaction failed");
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.tag}>Cast Your Vote</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <h2 className={styles.question}>{poll.question}</h2>

        <div className={styles.choices}>
          {poll.options.map((opt, i) => (
            <button
              key={i}
              className={`${styles.choice} ${selected === i ? styles.chosen : ""}`}
              onClick={() => setSelected(i)}
            >
              <span className={styles.letter}>{String.fromCharCode(65 + i)}</span>
              <span className={styles.choiceText}>{opt}</span>
              {selected === i && <span className={styles.check}>✓</span>}
            </button>
          ))}
        </div>

        {txHash ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <p>Vote recorded on-chain!</p>
            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className={styles.txLink}>
              View transaction ↗
            </a>
          </div>
        ) : (
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={selected === null || loading}>
            {loading ? <><span className={styles.spinner} /> Signing...</> : "Submit Vote →"}
          </button>
        )}
        {err && <p className={styles.err}>{err}</p>}
      </div>
    </div>
  );
}
