"use client";
import { useTheme } from "@/lib/ThemeContext";
import styles from "./Navbar.module.css";
import Link from "next/link";

interface Props {
  address: string | null;
  short: string | null;
  loading: boolean;
  isAdmin: boolean;
  onConnect: () => void;
}

export default function Navbar({ address, short, loading, isAdmin, onConnect }: Props) {
  const { theme, toggle } = useTheme();

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
          <button className={styles.themeBtn} onClick={toggle} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

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
        </div>
      </div>
    </nav>
  );
}
