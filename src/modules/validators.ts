/**
 * Keypress filter for IP address inputs.
 *
 * Inbound fields such as `listen` originally used ASUS firmware's global
 * `validator.isIPAddr`, which only allows digits and dots. That blocks the
 * colon, brackets and hexadecimal letters required by IPv6 addresses, making
 * it impossible to type an IPv6 listen address in the UI (e.g. `[::]`,
 * `[2001:db8::1]`).
 *
 * This filter allows every character needed for IPv4 and IPv6 addresses and
 * prevents the default action for anything else:
 *   - 0-9           digits
 *   - .             IPv4 dotted notation
 *   - :             IPv6 segment separator
 *   - [ ]           Xray requires IPv6 addresses wrapped as [::]
 *   - a-f / A-F     IPv6 hexadecimal (compressed) notation
 * Control keys (Backspace, arrows, Home/End, Tab) and key combinations with a
 * modifier (copy/paste, etc.) are always allowed.
 */
export const filterIPAddressKey = (event: KeyboardEvent): void => {
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return; // Allow Ctrl / Cmd / Alt combinations (copy, paste, etc.)
  }

  const key = event.key;

  // Non-character editing keys: let the browser handle them.
  if (
    key === 'Backspace' ||
    key === 'Delete' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'Home' ||
    key === 'End' ||
    key === 'Tab'
  ) {
    return;
  }

  // Allow only IPv4 / IPv6 address characters.
  if (!/^[0-9.:\[\]a-fA-F]$/.test(key)) {
    event.preventDefault();
  }
};
