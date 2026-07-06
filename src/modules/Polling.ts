export interface Poller {
  start(): void;
  stop(): void;
}

export function createPoller(task: () => Promise<void> | void, intervalMs: number): Poller {
  let handle: number | null = null;
  let active = false;

  const tick = async () => {
    try {
      await task();
    } catch (error) {
      console.error('Polling error:', error);
    }
    if (active) {
      handle = window.setTimeout(tick, intervalMs);
    }
  };

  return {
    start() {
      if (active) return;
      active = true;
      tick();
    },
    stop() {
      active = false;
      if (handle !== null) {
        clearTimeout(handle);
        handle = null;
      }
    }
  };
}
