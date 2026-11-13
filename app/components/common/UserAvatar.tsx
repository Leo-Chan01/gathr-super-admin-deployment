"use client";

import React, { useState } from "react";
import AvatarIllustration from "../dashboard/AvatarIllustration";
import styles from "./UserAvatar.module.css";
import { imageSrc } from "../../lib/imageSrc";

interface UserAvatarProps {
  /** Raw `avatar`/`logoUrl` from the API; the illustration shows when absent. */
  src?: string | null;
  alt?: string;
  /** Extra class for the illustration fallback. */
  className?: string;
  /** Replaces the default image sizing (52–54px rounded square). */
  imageClassName?: string;
  /** Replaces the illustration fallback entirely. */
  fallback?: React.ReactNode;
}

/**
 * Shows the user's real avatar, falling back to the placeholder illustration
 * when there is no URL or the image fails to load.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = "",
  className = "",
  imageClassName = styles.image,
  fallback,
}) => {
  const url = imageSrc(src);
  // Remember which URL failed so a new URL gets a fresh attempt.
  const [failedUrl, setFailedUrl] = useState<string>();

  if (!url || failedUrl === url) {
    return <>{fallback ?? <AvatarIllustration className={className} />}</>;
  }

  return (
    // Plain <img>: avatars come from arbitrary storage hosts (S3, Google…).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      // Google profile photos refuse requests that carry a referrer.
      referrerPolicy="no-referrer"
      className={imageClassName}
      onError={() => setFailedUrl(url)}
    />
  );
};

export default UserAvatar;
