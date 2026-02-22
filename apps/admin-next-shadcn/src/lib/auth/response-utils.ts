import type { User } from "@/lib/auth/types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function unwrapApiData<T extends object = UnknownRecord>(value: unknown): Partial<T> {
  if (!isRecord(value)) return {};

  const maybeData = value.data;
  if (isRecord(maybeData)) {
    return maybeData as Partial<T>;
  }

  return value as Partial<T>;
}

export function resolveTokenExpiry(payload: { expires_at?: unknown; expires_in?: unknown }): {
  expiresAtMs: number;
  expiresInSeconds: number;
} {
  if (typeof payload.expires_in === "number" && Number.isFinite(payload.expires_in) && payload.expires_in > 0) {
    const expiresInSeconds = Math.floor(payload.expires_in);
    return {
      expiresAtMs: Date.now() + expiresInSeconds * 1000,
      expiresInSeconds,
    };
  }

  if (typeof payload.expires_at === "string") {
    const expiresAtMs = new Date(payload.expires_at).getTime();
    if (Number.isFinite(expiresAtMs)) {
      return {
        expiresAtMs,
        expiresInSeconds: Math.max(Math.floor((expiresAtMs - Date.now()) / 1000), 1),
      };
    }
  }

  throw new Error("Token expiry is missing or invalid");
}

export function normalizeUser(value: unknown): User | null {
  if (!isRecord(value)) return null;

  const idRaw = value.id;
  const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
  if (!Number.isFinite(id)) return null;

  const username = asString(value.username);
  const displayName = asString(value.display_name) || asString(value.displayName) || username;
  if (!username && !displayName) return null;

  return {
    id,
    username: username || `user-${id}`,
    display_name: displayName || username || `User ${id}`,
    email: asString(value.email),
    roles: asStringArray(value.roles),
    permissions: asStringArray(value.permissions),
  };
}
