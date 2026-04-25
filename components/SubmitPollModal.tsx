"use client";
import { useState } from "react";
import { CATEGORIES } from "@/lib/contract";
import styles from "./SubmitPollModal.module.css";
import { CrossIcon, HourglassIcon, PartyIcon, MinusIcon, ArrowRightIcon } from "@/components/Icons";

interface Props {
  onClose: () => void;
  onSubmit: (question: string, options: string[], expiresAt: number, category: number) => Promise<void>;
}

export default function SubmitPollModal({ onClose, onSubmit }: Props) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [category, setCategory] = useState(0);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const updateOpt = (i: number, v: string) => { const n = [...options]; n[i] = v; setOptions(n); };
  const addOpt = () => { if (options.length < 6) setOptions([...options, ""]); };
  const removeOpt = (i: number) => { if (options.length > 2) setOptions(options.filter((_, x) => x !== i)); };

  const handleSubmit = async () => {
    const filtered = options.filter(o => o.trim());
    if (!question.trim() || filtered.length < 2) { setErr("Fill in question and at least 2 options."); return; }
    setLoading(true); setErr(null);
    try {
      const expiresAt = hasExpiry && expiryDate
        ? Math.floor(new Date(expiryDate).getTime() / 1000) : 0;
      await onSubmit(question.trim(), filtered, expiresAt, category);
      setDone(true);
      setTimeout(onClose, 2500);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message.slice(0, 100) : "Transaction failed");
    } finally { setLoading(false); }
  };

  const letters = ["A","B","C","D","E","F"];

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <div className={styles.tag}>New Proposal</div>
            <h2 className={styles.title}>Submit a Poll</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><CrossIcon size={18} /></button>
        </div>

        <p className={styles.notice}>
          <HourglassIcon size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Your poll will be reviewed by the admin before going live.
        </p>

        {done ? (
          <div className={styles.success}>
            <div className={styles.successIcon}><PartyIcon size={48} /></div>
            <p>Poll submitted for review!</p>
            <span>The admin will approve it shortly.</span>
          </div>
        ) : (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Question</label>
              <textarea className={styles.textarea} rows={3}
                placeholder="What should the community decide?"
                value={question} onChange={e => setQuestion(e.target.value)} />
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>Category</label>
                <select className={styles.select} value={category} onChange={e => setCategory(Number(e.target.value))}>
                  {CATEGORIES.map((c, i) => <option key={i} value={i}>{c}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <input type="checkbox" checked={hasExpiry} onChange={e => setHasExpiry(e.target.checked)} style={{marginRight:6}} />
                  Set Expiry Date
                </label>
                {hasExpiry && (
                  <input type="datetime-local" className={styles.input}
                    value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Options (2–6)</label>
              <div className={styles.optsList}>
                {options.map((opt, i) => (
                  <div key={i} className={styles.optRow}>
                    <span className={styles.optLetter}>{letters[i]}</span>
                    <input className={styles.input} type="text"
                      placeholder={`Choice ${letters[i]}`}
                      value={opt} onChange={e => updateOpt(i, e.target.value)} />
                    {options.length > 2 && (
                      <button className={styles.removeBtn} onClick={() => removeOpt(i)}><MinusIcon size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button className={styles.addBtn} onClick={addOpt}>+ Add option</button>
              )}
            </div>

            {err && <p className={styles.err}>{err}</p>}

            <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className={styles.spinner} /> Submitting...</> : <>Submit for Review <ArrowRightIcon size={16} style={{ marginLeft: '8px' }} /></>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

