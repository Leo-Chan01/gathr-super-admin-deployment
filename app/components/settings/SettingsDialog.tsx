"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, LogOut, User, X } from "lucide-react";
import styles from "./SettingsDialog.module.css";

type SettingsTab = "general" | "access";

const CHANNELS = [
  { id: "sms", label: "SMS" },
  { id: "email", label: "Email" },
] as const;

const TYPES = [
  { id: "payouts", label: "Payout requests" },
  { id: "kyc", label: "KYC verification requests" },
  { id: "reports", label: "Reports" },
  { id: "reportsFollow", label: "Reports" },
] as const;

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const titleId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [rendered, setRendered] = useState(open);
  const [tab, setTab] = useState<SettingsTab>("general");
  const [email, setEmail] = useState("sylvesterjo819@gmail.com");
  const [draftEmail, setDraftEmail] = useState(email);
  const [editingEmail, setEditingEmail] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [channels, setChannels] = useState<Record<string, boolean>>({
    sms: true,
    email: true,
  });
  const [types, setTypes] = useState<Record<string, boolean>>({
    payouts: true,
    kyc: true,
    reports: true,
    reportsFollow: true,
  });

  if (open && !rendered) setRendered(true);

  useEffect(() => {
    if (open || !rendered) return;
    const timer = window.setTimeout(() => {
      setRendered(false);
      setTab("general");
      setEditingEmail(false);
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
    if (!editingEmail) return;
    emailRef.current?.focus();
    emailRef.current?.select();
  }, [editingEmail]);

  if (!rendered || typeof document === "undefined") return null;

  const closing = !open;

  const saveEmail = () => {
    const next = draftEmail.trim();
    if (next) setEmail(next);
    else setDraftEmail(email);
    setEditingEmail(false);
  };

  const onPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });
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
              onClick={() => setTab("general")}
              aria-current={tab === "general" ? "page" : undefined}
            >
              General
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${tab === "access" ? styles.navItemActive : ""}`}
              onClick={() => setTab("access")}
              aria-current={tab === "access" ? "page" : undefined}
            >
              Access control
            </button>
          </nav>
          <button type="button" className={styles.logout} onClick={onClose}>
            <LogOut className={styles.logoutIcon} />
            Log out
          </button>
        </aside>

        <div key={tab} className={styles.panel}>
          <h2 id={titleId} className={styles.heading}>
            {tab === "general" ? "General" : "Access control"}
          </h2>

          {tab === "general" ? (
            <>
              <div className={styles.profile}>
                <div className={styles.avatarWrap}>
                  <div className={styles.avatar}>
                    {photo ? (
                      // Blob previews are local and temporary.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className={styles.avatarPhoto} />
                    ) : (
                      <User className={styles.avatarIcon} strokeWidth={1.75} />
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.camera}
                    aria-label="Update photo"
                    onClick={() => photoRef.current?.click()}
                  >
                    <Camera className={styles.cameraIcon} strokeWidth={1.75} />
                  </button>
                  <input
                    ref={photoRef}
                    className={styles.photoInput}
                    type="file"
                    accept="image/*"
                    onChange={onPhoto}
                  />
                </div>
                {editingEmail ? (
                  <input
                    ref={emailRef}
                    className={styles.emailInput}
                    value={draftEmail}
                    aria-label="Email address"
                    onChange={(event) => setDraftEmail(event.target.value)}
                    onBlur={saveEmail}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveEmail();
                    }}
                  />
                ) : (
                  <p className={styles.email}>{email}</p>
                )}
                <button
                  type="button"
                  className={styles.updateEmail}
                  onClick={() => {
                    setDraftEmail(email);
                    setEditingEmail(true);
                  }}
                >
                  Update email
                </button>
              </div>

              <section className={styles.group}>
                <h3 className={styles.groupTitle}>Notification channel</h3>
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
                        setChannels((current) => ({
                          ...current,
                          [item.id]: !current[item.id],
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
                        setTypes((current) => ({
                          ...current,
                          [item.id]: !current[item.id],
                        }))
                      }
                    >
                      <span className={styles.knob} />
                    </button>
                  </div>
                ))}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SettingsDialog;
