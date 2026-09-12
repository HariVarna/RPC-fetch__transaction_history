const { ethers } = require('ethers');

/**
 * Validates and normalizes an Ethereum address.
 * 
 * @param {string} address The Ethereum address to validate.
 * @returns {Object} { valid: boolean, normalizedAddress: string | null, error: string | null }
 */
const validateAndNormalizeAddress = (address) => {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    return { valid: false, normalizedAddress: null, error: 'Address cannot be empty' };
  }

  const trimmedAddress = address.trim();

  // Length check (0x + 40 hex chars)
  if (trimmedAddress.length !== 42) {
    return { valid: false, normalizedAddress: null, error: 'Incorrect address length' };
  }

  // Prefix check
  if (!trimmedAddress.startsWith('0x')) {
    return { valid: false, normalizedAddress: null, error: 'Malformed address: must start with 0x' };
  }

  // Hexadecimal character check
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
    return { valid: false, normalizedAddress: null, error: 'Contains invalid hexadecimal characters' };
  }

  try {
    // ethers.getAddress validates the checksum if the address has mixed casing.
    // It accepts all lowercase or all uppercase addresses and correctly calculates their checksum.
    const checksummedAddress = ethers.getAddress(trimmedAddress);
    
    return { 
      valid: true, 
      normalizedAddress: checksummedAddress.toLowerCase(), 
      error: null 
    };
  } catch (error) {
    return { 
      valid: false, 
      normalizedAddress: null, 
      error: 'Invalid address checksum' 
    };
  }
};

module.exports = {
  validateAndNormalizeAddress
};
