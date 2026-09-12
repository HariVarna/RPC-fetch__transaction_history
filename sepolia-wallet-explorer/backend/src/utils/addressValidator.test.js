const { describe, it } = require('node:test');
const assert = require('node:assert');
const { validateAndNormalizeAddress } = require('./addressValidator');

describe('Address Validator', () => {
  const validAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik's address
  const normalized = validAddress.toLowerCase();

  it('should accept valid checksummed addresses and normalize to lowercase', () => {
    const result = validateAndNormalizeAddress(validAddress);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.normalizedAddress, normalized);
    assert.strictEqual(result.error, null);
  });

  it('should accept valid lowercase addresses', () => {
    const result = validateAndNormalizeAddress(validAddress.toLowerCase());
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.normalizedAddress, normalized);
  });

  it('should accept valid uppercase addresses (excluding 0x)', () => {
    const result = validateAndNormalizeAddress('0x' + validAddress.slice(2).toUpperCase());
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.normalizedAddress, normalized);
  });

  it('should reject empty input', () => {
    const result1 = validateAndNormalizeAddress('');
    assert.strictEqual(result1.valid, false);
    assert.strictEqual(result1.error, 'Address cannot be empty');

    const result2 = validateAndNormalizeAddress('   ');
    assert.strictEqual(result2.valid, false);
    assert.strictEqual(result2.error, 'Address cannot be empty');

    const result3 = validateAndNormalizeAddress(null);
    assert.strictEqual(result3.valid, false);
  });

  it('should reject incorrect length', () => {
    const result = validateAndNormalizeAddress('0x123');
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'Incorrect address length');
  });

  it('should reject malformed format (no 0x)', () => {
    const noPrefix = validAddress.slice(2);
    const result = validateAndNormalizeAddress(noPrefix);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'Incorrect address length'); // Falls into length since it's 40 chars
  });

  it('should reject malformed format (no 0x but 42 length)', () => {
    const noPrefix = 'xx' + validAddress.slice(2);
    const result = validateAndNormalizeAddress(noPrefix);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'Malformed address: must start with 0x');
  });

  it('should reject invalid hexadecimal characters', () => {
    const invalidChars = validAddress.slice(0, 41) + 'z';
    const result = validateAndNormalizeAddress(invalidChars);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'Contains invalid hexadecimal characters');
  });

  it('should reject addresses with bad checksums', () => {
    // Change a lowercase letter to uppercase in a mixed-case address to break checksum
    const badChecksum = '0xd8DA6BF26964AF9D7eEd9e03E53415D37aA96045'; 
    const result = validateAndNormalizeAddress(badChecksum);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'Invalid address checksum');
  });
});
