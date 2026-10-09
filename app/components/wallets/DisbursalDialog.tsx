"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import styles from "./DisbursalDialog.module.css";

type Step = "choose" | "send" | "amount" | "success";

interface Recipient {
  id: string;
  name: string;
  avatar: string;
}

const BALANCE = 9_008_965.09;
const BANKS = [
  "Wema Bank",
  "GTBank",
  "Access Bank",
  "Zenith Bank",
  "First Bank",
  "UBA",
];

const RECIPIENTS: Recipient[] = [
  {
    id: "sylvester",
    name: "Sylvester Matthew John",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&auto=format&fit=crop&q=80",
  },
  {
    id: "miya",
    name: "Miya Das",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&auto=format&fit=crop&q=80",
  },
  {
    id: "shreya",
    name: "Shreya Pandal",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&auto=format&fit=crop&q=80",
  },
  {
    id: "sunny",
    name: "Sunny Marsha",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&auto=format&fit=crop&q=80",
  },
  {
    id: "neha",
    name: "Neha Gupta",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&auto=format&fit=crop&q=80",
  },
  {
    id: "daisy",
    name: "Daisy Mores",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=96&auto=format&fit=crop&q=80",
  },
  {
    id: "loid",
    name: "Loid Fernandes",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&auto=format&fit=crop&q=80",
  },
  {
    id: "fatima",
    name: "Fatima Shaik",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=96&auto=format&fit=crop&q=80",
  },
];

const formatMoney = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface DisbursalDialogProps {
  open: boolean;
  onClose: () => void;
}

