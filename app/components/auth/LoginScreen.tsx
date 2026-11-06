"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import appLogo from "@/public/images/gathr-logo(light).png";
import { login, verifyLoginOtp } from "@/app/lib/api/auth";
import { errorMessage } from "@/app/lib/api/client";
import styles from "./LoginScreen.module.css";

type LoginView = "email" | "password" | "otp";

const order: LoginView[] = ["email", "password", "otp"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const emailPane = useRef<HTMLFormElement>(null);
  const passwordPane = useRef<HTMLFormElement>(null);
  const otpPane = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<LoginView>("email");
  const [stageHeight, setStageHeight] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDestination, setOtpDestination] = useState("");
  const [busy, setBusy] = useState<LoginView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const node = (view === "email" ? emailPane : view === "password" ? passwordPane : otpPane).current;
    if (!node) return;
    const measure = () => setStageHeight(node.offsetHeight);
    const observer = new ResizeObserver(() => measure());
    observer.observe(node);
    const frame = window.requestAnimationFrame(measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [view]);

  useEffect(() => {
    const input = view === "email" ? emailRef : view === "password" ? passwordRef : otpRef;
    const frame = window.requestAnimationFrame(() => input.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  const go = (next: LoginView) => {
    setError(null);
    setView(next);
  };

  const paneClass = (pane: LoginView) => {
    if (pane === view) return styles.viewOn;
    return order.indexOf(pane) < order.indexOf(view) ? styles.viewOffUp : styles.viewOffDown;
  };

  const continueWithEmail = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    // The API checks email and password together, so this step is local.
    go("password");
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !password) return;
    setBusy("password");
    setError(null);
    try {
      const result = await login(email.trim(), password);
      if (result.status === "done") {
        router.replace("/dashboard");
        return;
      }
      setOtpDestination(result.destination);
      setOtp("");
      go("otp");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const submitOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || otp.length < 6) return;
    setBusy("otp");
    setError(null);
    try {
      await verifyLoginOtp(email.trim(), otp);
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(null);
    }
  };

  const errorFor = (pane: LoginView) =>
    error && view === pane ? (
      <p className={styles.error} role="alert">
        {error}
      </p>
    ) : null;

  return (
    <main className={styles.screen}>
      <div className={styles.column}>
        <Image
          src={appLogo}
          alt="gathr"
          width={132}
          height={58}
          className={styles.logo}
          priority
        />
        <h1 className={styles.title}>Super admin</h1>

        <div
          className={styles.stage}
          style={stageHeight ? { height: stageHeight } : undefined}
        >
          <form
            ref={emailPane}
            className={`${styles.view} ${paneClass("email")}`}
            inert={view !== "email"}
            aria-hidden={view !== "email"}
            onSubmit={continueWithEmail}
            noValidate
          >
            <input
              ref={emailRef}
              className={styles.field}
              type="email"
              placeholder="Email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email"
              aria-invalid={Boolean(error && view === "email")}
            />
            {errorFor("email")}
            <button type="submit" className={styles.submit}>
              Continue
            </button>
          </form>

          <form
            ref={passwordPane}
            className={`${styles.view} ${paneClass("password")}`}
            inert={view !== "password"}
            aria-hidden={view !== "password"}
            onSubmit={submitPassword}
          >
            <input
              ref={passwordRef}
              className={styles.field}
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              disabled={busy === "password"}
              onChange={(event) => setPassword(event.target.value)}
              aria-label="Password"
              aria-invalid={Boolean(error && view === "password")}
            />
            {errorFor("password")}
            <button
              type="submit"
              className={styles.submit}
              disabled={busy === "password" || !password}
            >
              {busy === "password" && (
                <span className={styles.spinner} aria-hidden="true" />
              )}
              {busy === "password" ? "Logging in" : "Login"}
            </button>
            <button
              type="button"
              className={styles.forgot}
              onClick={() => go("email")}
              disabled={busy === "password"}
            >
              Use a different email
            </button>
          </form>

          <form
            ref={otpPane}
            className={`${styles.view} ${paneClass("otp")}`}
            inert={view !== "otp"}
            aria-hidden={view !== "otp"}
            onSubmit={submitOtp}
          >
            <p className={styles.hint}>
              Enter the 6-digit code sent to <strong>{otpDestination || email}</strong>
            </p>
            <input
              ref={otpRef}
              className={`${styles.field} ${styles.otpField}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={otp}
              disabled={busy === "otp"}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              aria-label="Verification code"
              aria-invalid={Boolean(error && view === "otp")}
            />
            {errorFor("otp")}
            <button
              type="submit"
              className={styles.submit}
              disabled={busy === "otp" || otp.length < 6}
            >
              {busy === "otp" && <span className={styles.spinner} aria-hidden="true" />}
              {busy === "otp" ? "Verifying" : "Verify"}
            </button>
            <button
              type="button"
              className={styles.forgot}
              onClick={() => go("password")}
              disabled={busy === "otp"}
            >
              Back
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default LoginScreen;
