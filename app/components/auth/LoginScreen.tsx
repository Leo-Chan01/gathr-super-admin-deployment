"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import appLogo from "@/public/images/gathr-logo(light).png";
import styles from "./LoginScreen.module.css";

type LoginView = "password" | "email";

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const passwordPane = useRef<HTMLFormElement>(null);
  const emailPane = useRef<HTMLFormElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<LoginView>("email");
  const [stageHeight, setStageHeight] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"email" | "password" | null>(null);
  const actionToken = useRef(0);

  useEffect(() => {
    const node = view === "password" ? passwordPane.current : emailPane.current;
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
    const frame = window.requestAnimationFrame(() => {
      if (view === "password") passwordRef.current?.focus();
      else emailRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  const showEmail = () => {
    if (busy) return;
    setView("email");
  };

  const continueWithEmail = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const token = actionToken.current + 1;
    actionToken.current = token;
    setBusy("email");
    window.setTimeout(() => {
      if (token !== actionToken.current) return;
      setBusy(null);
      setView("password");
    }, 900);
  };

  const login = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const token = actionToken.current + 1;
    actionToken.current = token;
    setBusy("password");
    window.setTimeout(() => {
      if (token !== actionToken.current) return;
      router.push("/dashboard");
    }, 1100);
  };

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
            className={`${styles.view} ${view === "email" ? styles.viewOn : styles.viewOffUp}`}
            inert={view !== "email"}
            aria-hidden={view !== "email"}
            onSubmit={continueWithEmail}
          >
            <input
              ref={emailRef}
              className={styles.field}
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              disabled={busy === "email"}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email"
            />
            <button
              type="submit"
              className={styles.submit}
              disabled={busy === "email"}
            >
              {busy === "email" && (
                <span className={styles.spinner} aria-hidden="true" />
              )}
              {busy === "email" ? "Checking email" : "Continue"}
            </button>
          </form>

          <form
            ref={passwordPane}
            className={`${styles.view} ${view === "password" ? styles.viewOn : styles.viewOffDown}`}
            inert={view !== "password"}
            aria-hidden={view !== "password"}
            onSubmit={login}
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
            />
            <button
              type="submit"
              className={styles.submit}
              disabled={busy === "password"}
            >
              {busy === "password" && (
                <span className={styles.spinner} aria-hidden="true" />
              )}
              {busy === "password" ? "Logging in" : "Login"}
            </button>
            <button
              type="button"
              className={styles.forgot}
              onClick={showEmail}
              disabled={busy === "password"}
            >
              Forgot password?
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default LoginScreen;