export const DisbursalDialog: React.FC<DisbursalDialogProps> = ({
  open,
  onClose,
}) => {
  const titleId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const [rendered, setRendered] = useState(open);
  const [step, setStep] = useState<Step>("choose");
  const [shellHeight, setShellHeight] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [bank, setBank] = useState("");
  const [bankOpen, setBankOpen] = useState(false);
  const [account, setAccount] = useState("");
  const [accountError, setAccountError] = useState(false);
  const [amountCents, setAmountCents] = useState(0);
  const [amountError, setAmountError] = useState(false);
  const [searching, setSearching] = useState(false);
  const [settledQuery, setSettledQuery] = useState("");
  const [accountChecking, setAccountChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const searchTimer = useRef<number | null>(null);
  const actionToken = useRef(0);

  if (open && !rendered) setRendered(true);

  useEffect(() => {
    if (open || !rendered) return;
    actionToken.current += 1;
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setStep("choose");
      setQuery("");
      setRecipient(null);
      setBank("");
      setBankOpen(false);
      setAccount("");
      setAccountError(false);
      setAmountCents(0);
      setAmountError(false);
      setSearching(false);
      setSettledQuery("");
      setAccountChecking(false);
      setSending(false);
      setShellHeight(null);
    }, 280);
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
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      if (step === "choose") searchRef.current?.focus();
      if (step === "send") accountRef.current?.focus();
      if (step === "amount") amountRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, step]);

  useEffect(() => {
    const node = contentRef.current;
    if (!node || !rendered) return;
    const measure = () => {
      const next = Math.min(node.scrollHeight, window.innerHeight - 48);
      setShellHeight(next);
    };
    const observer = new ResizeObserver(() => measure());
    observer.observe(node);
    const frame = window.requestAnimationFrame(measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [rendered, step]);

  if (!rendered || typeof document === "undefined") return null;

  const closing = !open;
  const matches =
    settledQuery && !searching
      ? RECIPIENTS.filter((person) =>
          person.name.toLowerCase().includes(settledQuery.toLowerCase()),
        )
      : [];

  const onSearch = (value: string) => {
    setQuery(value);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    const trimmed = value.trim();
    if (!trimmed) {
      setSearching(false);
      setSettledQuery("");
      return;
    }
    setSearching(true);
    setSettledQuery("");
    searchTimer.current = window.setTimeout(() => {
      setSearching(false);
      setSettledQuery(trimmed);
    }, 700);
  };

  const go = (next: Step) => {
    setBankOpen(false);
    setStep(next);
  };

  const selectRecipient = (person: Recipient) => {
    setRecipient(person);
    setBank("");
    setAccount("");
    setAccountError(false);
    setAmountCents(0);
    setAmountError(false);
    go("send");
  };

  const submitAccount = () => {
    if (accountChecking) return;
    const digits = account.replace(/\D/g, "");
    const bankName = bank;
    const token = actionToken.current + 1;
    actionToken.current = token;
    setAccountChecking(true);
    setAccountError(false);
    window.setTimeout(() => {
      if (token !== actionToken.current) return;
      setAccountChecking(false);
      if (!bankName || digits.length < 10) {
        setAccountError(true);
        return;
      }
      go("amount");
    }, 1100);
  };

  const submitAmount = () => {
    if (sending) return;
    const balanceCents = Math.round(BALANCE * 100);
    if (amountCents <= 0 || amountCents > balanceCents) {
      setAmountError(true);
      return;
    }
    const token = actionToken.current + 1;
    actionToken.current = token;
    setAmountError(false);
    setSending(true);
    window.setTimeout(() => {
      if (token !== actionToken.current) return;
      setSending(false);
      go("success");
    }, 1400);
  };

  const onAmountKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key >= "0" && event.key <= "9") {
      event.preventDefault();
      setAmountError(false);
      setAmountCents((current) =>
        Math.min(current * 10 + Number(event.key), 999_999_999_99),
      );
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      setAmountError(false);
      setAmountCents((current) => Math.floor(current / 10));
      return;
    }
    if (event.key === "Enter") submitAmount();
  };

  const firstName = recipient?.name.split(" ")[0] ?? "Their";

  return createPortal(
    <div
      className={`${styles.overlay} ${closing ? styles.overlayOut : styles.overlayIn}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`${styles.shell} ${closing ? styles.shellOut : styles.shellIn}`}
        style={shellHeight ? { height: shellHeight } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div key={step} ref={contentRef} className={styles.view}>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            <X className={styles.closeIcon} />
          </button>

          {step === "choose" && (
            <div className={styles.step}>
              <Image
                src="/images/Person-Illustration.png"
                alt=""
                width={148}
                height={148}
                className={styles.personArt}
              />
              <h2 id={titleId} className={styles.title}>
                Choose recipient
              </h2>
              <p className={styles.subtitle}>
                Search for the recipient you wish to send money to by entering
                their name
              </p>
              <input
                ref={searchRef}
                className={styles.search}
                value={query}
                placeholder=""
                aria-label="Search recipients"
                onChange={(event) => onSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !searching && matches[0])
                    selectRecipient(matches[0]);
                }}
              />
              {query.trim() && searching && (
                <div className={styles.results} aria-busy="true" aria-live="polite">
                  <p className={styles.loadingLabel}>Searching recipients</p>
                  {[0, 1, 2].map((item) => (
                    <div key={item} className={styles.skeletonRow}>
                      <span className={styles.skeletonAvatar} />
                      <span className={item === 1 ? styles.skeletonLineShort : styles.skeletonLine} />
                    </div>
                  ))}
                </div>
              )}
              {query.trim() && !searching && settledQuery && (
                <ul className={styles.results}>
                  {matches.length === 0 ? (
                    <li className={styles.emptyResult}>No recipients found</li>
                  ) : (
                    matches.map((person) => (
                      <li key={person.id}>
                        <button
                          type="button"
                          className={styles.result}
                          onClick={() => selectRecipient(person)}
                        >
                          <Image
                            src={person.avatar}
                            alt=""
                            width={32}
                            height={32}
                            className={styles.resultAvatar}
                          />
                          <span>{person.name}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
              <button type="button" className={styles.cancel} onClick={onClose}>
                Cancel
              </button>
            </div>
          )}

          {step === "send" && recipient && (
            <div className={styles.step}>
              <Image
                src="/images/PaperPlane-Illustration.png"
                alt=""
                width={168}
                height={96}
                className={styles.planeArt}
              />
              <h2 id={titleId} className={styles.title}>
                Send to
              </h2>
              <div className={styles.recipient}>
                <Image
                  src={recipient.avatar}
                  alt=""
                  width={28}
                  height={28}
                  className={styles.recipientAvatar}
                />
                <span>{recipient.name}</span>
              </div>
              <p className={styles.subtitle}>
                Enter the bank account details of the recipient to initiate your
                money transfer.
              </p>
              <div className={styles.formCard}>
                <label
                  className={styles.fieldLabel}
                  htmlFor={`${titleId}-bank`}
                >
                  Bank name
                </label>
                <div className={styles.bankField}>
                  <button
                    id={`${titleId}-bank`}
                    type="button"
                    className={styles.fieldButton}
                    aria-expanded={bankOpen}
                    disabled={accountChecking}
                    onClick={() => setBankOpen((current) => !current)}
                  >
                    <span
                      className={
                        bank ? styles.fieldValue : styles.fieldPlaceholder
                      }
                    >
                      {bank}
                    </span>
                    <ChevronDown className={styles.fieldChevron} />
                  </button>
                  {bankOpen && (
                    <ul className={styles.bankMenu}>
                      {BANKS.map((name) => (
                        <li key={name}>
                          <button
                            type="button"
                            className={`${styles.bankOption} ${name === bank ? styles.bankOptionActive : ""}`}
                            onClick={() => {
                              setBank(name);
                              setBankOpen(false);
                              setAccountError(false);
                            }}
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <label
                  className={styles.fieldLabel}
                  htmlFor={`${titleId}-account`}
                >
                  Account number
                </label>
                <input
                  id={`${titleId}-account`}
                  ref={accountRef}
                  className={styles.fieldInput}
                  inputMode="numeric"
                  value={account}
                  disabled={accountChecking}
                  onChange={(event) => {
                    setAccount(
                      event.target.value.replace(/[^\d]/g, "").slice(0, 10),
                    );
                    setAccountError(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitAccount();
                  }}
                />
              </div>
              {accountError && (
                <p className={styles.formError} role="alert">
                  <AlertTriangle className={styles.errorIcon} />
                  Bank account not found
                </p>
              )}
              <button
                type="button"
                className={styles.continue}
                onClick={submitAccount}
                disabled={accountChecking}
              >
                {accountChecking && <span className={styles.spinner} aria-hidden="true" />}
                {accountChecking ? "Checking account" : "Continue"}
              </button>
            </div>
          )}

          {step === "amount" && (
            <div className={styles.step}>
              <Image
                src="/images/Money-Illustration.png"
                alt=""
                width={120}
                height={96}
                className={styles.moneyArt}
              />
              <h2 id={titleId} className={styles.title}>
                Enter amount
              </h2>
              <p className={styles.subtitle}>
                How much are you trying to transfer? Type in an amount below
              </p>
              <label className={styles.amountRow}>
                <span className={styles.dollar}>$</span>
                <input
                  ref={amountRef}
                  className={`${styles.amountField} ${amountCents === 0 ? styles.amountMuted : ""}`}
                  value={formatMoney(amountCents)}
                  inputMode="decimal"
                  aria-label="Transfer amount"
                  readOnly
                  style={{
                    width: `${Math.max(4, formatMoney(amountCents).length)}ch`,
                  }}
                  onKeyDown={onAmountKeyDown}
                />
              </label>
              <p className={styles.balance}>
                Balance: ${formatMoney(Math.round(BALANCE * 100))}
              </p>
              {amountError && (
                <p className={styles.formError} role="alert">
                  <AlertTriangle className={styles.errorIcon} />
                  {amountCents <= 0
                    ? "Enter an amount"
                    : "Amount exceeds balance"}
                </p>
              )}
              <button
                type="button"
                className={styles.continue}
                onClick={submitAmount}
                disabled={sending}
              >
                {sending && <span className={styles.spinner} aria-hidden="true" />}
                {sending ? "Sending transfer" : "Continue"}
              </button>
              <button
                type="button"
                className={styles.cancel}
                onClick={() => go("choose")}
                disabled={sending}
              >
                Change recipient
              </button>
            </div>
          )}

          {step === "success" && (
            <div className={`${styles.step} ${styles.successStep}`}>
              <Image
                src="/images/Checkmark-Illustration.png"
                alt=""
                width={132}
                height={112}
                className={styles.checkArt}
              />
              <h2 id={titleId} className={styles.title}>
                Transaction successful
              </h2>
              <p className={styles.successCopy}>
                {firstName}&apos;s funds are expected to arrive shortly, within
                the next 5 minutes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DisbursalDialog;
