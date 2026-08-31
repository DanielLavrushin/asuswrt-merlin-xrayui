import { filterIPAddressKey, normalizeIPAddress } from './validators';

const press = (key: string, modifiers: Partial<KeyboardEventInit> = {}) => {
  const event = {
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...modifiers,
    prevented: false
  } as unknown as KeyboardEvent & { prevented: boolean };
  (event as unknown as { preventDefault: () => void }).preventDefault = () => {
    (event as unknown as { prevented: boolean }).prevented = true;
  };
  filterIPAddressKey(event);
  return (event as unknown as { prevented: boolean }).prevented;
};

describe('filterIPAddressKey', () => {
  it.each(['0', '9', '.', ':', '[', ']', 'a', 'f', 'A', 'F'])('allows %s', (key) => {
    expect(press(key)).toBe(false);
  });

  it.each(['g', 'z', 'Z', '/', '%', ' ', '-', '_'])('blocks %s', (key) => {
    expect(press(key)).toBe(true);
  });

  it.each(['Enter', 'Backspace', 'ArrowLeft', 'Tab', 'Delete'])('passes through %s', (key) => {
    expect(press(key)).toBe(false);
  });

  it('allows ctrl/cmd shortcuts', () => {
    expect(press('v', { ctrlKey: true })).toBe(false);
    expect(press('v', { metaKey: true })).toBe(false);
  });

  it('still validates ctrl+alt (AltGr) combinations', () => {
    expect(press('z', { ctrlKey: true, altKey: true })).toBe(true);
    expect(press('a', { ctrlKey: true, altKey: true })).toBe(false);
  });

  it('blocks astral characters counted by code point', () => {
    expect(press('😀')).toBe(true);
  });
});

describe('normalizeIPAddress', () => {
  it('unwraps bracketed IPv6 addresses', () => {
    expect(normalizeIPAddress('[::]')).toBe('::');
    expect(normalizeIPAddress('[2001:db8::1]')).toBe('2001:db8::1');
    expect(normalizeIPAddress(' [ ::1 ] ')).toBe('::1');
  });

  it('leaves unbracketed addresses untouched', () => {
    expect(normalizeIPAddress('::')).toBe('::');
    expect(normalizeIPAddress('0.0.0.0')).toBe('0.0.0.0');
    expect(normalizeIPAddress('127.0.0.1')).toBe('127.0.0.1');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeIPAddress('  192.168.1.1  ')).toBe('192.168.1.1');
  });

  it('passes undefined through', () => {
    expect(normalizeIPAddress(undefined)).toBeUndefined();
  });
});
