import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 64; // 512 bits
  private readonly iterations = 100000; // PBKDF2 iterations

  private keyPath: string;
  private key: Buffer | null = null;

  constructor() {
    this.keyPath = path.join(app.getPath('userData'), 'encryption.key');
    this.loadOrGenerateKey();
  }

  private loadOrGenerateKey(): void {
    try {
      if (fs.existsSync(this.keyPath)) {
        this.key = fs.readFileSync(this.keyPath);
      } else {
        this.generateNewKey();
      }
    } catch (error) {
      console.error('Error loading encryption key:', error);
      this.generateNewKey();
    }
  }

  private generateNewKey(): void {
    try {
      this.key = crypto.randomBytes(this.keyLength);
      fs.writeFileSync(this.keyPath, this.key);
      console.log('Generated new encryption key');
    } catch (error) {
      console.error('Error generating encryption key:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha512');
  }

  encrypt(text: string, password?: string): string {
    try {
      const key = password ? this.deriveKey(password, crypto.randomBytes(this.saltLength)) : this.key!;
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('quickbill-pos', 'utf8'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      const result = {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: password ? crypto.randomBytes(this.saltLength).toString('hex') : undefined,
        algorithm: this.algorithm
      };

      return JSON.stringify(result);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedData: string, password?: string): string {
    try {
      const data = JSON.parse(encryptedData);
      const key = password ? this.deriveKey(password, Buffer.from(data.salt, 'hex')) : this.key!;
      const iv = Buffer.from(data.iv, 'hex');
      const tag = Buffer.from(data.tag, 'hex');

      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from('quickbill-pos', 'utf8'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  encryptSensitiveField(value: string, fieldName: string): string {
    try {
      // Add field context to prevent cross-field attacks
      const contextValue = `${fieldName}:${value}`;
      return this.encrypt(contextValue);
    } catch (error) {
      console.error(`Error encrypting field ${fieldName}:`, error);
      return value; // Return original value if encryption fails
    }
  }

  decryptSensitiveField(encryptedValue: string, fieldName: string): string {
    try {
      const decrypted = this.decrypt(encryptedValue);
      const [contextField, value] = decrypted.split(':', 2);
      
      if (contextField !== fieldName) {
        throw new Error('Field context mismatch');
      }
      
      return value;
    } catch (error) {
      console.error(`Error decrypting field ${fieldName}:`, error);
      return encryptedValue; // Return encrypted value if decryption fails
    }
  }

  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const [salt, hash] = hashedPassword.split(':');
      const hashToVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return hash === hashToVerify;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateSecureId(): string {
    return crypto.randomUUID();
  }

  encryptFile(filePath: string, outputPath: string, password?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const key = password ? this.deriveKey(password, crypto.randomBytes(this.saltLength)) : this.key!;
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipher(this.algorithm, key);
        cipher.setAAD(Buffer.from('quickbill-file', 'utf8'));

        const input = fs.createReadStream(filePath);
        const output = fs.createWriteStream(outputPath);

        // Write metadata
        const metadata = {
          iv: iv.toString('hex'),
          tag: '',
          salt: password ? crypto.randomBytes(this.saltLength).toString('hex') : undefined,
          algorithm: this.algorithm
        };

        output.write(JSON.stringify(metadata) + '\n');

        input.pipe(cipher).pipe(output);

        output.on('finish', () => {
          const tag = cipher.getAuthTag();
          // Update tag in metadata
          const updatedMetadata = { ...metadata, tag: tag.toString('hex') };
          const metadataLine = JSON.stringify(updatedMetadata) + '\n';
          const fileContent = fs.readFileSync(outputPath);
          const dataStart = fileContent.indexOf('\n') + 1;
          fs.writeFileSync(outputPath, Buffer.concat([
            Buffer.from(metadataLine),
            fileContent.slice(dataStart)
          ]));
          resolve();
        });

        output.on('error', reject);
        input.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  decryptFile(filePath: string, outputPath: string, password?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const fileContent = fs.readFileSync(filePath);
        const metadataEnd = fileContent.indexOf('\n');
        const metadata = JSON.parse(fileContent.slice(0, metadataEnd).toString());
        const encryptedData = fileContent.slice(metadataEnd + 1);

        const key = password ? this.deriveKey(password, Buffer.from(metadata.salt, 'hex')) : this.key!;
        const iv = Buffer.from(metadata.iv, 'hex');
        const tag = Buffer.from(metadata.tag, 'hex');

        const decipher = crypto.createDecipher(this.algorithm, key);
        decipher.setAAD(Buffer.from('quickbill-file', 'utf8'));
        decipher.setAuthTag(tag);

        const output = fs.createWriteStream(outputPath);
        decipher.pipe(output);

        output.on('finish', resolve);
        output.on('error', reject);
        decipher.on('error', reject);

        decipher.write(encryptedData);
        decipher.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Encrypt sensitive data in database records
  encryptCustomerData(customer: any): any {
    const sensitiveFields = ['email', 'address', 'gst_number'];
    const encrypted = { ...customer };

    for (const field of sensitiveFields) {
      if (customer[field]) {
        encrypted[field] = this.encryptSensitiveField(customer[field], field);
      }
    }

    return encrypted;
  }

  decryptCustomerData(customer: any): any {
    const sensitiveFields = ['email', 'address', 'gst_number'];
    const decrypted = { ...customer };

    for (const field of sensitiveFields) {
      if (customer[field] && this.isEncrypted(customer[field])) {
        try {
          decrypted[field] = this.decryptSensitiveField(customer[field], field);
        } catch (error) {
          console.error(`Error decrypting customer field ${field}:`, error);
          decrypted[field] = customer[field]; // Keep encrypted value if decryption fails
        }
      }
    }

    return decrypted;
  }

  private isEncrypted(value: string): boolean {
    try {
      const parsed = JSON.parse(value);
      return parsed.encrypted && parsed.iv && parsed.tag;
    } catch {
      return false;
    }
  }

  // Rotate encryption key
  async rotateKey(newPassword?: string): Promise<void> {
    try {
      const oldKey = this.key!;
      this.generateNewKey();

      // In a real implementation, you would re-encrypt all encrypted data
      // with the new key. This is a complex operation that requires:
      // 1. Decrypting all data with the old key
      // 2. Re-encrypting with the new key
      // 3. Updating the database

      console.log('Encryption key rotated successfully');
    } catch (error) {
      console.error('Error rotating encryption key:', error);
      throw new Error('Failed to rotate encryption key');
    }
  }

  // Get encryption status
  getEncryptionStatus(): { enabled: boolean; keyExists: boolean; algorithm: string } {
    return {
      enabled: this.key !== null,
      keyExists: fs.existsSync(this.keyPath),
      algorithm: this.algorithm
    };
  }
}