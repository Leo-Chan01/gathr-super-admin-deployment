"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, MoreHorizontal, Trash2 } from "lucide-react";
import AvatarIllustration from "../dashboard/AvatarIllustration";
import { ErrorState, InlineSpinner } from "../common/AsyncState";
import { useAuth } from "@/app/context/AuthContext";
import { listUsers, searchUsers } from "@/app/lib/api/admin";
import { str, userName } from "@/app/lib/api/adapters";
import { apiRequest, errorMessage } from "@/app/lib/api/client";
import { listAssignees } from "@/app/lib/api/support";
import type { Raw, UserRole } from "@/app/lib/api/types";
import { useResource } from "@/app/lib/hooks/useResource";
import styles from "./AccessControl.module.css";

type AdminRole = Exclude<UserRole, "USER">;

const ADMIN_ROLES: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "MODERATOR"];

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  USER: "User",
};

/**
 * The API has roles, not per-admin permission scopes, so the tags show what
 * each role can do. Swap this for real scopes if the backend adds them.
 */
const ROLE_SCOPES: Record<AdminRole, { label: string; tone: string }[]> = {
  SUPER_ADMIN: [
    { label: "Posts", tone: styles.tagPosts },
    { label: "KYC", tone: styles.tagKyc },
    { label: "Payouts", tone: styles.tagPayouts },
    { label: "Roles", tone: styles.tagRoles },
  ],
  ADMIN: [
    { label: "Posts", tone: styles.tagPosts },
    { label: "KYC", tone: styles.tagKyc },
    { label: "Payouts", tone: styles.tagPayouts },
  ],
  MODERATOR: [{ label: "Posts", tone: styles.tagPosts }],
};

interface Member {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
}

const toMember = (raw: Raw): Member => ({
  id: str(raw, "id") ?? "",
  email: str(raw, "email") ?? str(raw, "phone") ?? "—",
  name: userName({ ...raw, email: undefined }),
  avatar: str(raw, "avatar", "avatar.url"),
  role: (str(raw, "role") as UserRole) ?? "USER",
});

/** PATCH /admin/users/{id}/role — Super Admin only. */
const setRole = (id: string, role: UserRole) =>
  apiRequest(`/admin/users/${encodeURIComponent(id)}/role`, { method: "PATCH", body: { role } });

/** Avatars looked up per user, shared across renders and the search panel. */
const avatarCache = new Map<string, string | null>();

/**
 * GET /admin/users rows don't include `avatar`, so fill it in:
 * 1. the support assignees list (active admins, one request, has avatars);
 * 2. GET /users/{id} for anyone still missing. Failures just leave the illustration.
 */
const withAvatars = async (
  members: Member[],
  signal: AbortSignal,
  useAssignees: boolean,
): Promise<Member[]> => {
  if (useAssignees) {
    try {
      const assignees = await listAssignees({ signal });
      for (const profile of assignees) {
        if (profile.avatar) avatarCache.set(profile.id, profile.avatar);
      }
    } catch {
      // Fall through to per-user lookups.
    }
  }
  const missing = members.filter((member) => !member.avatar && !avatarCache.has(member.id)).slice(0, 25);
  await Promise.all(
    missing.map(async (member) => {
      try {
        const user = await apiRequest<Raw>(`/users/${encodeURIComponent(member.id)}`, { signal });
        avatarCache.set(member.id, str(user, "avatar", "avatar.url") ?? null);
      } catch {
        if (!signal.aborted) avatarCache.set(member.id, null);
      }
    }),
  );
  return members.map((member) => ({
    ...member,
    avatar: member.avatar ?? avatarCache.get(member.id) ?? undefined,
  }));
};

const loadAdmins = async (signal: AbortSignal) => {
  // The users endpoint filters one role at a time.
  const pages = await Promise.all(
    ADMIN_ROLES.map((role) => listUsers({ role, page: 1, limit: 100 }, { signal })),
  );
  return withAvatars(pages.flatMap((page) => page.items.map(toMember)), signal, true);
};

export type AccessView = "roles" | "new";

interface AccessControlProps {
  view: AccessView;
  /** Opens the New admin view (the dialog owns the heading and transition). */
  onNewAdmin: () => void;
  onDone: () => void;
}

export const AccessControl: React.FC<AccessControlProps> = ({ view, onNewAdmin, onDone }) => {
  if (view === "new") return <NewAdminView onDone={onDone} />;
  return <RolesView onNewAdmin={onNewAdmin} />;
};

