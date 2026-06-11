import { MockEngine } from "@ecclesia/ballot-engine";
import type { SecurityClass } from "@ecclesia/shared";

/**
 * The active ballot engine for this deployment. v0.1 = MockEngine (PROTOTYPE). The persistent
 * security banner (components/PrototypeBanner) is keyed off this value, so swapping to a v0.2
 * E2E_VERIFIABLE engine automatically changes the UI's security messaging (WP-09).
 */
export const activeEngine = new MockEngine();
export const activeSecurityClass: SecurityClass = activeEngine.securityClass;
export const isPrototype = activeSecurityClass === "PROTOTYPE";
