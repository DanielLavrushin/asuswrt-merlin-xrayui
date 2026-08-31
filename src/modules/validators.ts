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

export const normalizeIPAddress = (value: string | undefined): string | undefined => {
  if (value === undefined || value === null) return value ?? undefined;
  const trimmed = String(value).trim();
  return /^\[.*\]$/.test(trimmed) ? trimmed.slice(1, -1).trim() : trimmed;
};
