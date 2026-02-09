export default { strictEqual: (actual, expected, message) => { if (actual !== expected) throw new Error(message || `Expected ${expected} but got ${actual}`); } };
