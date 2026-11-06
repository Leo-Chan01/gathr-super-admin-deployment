"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, LogOut, User, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { str } from "@/app/lib/api/adapters";
import { errorMessage } from "@/app/lib/api/client";
import { updateMe, uploadImage } from "@/app/lib/api/profile";
import { InlineSpinner } from "../common/AsyncState";
import AccessControl, { type AccessView } from "./AccessControl";
import styles from "./SettingsDialog.module.css";

type SettingsTab = "general" | "access";

const CHANNELS = [
  { id: "sms", label: "SMS" },
  { id: "email", label: "Email" },
] as const;

const TYPES = [
  { id: "payouts", label: "Payout requests" },
  { id: "kyc", label: "KYC verification requests" },
  { id: "reports", label: "New reports" },
  { id: "reportsFollow", label: "Updates on reports I reviewed" },
] as const;

/** There's no preferences endpoint yet, so toggles persist per browser. */
const PREFS_KEY = "gathr.admin.notificationPrefs";

type Prefs = { channels: Record<string, boolean>; types: Record<string, boolean> };

const DEFAULT_PREFS: Prefs = {
  channels: { sms: true, email: true },
  types: { payouts: true, kyc: true, reports: true, reportsFollow: true },
};

const readPrefs = (): Prefs => {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Prefs) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
};

