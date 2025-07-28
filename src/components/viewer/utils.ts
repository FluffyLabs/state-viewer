
export const CUT_LENGTH = 66;

export function shortenString(s: string) {
  return s.length > CUT_LENGTH ? `${s.slice(0, CUT_LENGTH)}...` : s;
}

export function toSmartString(item: unknown): string {
  if (item === null) {
    return 'null';
  }
  if (item === undefined) {
    return 'undefined';
  }
  if (Array.isArray(item)) {
    return `[${item.map(toSmartString).join(', ')}]`;
  }

  if (typeof item === 'object' && 'toJSON' in item && typeof item.toJSON === 'function') {
    return toSmartString(item.toJSON());
  }

  if (item instanceof Map) {
    return `{${Array.from(item.entries()).map(([k, v]) => `${shortenString(k)}: ${toSmartString(v)}`).join(', ')}}`;
  }

  if (String(item) === {}.toString()) {
    if (Object.keys(item).length === 0) {
      return '{}';
    }

    return '{...}';
  }

  return String(item)
}
