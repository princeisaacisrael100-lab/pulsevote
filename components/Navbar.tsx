import { useTheme } from "@/lib/ThemeContext";
import styles from "./Navbar.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Props {
  address: string | null;
  short: string | null;
  loading: boolean;
  isAdmin: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function Navbar({ address, short, loading, isAdmin, onConnect, onDisconnect }: Props) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandIcon}>⚡</span>
          <span className={styles.brandName}>PulseVote</span>
        </Link>

        <div className={styles.links}>
          <Link href="/" className={styles.link}>Polls</Link>
          {isAdmin && (
            <Link href="/admin" className={styles.adminLink}>
              👑 Admin
            </Link>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.themeToggle} onClick={toggle} title="Toggle theme">
            <div className={`${styles.toggleBar} ${theme === "dark" ? styles.dark : ""}`}>
              <div className={styles.toggleCircle}>
                {theme === "dark" ? "🌙" : "☀️"}
              </div>
            </div>
          </button>

          {mounted && (
            <>
              <button
                className={`${styles.walletBtn} ${address ? styles.connected : ""}`}
                onClick={onConnect}
                disabled={loading}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : address ? (
                  <>
                    <span className={styles.walletDot} />
                    {short}
                    {isAdmin && (
                      <span className={styles.adminLabel} title="Verified Admin">
                        👑 Admin
                      </span>
                    )}
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </button>

              {address && (
                <button
                  className={styles.logoutBtn}
                  onClick={onDisconnect}
                  title="Disconnect wallet"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
