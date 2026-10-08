export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string; details?: unknown };

export class ActionError extends Error {
  constructor(message: string, readonly details?: unknown) {
    super(message);
    this.name = 'ActionError';
  }
}

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string, details?: unknown): { ok: false; error: string; details?: unknown } {
  return details === undefined ? { ok: false, error } : { ok: false, error, details };
}

// Wraps an action body so nothing is ever thrown to the client.
export async function runAction<T>(body: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await body();
  } catch (e) {
    if (e instanceof ActionError) return fail(e.message, e.details);
    console.error(e);
    return fail('unexpected');
  }
}