const RolesView: React.FC<{ onNewAdmin: () => void }> = ({ onNewAdmin }) => {
  const { session } = useAuth();
  const me = session?.user;
  const canManage = me?.role === "SUPER_ADMIN";
  const admins = useResource(loadAdmins, []);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest("[data-menu-root]")) return;
      setMenuId(null);
      setConfirmRemove(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const changeRole = async (member: Member, role: UserRole) => {
    setBusyId(member.id);
    setError(null);
    setMenuId(null);
    setConfirmRemove(null);
    try {
      await setRole(member.id, role);
      admins.mutate((current) => {
        const list = current ?? [];
        if (role === "USER") return list.filter((entry) => entry.id !== member.id);
        const exists = list.some((entry) => entry.id === member.id);
        return exists
          ? list.map((entry) => (entry.id === member.id ? { ...entry, role } : entry))
          : [...list, { ...member, role }];
      });
    } catch (err) {
      setError(`Couldn't update ${member.name}: ${errorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const list = admins.data ?? [];

  return (
    <>
      <h3 className={styles.groupTitle}>Active admins</h3>
      {!canManage && (
        <p className={styles.hint}>Only super admins can change roles.</p>
      )}
      {error && <ErrorState message={error} compact />}

      {admins.error ? (
        <ErrorState message={admins.error} onRetry={admins.reload} compact />
      ) : admins.loading && !admins.data ? (
        <ul className={styles.list} aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className={styles.skeleton} />
          ))}
        </ul>
      ) : list.length === 0 ? (
        <p className={styles.hint}>No admins found.</p>
      ) : (
        <ul className={styles.list}>
          {list.map((entry) => {
            const isMe = entry.id === me?.id;
            const member = isMe ? { ...entry, avatar: str(me, "avatar", "avatar.url") ?? entry.avatar } : entry;
            const scopes = ROLE_SCOPES[member.role as AdminRole] ?? [];
            return (
              <li key={member.id} className={styles.member}>
                <MemberIdentity member={member} suffix={isMe ? " (you)" : undefined} />
                <div className={styles.tags} aria-label={`${ROLE_LABEL[member.role]} permissions`}>
                  {scopes.map((scope) => (
                    <span key={scope.label} className={`${styles.tag} ${scope.tone}`}>
                      {scope.label}
                    </span>
                  ))}
                </div>
                <div className={styles.menuRoot} data-menu-root>
                  <button
                    type="button"
                    className={styles.more}
                    aria-label={`Manage ${member.name}`}
                    aria-expanded={menuId === member.id}
                    disabled={!canManage || isMe || busyId === member.id}
                    title={
                      isMe ? "You can't change your own role" : !canManage ? "Super admins only" : undefined
                    }
                    onClick={() => {
                      setConfirmRemove(null);
                      setMenuId(menuId === member.id ? null : member.id);
                    }}
                  >
                    {busyId === member.id ? <InlineSpinner /> : <MoreHorizontal />}
                  </button>
                  {menuId === member.id && (
                    <div className={styles.menu} role="menu">
                      <p className={styles.menuLabel}>Role</p>
                      {ADMIN_ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          role="menuitemradio"
                          aria-checked={member.role === role}
                          className={`${styles.menuItem} ${member.role === role ? styles.menuItemActive : ""}`}
                          onClick={() => member.role !== role && changeRole(member, role)}
                        >
                          {ROLE_LABEL[role]}
                        </button>
                      ))}
                      <hr className={styles.menuDivider} />
                      <button
                        type="button"
                        role="menuitem"
                        className={`${styles.menuItem} ${styles.menuDanger}`}
                        onClick={() =>
                          confirmRemove === member.id ? changeRole(member, "USER") : setConfirmRemove(member.id)
                        }
                      >
                        {confirmRemove === member.id ? "Click again to remove" : "Remove admin access"}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        className={styles.newAdmin}
        onClick={onNewAdmin}
      >
        New admin
      </button>
    </>
  );
};

const MemberIdentity: React.FC<{ member: Member; suffix?: string }> = ({ member, suffix }) => (
  <div className={styles.identity}>
    <span className={styles.avatar}>
      {member.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.avatar} alt="" referrerPolicy="no-referrer" />
      ) : (
        <AvatarIllustration />
      )}
    </span>
    <span className={styles.identityText}>
      <span className={styles.email}>{member.email}</span>
      <span className={styles.name}>
        {member.name}
        {suffix}
      </span>
    </span>
  </div>
);

interface Invitee {
  member: Member;
  role: AdminRole | "";
  status: "idle" | "saving" | "saved" | "error";
  error?: string;
}

const toSearchMember = (user: Awaited<ReturnType<typeof searchUsers>>[number]): Member => ({
  id: user.id,
  email: user.email ?? user.phone ?? "—",
  name: userName({ ...user, email: undefined, phone: undefined }),
  avatar: user.avatar ?? undefined,
  role: "USER",
});

/**
 * New admin: look accounts up with GET /users/search, stage them with a role,
 * then Done applies PATCH /admin/users/{id}/role to each.
 */
const NewAdminView: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { session } = useAuth();
  const canManage = session?.user?.role === "SUPER_ADMIN";
  const [query, setQuery] = useState("");
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [searching, setSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  /** Several accounts matched a partial term — let the admin pick one. */
  const [choices, setChoices] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);

  const stage = (member: Member) => {
    if (invitees.some((entry) => entry.member.id === member.id)) {
      setLookupError(`${member.email} is already in the list.`);
      return;
    }
    if (member.id === session?.user?.id) {
      setLookupError("You can't change your own role.");
      return;
    }
    setInvitees((current) => [...current, { member, role: "", status: "idle" }]);
    setQuery("");
    setChoices([]);
    setLookupError(null);
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (searching) return;
    if (term.length < 2) {
      setLookupError("Enter at least 2 characters — an email or @username.");
      return;
    }
    setSearching(true);
    setLookupError(null);
    setChoices([]);
    try {
      const matches = (await searchUsers(term)).map(toSearchMember);
      const needle = term.replace(/^@/, "").toLowerCase();
      const exact = matches.find(
        (member) => member.email.toLowerCase() === needle || member.name.toLowerCase() === needle,
      );
      if (exact) stage(exact);
      else if (matches.length === 1) stage(matches[0]);
      else if (matches.length > 1) setChoices(matches);
      else setLookupError(`No Gathr account matches “${term}”.`);
    } catch (err) {
      setLookupError(errorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const update = (id: string, patch: Partial<Invitee>) =>
    setInvitees((current) => current.map((entry) => (entry.member.id === id ? { ...entry, ...patch } : entry)));

  const ready = invitees.length > 0 && invitees.every((entry) => entry.role) && !saving;

  const done = async () => {
    if (!ready) return;
    setSaving(true);
    let failed = false;
    for (const entry of invitees) {
      if (entry.status === "saved" || !entry.role) continue;
      update(entry.member.id, { status: "saving", error: undefined });
      try {
        await setRole(entry.member.id, entry.role);
        update(entry.member.id, { status: "saved" });
      } catch (err) {
        failed = true;
        update(entry.member.id, { status: "error", error: errorMessage(err) });
      }
    }
    setSaving(false);
    // Stay on the view so failures can be fixed or removed.
    if (!failed) onDone();
  };

  return (
    <div className={styles.newView}>
      <p className={styles.inviteLabel}>Enter the email of someone you want to invite</p>
      {!canManage && <p className={styles.hint}>Only super admins can assign roles — saving will be refused.</p>}

      {invitees.length > 0 && (
        <ul className={styles.invitees}>
          {invitees.map((entry) => (
            <li key={entry.member.id} className={styles.invitee}>
              <div className={styles.inviteeRow}>
                <span className={styles.inviteeEmail} title={entry.member.name}>
                  <span className={styles.bullet} aria-hidden="true">•</span>
                  {entry.member.email}
                </span>
                <span className={styles.roleSelect}>
                  <select
                    value={entry.role}
                    aria-label={`Role for ${entry.member.email}`}
                    disabled={entry.status === "saving" || entry.status === "saved"}
                    className={entry.role ? undefined : styles.rolePlaceholder}
                    onChange={(event) =>
                      update(entry.member.id, { role: event.target.value as AdminRole, status: "idle", error: undefined })
                    }
                  >
                    <option value="" disabled>
                      Assign a role to this admin
                    </option>
                    {ADMIN_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={styles.roleChevron} aria-hidden="true" />
                </span>
                <button
                  type="button"
                  className={styles.trash}
                  aria-label={`Remove ${entry.member.email}`}
                  disabled={entry.status === "saving"}
                  onClick={() =>
                    setInvitees((current) => current.filter((item) => item.member.id !== entry.member.id))
                  }
                >
                  {entry.status === "saving" ? <InlineSpinner /> : <Trash2 aria-hidden="true" />}
                </button>
              </div>
              {entry.status === "error" && <p className={styles.inviteError}>{entry.error}</p>}
              {entry.status === "saved" && <p className={styles.inviteSaved}>Role assigned</p>}
            </li>
          ))}
        </ul>
      )}

      <form className={styles.inviteRow} onSubmit={add}>
        <input
          autoFocus
          type="text"
          inputMode="email"
          autoComplete="off"
          aria-label="Email or username"
          className={styles.inviteInput}
          value={query}
          aria-invalid={Boolean(lookupError)}
          aria-describedby={lookupError ? "invite-error" : undefined}
          onChange={(event) => {
            setQuery(event.target.value);
            setLookupError(null);
          }}
        />
        <button type="submit" className={styles.addButton} disabled={searching}>
          {searching ? <InlineSpinner /> : "Add"}
        </button>
      </form>
      {lookupError && (
        <p id="invite-error" className={styles.inviteHint} role="alert">
          {lookupError}
        </p>
      )}

      {choices.length > 0 && (
        <div className={styles.results}>
          <p className={styles.hint}>Several accounts match — pick one:</p>
          <ul className={styles.list}>
            {choices.map((member) => (
              <li key={member.id}>
                <button type="button" className={styles.choice} onClick={() => stage(member)}>
                  <MemberIdentity member={member} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" className={styles.done} disabled={!ready} onClick={done}>
        {saving ? <InlineSpinner /> : null} Done
      </button>
    </div>
  );
};

export default AccessControl;
