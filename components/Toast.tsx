"use client";
import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

interface Props { message: string | null; type?: "success" | "error" | "info"; onClear: () => void; }

export default function Toast({ message, type = "info", onClear }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onClear, 280); }, 3800);
    return () => clearTimeout(t);
  }, [message, onClear]);

  if (!message) return null;

  const icons: Record<string, string> = {
    success: "✓",
    error: "✕",
    info: "·",
  };

  return (
    <div className={`${styles.toast} ${styles[type]} ${visible ? styles.show : ""}`}>
      <span className={styles.icon}>{icons[type]}</span>
      {message}
    </div>
  );
}
