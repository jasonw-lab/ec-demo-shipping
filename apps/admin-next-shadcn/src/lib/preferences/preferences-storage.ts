"use client";

import { setClientCookie } from "../cookie.client";
import { setLocalStorageValue } from "../local-storage.client";
import { PREFERENCE_PERSISTENCE, type PreferenceKey } from "./preferences-config";

export async function persistPreference(key: PreferenceKey, value: string) {
  const mode = PREFERENCE_PERSISTENCE[key];

  switch (mode) {
    case "none":
      return;

    case "client-cookie":
    case "server-cookie": // Use client-cookie for SPA mode
      setClientCookie(key, value);
      return;

    case "localStorage":
      setLocalStorageValue(key, value);
      return;

    default:
      return;
  }
}
