
export const CUT_LENGTH = 66;

export function shortenString(s: string) {
  return s.length > CUT_LENGTH ? `${s.slice(0, CUT_LENGTH)}...` : s;
}

export function toSmartString(item: unknown, fullObject: boolean = false): string {
  if (item === null) {
    return 'null';
  }
  if (item === undefined) {
    return 'undefined';
  }
  if (Array.isArray(item)) {
    return `[${item.map(item => toSmartString(item, fullObject)).join(', ')}]`;
  }

  if (typeof item === 'object' && 'toJSON' in item && typeof item.toJSON === 'function') {
    return toSmartString(item.toJSON(), fullObject);
  }

  if (item instanceof Map) {
    return `{${Array.from(item.entries()).map(([k, v]) => `${shortenString(k)}: ${toSmartString(v)}`).join(', ')}}`;
  }

  if (String(item) === {}.toString()) {
    if (Object.keys(item).length === 0) {
      return '{}';
    }
    if (fullObject) {
      const itemRecord = item as Record<string, unknown>;
      return `{\n${Object.keys(item).map(key => `${key}: ${toSmartString(itemRecord[key])}`).join(',\n')} }`;
    }
    return '{...}';
  }

  return String(item)
}
