import { StoredUploadedPhoto } from './types';

const DB_NAME = 'MelbourneDreamlandPhotosDB';
const DB_VERSION = 1;
const STORE_NAME = 'uploaded_photos';

const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

/**
 * Persistent IndexedDB storage for real user-uploaded memory photographs (JPG, JPEG, PNG, WEBP).
 * Preserves exact uploaded photographs without modification or AI replacement across page refreshes.
 */
export class PhotoStorage {
  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by_location', 'locationId', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  public static isSupportedFile(file: File): boolean {
    if (ACCEPTED_MIME_TYPES.has(file.type.toLowerCase())) return true;
    return /\.(jpe?g|png|webp)$/i.test(file.name);
  }

  public static readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  public static async getAllPhotos(): Promise<StoredUploadedPhoto[]> {
    try {
      const db = await this.openDB();
      return await new Promise<StoredUploadedPhoto[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result as StoredUploadedPhoto[]) ?? [];
          items.sort((a, b) => a.createdAt - b.createdAt);
          resolve(items);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  public static async addUploadedFile(
    locationId: string,
    file: File,
    caption: string,
    dateLabel?: string
  ): Promise<StoredUploadedPhoto | null> {
    if (!this.isSupportedFile(file)) return null;
    const dataUrl = await this.readFileAsDataUrl(file);
    const entry: StoredUploadedPhoto = {
      id: `photo-${locationId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      locationId,
      dataUrl,
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      caption: caption.trim() || file.name.replace(/\.[^.]+$/, ''),
      dateLabel,
      createdAt: Date.now(),
    };

    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fallback: still return in-memory photo entry if IndexedDB unavailable
    }
    return entry;
  }

  public static async addCapturedPhoto(
    locationId: string,
    dataUrl: string,
    caption: string,
    frameStyle?: import('./types').PhotoBoothFrameStyle,
    tone?: import('./types').PhotoBoothTone,
    dateLabel?: string
  ): Promise<StoredUploadedPhoto> {
    const entry: StoredUploadedPhoto = {
      id: `strip-${locationId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      locationId,
      dataUrl,
      fileName: `photobooth-${Date.now()}.png`,
      mimeType: 'image/png',
      caption: caption.trim() || 'Arcade Photo Booth Strip',
      dateLabel: dateLabel || new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: Date.now(),
      frameStyle,
      tone,
      isPhotoBooth: true,
    };

    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fallback
    }
    return entry;
  }

  public static async updateCaption(
    photoId: string,
    newCaption: string
  ): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(photoId);
        getReq.onsuccess = () => {
          const existing = getReq.result as StoredUploadedPhoto | undefined;
          if (existing) {
            store.put({ ...existing, caption: newCaption });
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Ignore gracefully
    }
  }

  public static async deletePhoto(photoId: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(photoId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Ignore gracefully
    }
  }
}
