import CryptoJS from 'crypto-js';

interface VaultData {
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  // Card fields
  card_number?: string;
  cvv?: string;
  expiry_month?: string;
  expiry_year?: string;
  cardholder_name?: string;
  // Identity fields
  document_type?: string;
  document_number?: string;
  full_name?: string;
  date_of_birth?: string;
  expiry_date?: string;
  // Note fields
  content?: string;
}

class EncryptionService {
  private masterKey: string | null = null;

  /**
   * Set master key derived from user's password
   */
  setMasterKey(password: string, userSalt: string): void {
    // Use PBKDF2 to derive a strong key from password
    this.masterKey = CryptoJS.PBKDF2(password, userSalt, {
      keySize: 256 / 32,        // 256-bit key
      iterations: 10000,        // 10,000 iterations
      hasher: CryptoJS.algo.SHA256
    }).toString();
    
    console.log('🔐 Master key set for encryption');
  }

  /**
   * Encrypt sensitive vault data
   */
  encrypt(data: VaultData): string {
    if (!this.masterKey) {
      throw new Error('Master key not set. Please login first.');
    }
    
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.masterKey).toString();
      
      console.log('🔒 Data encrypted successfully');
      return encrypted;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt vault data
   */
  decrypt(encryptedData: string): VaultData {
    if (!this.masterKey) {
      throw new Error('Master key not set. Please login first.');
    }

    if (!encryptedData || encryptedData.trim() === '') {
      return {};
    }

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.masterKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Invalid decryption result');
      }
      
      const data = JSON.parse(decryptedString);
      console.log('🔓 Data decrypted successfully');
      return data;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      // Return empty object instead of throwing to handle corrupted data gracefully
      return {};
    }
  }

  /**
   * Calculate password strength on client-side
   */
  calculatePasswordStrength(password: string): 'strong' | 'weak' | 'compromised' {
    if (!password) return 'weak';
    
    let score = 0;
    
    // Length checks
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) score++;      // Uppercase
    if (/[a-z]/.test(password)) score++;      // Lowercase  
    if (/[0-9]/.test(password)) score++;      // Numbers
    if (/[^A-Za-z0-9]/.test(password)) score++; // Special chars
    
    // Complexity bonus
    if (password.length >= 12 && score >= 4) score++;
    
    if (score >= 6) return 'strong';
    if (score >= 3) return 'weak';
    return 'compromised';
  }

  /**
   * Generate secure password
   */
  generatePassword(length: number = 16, includeSymbols: boolean = true): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let charset = lowercase + uppercase + numbers;
    if (includeSymbols) {
      charset += symbols;
    }
    
    let password = '';
    
    // Ensure at least one character from each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    if (includeSymbols) {
      password += symbols[Math.floor(Math.random() * symbols.length)];
    }
    
    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if encryption service is ready
   */
  isReady(): boolean {
    return this.masterKey !== null;
  }

  /**
   * Clear master key from memory (on logout)
   */
  clearKey(): void {
    this.masterKey = null;
    console.log('🗑️ Master key cleared from memory');
  }

  /**
   * Generate user salt based on user ID
   */
  static generateUserSalt(userId: number): string {
    return `locksmith_user_${userId}_salt_v1`;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Export types
export type { VaultData };
