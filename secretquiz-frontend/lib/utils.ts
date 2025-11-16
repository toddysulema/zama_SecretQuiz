import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format address: 0x1234...5678
export function formatAddress(address: string | null | undefined): string {
  if (!address) return '';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format timestamp
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Category names
export const CATEGORIES = ['Technology', 'Science', 'Business', 'Custom'] as const;
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

export function getCategoryName(category: number): string {
  return CATEGORIES[category] || 'Unknown';
}

export function getDifficultyName(difficulty: number): string {
  return DIFFICULTIES[difficulty] || 'Unknown';
}

// Chain names
export function getChainName(chainId: number): string {
  switch (chainId) {
    case 31337:
      return 'Local';
    case 11155111:
      return 'Sepolia';
    default:
      return 'Unknown';
  }
}

// Validate network
export function isValidNetwork(chainId: number | null): boolean {
  if (!chainId) return false;
  return chainId === 31337 || chainId === 11155111;
}

// Storage keys
export const STORAGE_KEYS = {
  WALLET_CONNECTED: 'wallet.connected',
  WALLET_LAST_CONNECTOR_ID: 'wallet.lastConnectorId',
  WALLET_LAST_ACCOUNTS: 'wallet.lastAccounts',
  WALLET_LAST_CHAIN_ID: 'wallet.lastChainId',
  FHEVM_DECRYPTION_SIGNATURE: (account: string) => `fhevm.decryptionSignature.${account}`,
  FHEVM_PUBLIC_KEY: (chainId: number) => `fhevm.publicKey.${chainId}`,
  QUIZ_DRAFT: (quizId: string) => `quiz.draft.${quizId}`,
} as const;

// Local storage helpers (safe for SSR)
export const storage = {
  get<T = string>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};

// Wait for element
export function waitForElement(selector: string, timeout = 5000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Debounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

