export const filterIPAddressKey = (event: KeyboardEvent): void => {
  if ((event.ctrlKey || event.metaKey) && !event.altKey) {
    return;
  }

  if ([...event.key].length !== 1) {
    return;
  }

  if (!/^[0-9.:[\]a-fA-F]$/.test(event.key)) {
    event.preventDefault();
  }
};

const IPV4 = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_GROUP = /^[0-9a-f]{1,4}$/i;

// Accepts what Go's netip.ParseAddr accepts: IPv4 without leading zeros, IPv6 with an optional zone, no CIDR.
export const isIPAddress = (value: string): boolean => {
  if (IPV4.test(value)) return true;
  const zoneAt = value.indexOf('%');
  if (zoneAt === value.length - 1) return false;
  let address = zoneAt < 0 ? value : value.slice(0, zoneAt);
  const lastColon = address.lastIndexOf(':');
  const tail = address.slice(lastColon + 1);
  if (tail.includes('.')) {
    // an IPv4 tail (::ffff:1.2.3.4) stands for the last two groups
    if (lastColon < 0 || !IPV4.test(tail)) return false;
    address = `${address.slice(0, lastColon + 1)}0:0`;
  }
  const halves = address.split('::');
  if (halves.length > 2) return false;
  const groups = halves.flatMap((half) => (half === '' ? [] : half.split(':')));
  if (!groups.every((group) => IPV6_GROUP.test(group))) return false;
  return halves.length === 2 ? groups.length < 8 : groups.length === 8;
};

export const normalizeIPAddress = (value: string | undefined): string | undefined => {
  if (value === undefined || value === null) return value ?? undefined;
  const trimmed = String(value).trim();
  return /^\[.*\]$/.test(trimmed) ? trimmed.slice(1, -1).trim() : trimmed;
};
