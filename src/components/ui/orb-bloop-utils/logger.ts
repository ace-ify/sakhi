export const logger = {
  info: (...args: unknown[]) => console.info("[OrbBloop]", ...args),
  warn: (...args: unknown[]) => console.warn("[OrbBloop]", ...args),
  error: (...args: unknown[]) => console.error("[OrbBloop]", ...args),
};

