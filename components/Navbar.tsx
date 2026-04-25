import { useTheme } from "@/lib/ThemeContext";
import styles from "./Navbar.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { SunIcon, MoonIcon, LogoutIcon } from "@/components/Icons";

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
          <div className={styles.brandMark}>
            <div className={styles.brandMarkDot} />
          </div>
          <span className={styles.brandName}>PulseVote</span>
        </Link>

        <div className={styles.links}>
          <Link href="/" className={styles.link}>Polls</Link>
          {isAdmin && (
            <Link href="/admin" className={styles.adminLink}>
              Admin
            </Link>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.themeToggle} onClick={toggle} title="Toggle theme">
            {mounted && (theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />)}
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
                      <span className={styles.adminLabel} title="Verified Admin">Admin</span>
                    )}
                  </>
                ) : (
                  "Connect wallet"
                )}
              </button>

              {address && (
                <button
                  className={styles.logoutBtn}
                  onClick={onDisconnect}
                  title="Disconnect wallet"
                >
                  <LogoutIcon size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

