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
 *   - [ ]           Xray accepts IPv6 addresses wrapped as [::] (brackets optional)
 *   - a-f / A-F     IPv6 hexadecimal (compressed) notation
 * Every non-printable key (Enter, arrows, Backspace, …) is passed through, and
 * Ctrl/Cmd shortcuts (copy, paste, select-all) are allowed. Alt/AltGr
 * combinations are validated like normal input so they cannot inject
 * characters outside the IPv4/IPv6 character set.
 */
export const filterIPAddressKey = (event: KeyboardEvent): void => {
  // Allow Ctrl/Cmd shortcuts, but not Alt/AltGr (reported as Ctrl+Alt) which
  // can emit characters and must be validated.
  if ((event.ctrlKey || event.metaKey) && !event.altKey) {
    return;
  }

  // Pass through every non-printable key (Enter, arrows, editing keys, …).
  // Use code-point count, not UTF-16 length: an astral character like an emoji
  // is one code point but two UTF-16 units, so `event.key.length` would wrongly
  // treat it as a control key and let it bypass the allowlist below.
  if ([...event.key].length !== 1) {
    return;
  }

  // Block any character that is not part of an IPv4/IPv6 address.
  if (!/^[0-9.:[\]a-fA-F]$/.test(event.key)) {
    event.preventDefault();
  }
};

export const normalizeIPAddress = (value: string | undefined): string | undefined => {
  if (value === undefined || value === null) return value ?? undefined;
  const trimmed = String(value).trim();
  const unwrapped = /^\[.*\]$/.test(trimmed) ? trimmed.slice(1, -1).trim() : trimmed;
  return unwrapped;
};
