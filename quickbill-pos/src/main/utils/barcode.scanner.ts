import { EventEmitter } from 'events';

export interface BarcodeScannerConfig {
  debounceTime: number;
  minLength: number;
  maxLength: number;
  allowedCharacters: RegExp;
}

export class BarcodeScanner extends EventEmitter {
  private buffer: string = '';
  private timeout: NodeJS.Timeout | null = null;
  private config: BarcodeScannerConfig;

  constructor(config: Partial<BarcodeScannerConfig> = {}) {
    super();
    this.config = {
      debounceTime: 100,
      minLength: 8,
      maxLength: 20,
      allowedCharacters: /^[0-9]+$/,
      ...config
    };
  }

  start(): void {
    // Listen for keyboard input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (key: string) => {
      this.handleKeyPress(key);
    });

    console.log('Barcode scanner started. Press Ctrl+C to stop.');
  }

  stop(): void {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    this.clearBuffer();
  }

  private handleKeyPress(key: string): void {
    // Handle Ctrl+C to exit
    if (key === '\u0003') {
      this.stop();
      process.exit(0);
    }

    // Handle Enter key
    if (key === '\r' || key === '\n') {
      this.processBarcode();
      return;
    }

    // Handle backspace
    if (key === '\b' || key === '\u007f') {
      this.buffer = this.buffer.slice(0, -1);
      this.resetTimeout();
      return;
    }

    // Add character to buffer if it matches allowed characters
    if (this.config.allowedCharacters.test(key)) {
      this.buffer += key;
      this.resetTimeout();
    }
  }

  private resetTimeout(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.clearBuffer();
    }, this.config.debounceTime);
  }

  private processBarcode(): void {
    if (this.buffer.length >= this.config.minLength && 
        this.buffer.length <= this.config.maxLength) {
      
      const barcode = this.buffer.trim();
      console.log(`Barcode scanned: ${barcode}`);
      
      this.emit('barcode', barcode);
    } else {
      console.log(`Invalid barcode length: ${this.buffer.length}`);
      this.emit('invalid', this.buffer);
    }

    this.clearBuffer();
  }

  private clearBuffer(): void {
    this.buffer = '';
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  // Simulate barcode scanning for testing
  simulateBarcode(barcode: string): void {
    console.log(`Simulating barcode: ${barcode}`);
    this.emit('barcode', barcode);
  }

  // Get current buffer state
  getBuffer(): string {
    return this.buffer;
  }

  // Update configuration
  updateConfig(newConfig: Partial<BarcodeScannerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Web-based barcode scanner using camera
export class WebBarcodeScanner {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private isScanning: boolean = false;

  constructor() {
    this.setupElements();
  }

  private setupElements(): void {
    this.video = document.createElement('video');
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
  }

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (this.video) {
        this.video.srcObject = this.stream;
        this.video.play();
        this.isScanning = true;
        this.scanLoop();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw error;
    }
  }

  stop(): void {
    this.isScanning = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  private scanLoop(): void {
    if (!this.isScanning || !this.video || !this.canvas || !this.context) {
      return;
    }

    // Draw video frame to canvas
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    this.context.drawImage(this.video, 0, 0);

    // Get image data for barcode detection
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Here you would integrate with a barcode detection library like QuaggaJS or ZXing
    // For now, we'll just continue the loop
    requestAnimationFrame(() => this.scanLoop());
  }

  // Method to detect barcode from image data
  private detectBarcode(imageData: ImageData): string | null {
    // This is a placeholder - in a real implementation, you would use a barcode detection library
    // like QuaggaJS, ZXing, or similar
    return null;
  }
}

// Keyboard-based barcode scanner for web
export class KeyboardBarcodeScanner {
  private buffer: string = '';
  private timeout: NodeJS.Timeout | null = null;
  private config: BarcodeScannerConfig;

  constructor(config: Partial<BarcodeScannerConfig> = {}) {
    this.config = {
      debounceTime: 100,
      minLength: 8,
      maxLength: 20,
      allowedCharacters: /^[0-9]+$/,
      ...config
    };
  }

  start(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  stop(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.clearBuffer();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore if input is focused (user is typing)
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Handle Enter key
    if (event.key === 'Enter') {
      event.preventDefault();
      this.processBarcode();
      return;
    }

    // Handle backspace
    if (event.key === 'Backspace') {
      this.buffer = this.buffer.slice(0, -1);
      this.resetTimeout();
      return;
    }

    // Add character to buffer if it matches allowed characters
    if (this.config.allowedCharacters.test(event.key)) {
      this.buffer += event.key;
      this.resetTimeout();
    }
  }

  private resetTimeout(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.clearBuffer();
    }, this.config.debounceTime);
  }

  private processBarcode(): void {
    if (this.buffer.length >= this.config.minLength && 
        this.buffer.length <= this.config.maxLength) {
      
      const barcode = this.buffer.trim();
      console.log(`Barcode scanned: ${barcode}`);
      
      // Dispatch custom event
      const event = new CustomEvent('barcodeScanned', { 
        detail: { barcode } 
      });
      document.dispatchEvent(event);
    }

    this.clearBuffer();
  }

  private clearBuffer(): void {
    this.buffer = '';
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}