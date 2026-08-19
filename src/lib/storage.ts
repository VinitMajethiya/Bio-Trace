import { supabase } from './supabase';

// =============================================
// Pure JS Base64 to ArrayBuffer decoder
// Works natively in React Native/Hermes without native fetch('data:...')
// =============================================
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Strip whitespace and padding
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  let bufferLength = clean.length * 0.75;
  const len = clean.length;

  if (clean[clean.length - 1] === '=') {
    bufferLength--;
    if (clean[clean.length - 2] === '=') {
      bufferLength--;
    }
  }

  const arrayBuffer = new ArrayBuffer(Math.max(0, bufferLength));
  const bytes = new Uint8Array(arrayBuffer);
  let p = 0;

  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[clean.charCodeAt(i)];
    const encoded2 = lookup[clean.charCodeAt(i + 1)];
    const encoded3 = lookup[clean.charCodeAt(i + 2)];
    const encoded4 = lookup[clean.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (p < bufferLength) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return arrayBuffer;
}


/**
 * Uploads a base64-encoded image string to Supabase Storage bucket 'raid-photos'
 * and returns the public URL string.
 */
export async function uploadRaidPhotoToStorage(
  participantId: string,
  photoType: 'before' | 'after',
  base64OrUri: string
): Promise<string> {
  try {
    const fileName = `raid_${participantId}_${photoType}_${Date.now()}.jpg`;
    const cleanBase64 = base64OrUri.replace(/^data:image\/\w+;base64,/, '').trim();
    const arrayBuffer = base64ToArrayBuffer(cleanBase64);

    const { data, error } = await supabase.storage
      .from('raid-photos')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage
        .from('raid-photos')
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }

    console.warn('[Storage] Storage upload notice:', error?.message || 'Bucket fallback');
    return `data:image/jpeg;base64,${cleanBase64}`;
  } catch (err) {
    console.error('[Storage] Error uploading photo:', err);
    return `data:image/jpeg;base64,${base64OrUri.replace(/^data:image\/\w+;base64,/, '')}`;
  }
}


// =============================================
// Locker Photo Storage — Private waste-scans bucket
// =============================================

/**
 * Uploads a locker scan photo to the private 'waste-scans' bucket.
 * Path pattern: {userId}/{sessionId}_{timestamp}.jpg
 * Uses ArrayBuffer to avoid React Native Java MalformedURLException on data URIs.
 * Returns the storage path (NOT a URL) for later signed-URL generation.
 */
export async function uploadLockerPhotoToStorage(
  userId: string,
  sessionId: string,
  base64OrUri: string
): Promise<string | null> {
  try {
    const timestamp = Date.now();
    const filePath = `${userId}/${sessionId}_${timestamp}.jpg`;
    const cleanBase64 = base64OrUri.replace(/^data:image\/\w+;base64,/, '').trim();
    const arrayBuffer = base64ToArrayBuffer(cleanBase64);

    const { data, error } = await supabase.storage
      .from('waste-scans')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.warn('[Storage] waste-scans upload error:', error.message);
      return null;
    }

    return data?.path || filePath;
  } catch (err) {
    console.error('[Storage] Error uploading locker photo:', err);
    return null;
  }
}

/**
 * Generates a short-lived signed URL for a private waste-scans photo.
 * Returns null if the path is invalid or a local data URI.
 * Default expiry: 1 hour (3600 seconds).
 */
export async function getLockerPhotoSignedUrl(
  storagePath: string,
  expirySeconds: number = 3600
): Promise<string | null> {
  try {
    if (!storagePath || storagePath.startsWith('data:') || storagePath.startsWith('file:')) {
      return storagePath || null;
    }

    const { data, error } = await supabase.storage
      .from('waste-scans')
      .createSignedUrl(storagePath, expirySeconds);

    if (error) {
      console.warn('[Storage] Signed URL error:', error.message);
      return null;
    }

    return data?.signedUrl || null;
  } catch (err) {
    console.error('[Storage] Error creating signed URL:', err);
    return null;
  }
}
