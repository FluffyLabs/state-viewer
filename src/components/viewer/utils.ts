export const CUT_LENGTH = 66;

export function shortenString(s: string) {
  return s.length > CUT_LENGTH ? `${s.slice(0, CUT_LENGTH)}...` : s;
}

export function toSmartString(item: unknown, options: {
  fullObject?: boolean,
  showBytesLength?: boolean,
}): string {
  const {
    fullObject = false,
    showBytesLength = false,
  } = options;

  if (item === null) {
    return 'null';
  }

  if (item === undefined) {
    return 'undefined';
  }

  if (Array.isArray(item)) {
    return `[${item.map(item => toSmartString(item, options)).join(', ')}]`;
  }

  if (typeof item === 'object' && 'toJSON' in item && typeof item.toJSON === 'function') {
    return toSmartString(item.toJSON(), options);
  }

  if (item instanceof Map) {
    return `{${Array.from(item.entries()).map(([k, v]) => `${shortenString(k)}: ${toSmartString(v, options)}`).join(', ')}}`;
  }

  if (String(item) === {}.toString()) {
    if (Object.keys(item).length === 0) {
      return '{}';
    }
    if (fullObject) {
      const itemRecord = item as Record<string, unknown>;
      return `{\n${Object.keys(item).map(key => `  ${key}: ${toSmartString(itemRecord[key], options)}`).join(',\n')}\n}`;
    }
    return '{...}';
  }

  const str = String(item);
  if (showBytesLength && str.startsWith('0x')) {
    return `(${str.length / 2 - 1} bytes) ${str}`;
  }

  return str;
}
