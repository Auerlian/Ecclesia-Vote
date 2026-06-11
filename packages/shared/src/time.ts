import { HAS_VOTED_BUCKET_MINUTES } from "./constants";

/**
 * Truncate a timestamp down to a fixed bucket (default 10 minutes). Used for
 * `has_voted_bucket` and for coarsening ballot audit-event timestamps (redline Edit D),
 * so a single ballot arrival cannot be aligned to a single has_voted flip.
 *
 * Deterministic and timezone-independent (operates on epoch millis, floors to bucket).
 */
export function truncateToBucket(date: Date, minutes: number = HAS_VOTED_BUCKET_MINUTES): Date {
  const ms = minutes * 60_000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

/** ISO-8601 string of the bucketed time (what gets stored / hashed). */
export function bucketIso(date: Date, minutes: number = HAS_VOTED_BUCKET_MINUTES): string {
  return truncateToBucket(date, minutes).toISOString();
}