const writePrefs = (prefs: Prefs) => {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Storage blocked; preferences last for this session only.
  }
};

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const router = useRouter();
  const { session, logout } = useAuth();
  const user = session?.user ?? null;
  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [rendered, setRendered] = useState(open);
  const [tab, setTab] = useState<SettingsTab>("general");
  const [accessView, setAccessView] = useState<AccessView>("roles");
  /** Direction of the last in-panel move, for the slide animation. */
  const [motion, setMotion] = useState<"tab" | "forward" | "back">("tab");
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const [draftName, setDraftName] = useState(fullName);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  /** Local preview while an upload is in flight. */
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const channels = prefs.channels;
  const types = prefs.types;
  const avatarUrl = preview ?? str(user, "avatar", "avatar.url");

  if (open && !rendered) setRendered(true);
  if (rendered && !prefsLoaded && typeof window !== "undefined") {
    setPrefsLoaded(true);
    setPrefs(readPrefs());
  }

  const updatePrefs = (update: (current: Prefs) => Prefs) =>
    setPrefs((current) => {
      const next = update(current);
      writePrefs(next);
      return next;
    });

  useEffect(() => {
    if (open || !rendered) return;
    const timer = window.setTimeout(() => {
      setRendered(false);
      setTab("general");
      setAccessView("roles");
      setMotion("tab");
      setEditingName(false);
      setProfileError(null);
    }, 240);
    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [rendered, onClose]);

  useEffect(() => {
    if (!editingName) return;
    nameRef.current?.focus();
    nameRef.current?.select();
  }, [editingName]);

  // Release the blob preview once it's replaced or the dialog unmounts.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  if (!rendered || typeof document === "undefined") return null;

  const closing = !open;

  const saveName = async () => {
    const next = draftName.trim().replace(/\s+/g, " ");
    setEditingName(false);
    if (!next || next === fullName) {
      setDraftName(fullName);
      return;
    }
    const [firstName, ...rest] = next.split(" ");
    setSavingName(true);
    setProfileError(null);
    try {
      await updateMe({ firstName, lastName: rest.join(" ") });
    } catch (err) {
      setProfileError(errorMessage(err));
      setDraftName(fullName);
    } finally {
      setSavingName(false);
    }
  };

  const onPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploading) return;
    setProfileError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadImage(file);
      await updateMe({ avatar: url });
      setPreview(null);
    } catch (err) {
      setPreview(null);
      setProfileError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace("/login");
  };

  return createPortal(
    <div
      className={`${styles.overlay} ${closing ? styles.overlayOut : styles.overlayIn}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`${styles.shell} ${closing ? styles.shellOut : styles.shellIn}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <aside className={styles.rail}>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            <X className={styles.closeIcon} />
          </button>
          <nav className={styles.nav} aria-label="Settings">
            <button
              type="button"
              className={`${styles.navItem} ${tab === "general" ? styles.navItemActive : ""}`}
              onClick={() => {
                setTab("general");
                setAccessView("roles");
                setMotion("tab");
              }}
              aria-current={tab === "general" ? "page" : undefined}
            >
              General
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${tab === "access" ? styles.navItemActive : ""}`}
              onClick={() => {
                if (tab === "access" && accessView === "roles") return;
                setTab("access");
                setAccessView("roles");
                setMotion("tab");
              }}
              aria-current={tab === "access" ? "page" : undefined}
            >
              Access control
            </button>
          </nav>
          <button
            type="button"
            className={styles.logout}
            onClick={handleLogout}
          >
            <LogOut className={styles.logoutIcon} />
            Log out
          </button>
        </aside>

        <div
          key={`${tab}-${accessView}`}
          className={`${styles.panel} ${tab === "access" ? styles.panelColumn : ""} ${
            motion === "forward" ? styles.panelForward : motion === "back" ? styles.panelBack : ""
          }`}
        >
          <h2 id={titleId} className={styles.heading}>
            {tab === "general" ? (
              "General"
            ) : accessView === "new" ? (
              <button
                type="button"
                className={styles.backButton}
                onClick={() => {
                  setMotion("back");
                  setAccessView("roles");
                }}
              >
                <ArrowLeft className={styles.backIcon} aria-hidden="true" />
                New admin
              </button>
            ) : (
              "Roles & Permissions"
            )}
          </h2>

          {tab === "general" ? (
            <>
              <div className={styles.profile}>
                <div className={styles.avatarWrap}>
                  <div className={styles.avatar} aria-busy={uploading}>
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className={styles.avatarPhoto} />
                    ) : (
                      <User className={styles.avatarIcon} strokeWidth={1.75} />
                    )}
                    {uploading && (
                      <span className={styles.avatarBusy}>
                        <InlineSpinner />
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.camera}
                    aria-label="Change profile photo"
                    disabled={uploading}
                    onClick={() => photoRef.current?.click()}
                  >
                    <Camera className={styles.cameraIcon} strokeWidth={1.75} />
                  </button>
                  <input
                    ref={photoRef}
                    className={styles.photoInput}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={onPhoto}
                  />
                </div>
                {editingName ? (
                  <input
                    ref={nameRef}
                    className={styles.emailInput}
                    value={draftName}
                    aria-label="Full name"
                    placeholder="First and last name"
                    onChange={(event) => setDraftName(event.target.value)}
                    onBlur={saveName}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveName();
                      if (event.key === "Escape") {
                        event.stopPropagation();
                        setDraftName(fullName);
                        setEditingName(false);
                      }
                    }}
                  />
                ) : (
                  <p className={styles.name}>
                    {savingName ? <InlineSpinner /> : null} {fullName || "Add your name"}
                  </p>
                )}
                <p className={styles.email}>
                  {user?.email ?? "No email on file"}
                  {user?.email && (
                    <span className={user.emailVerified ? styles.tagOk : styles.tagMissing}>
                      {user.emailVerified ? "Verified" : "Unverified"}
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  className={styles.updateEmail}
                  disabled={savingName}
                  onClick={() => {
                    setDraftName(fullName);
                    setEditingName(true);
                  }}
                >
                  Edit name
                </button>
                {profileError && (
                  <p className={styles.error} role="alert">
                    {profileError}
                  </p>
                )}
              </div>

              <section className={styles.group}>
                <h3 className={styles.groupTitle}>Notification channel</h3>
                <p className={styles.hint}>Saved on this device.</p>
                {CHANNELS.map((item) => (
                  <div key={item.id} className={styles.row}>
                    <span>{item.label}</span>
                    <button
                      type="button"
                      className={`${styles.toggle} ${channels[item.id] ? styles.toggleOn : ""}`}
                      role="switch"
                      aria-checked={channels[item.id]}
                      aria-label={item.label}
                      onClick={() =>
                        updatePrefs((current) => ({
                          ...current,
                          channels: { ...current.channels, [item.id]: !current.channels[item.id] },
                        }))
                      }
                    >
                      <span className={styles.knob} />
                    </button>
                  </div>
                ))}
              </section>

              <section className={styles.group}>
                <h3 className={styles.groupTitle}>Notification type</h3>
                {TYPES.map((item) => (
                  <div key={item.id} className={styles.row}>
                    <span>{item.label}</span>
                    <button
                      type="button"
                      className={`${styles.toggle} ${types[item.id] ? styles.toggleOn : ""}`}
                      role="switch"
                      aria-checked={types[item.id]}
                      aria-label={item.label}
                      onClick={() =>
                        updatePrefs((current) => ({
                          ...current,
                          types: { ...current.types, [item.id]: !current.types[item.id] },
                        }))
                      }
                    >
                      <span className={styles.knob} />
                    </button>
                  </div>
                ))}
              </section>
            </>
          ) : (
            <AccessControl
              view={accessView}
              onNewAdmin={() => {
                setMotion("forward");
                setAccessView("new");
              }}
              onDone={() => {
                setMotion("back");
                setAccessView("roles");
              }}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SettingsDialog;
