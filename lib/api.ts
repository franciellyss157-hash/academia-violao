import { Platform } from 'react-native';

const envUrl = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE =
  envUrl && envUrl.length > 0
    ? envUrl.replace(/\/$/, '')
    : Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname.replace(/^3000-/, '4000-')}`
      : 'http://localhost:4000';

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}
export function getAuthToken() {
  return authToken;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Options = { method?: string; body?: unknown; form?: FormData };

async function request<T = any>(path: string, options: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let payload: BodyInit | undefined;
  if (options.form) {
    payload = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers,
      body: payload,
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0);
  }

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) throw new ApiError(data.error || 'Algo deu errado.', res.status, data.code);
  return data as T;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T = any>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T = any>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T = any>(path: string, form: FormData) => request<T>(path, { method: 'POST', form }),
};

export function fileUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:/.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${API_BASE}${url}${sep}token=${authToken || ''}`;
}

export async function appendImage(form: FormData, field: string, asset: any) {
  if (Platform.OS === 'web') {
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    const name = asset.fileName || `sussurro-${Date.now()}.jpg`;
    form.append(field, new File([blob], name, { type: asset.mimeType || blob.type || 'image/jpeg' }));
    return;
  }
  form.append(field, {
    uri: asset.uri,
    name: asset.fileName || `sussurro-${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  } as any);
}

export async function pickImage(square = false) {
  const ImagePicker = await import('expo-image-picker');
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted && Platform.OS !== 'web') {
    throw new ApiError('Precisamos de acesso às suas fotos.', 0);
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: square,
    aspect: square ? [1, 1] : undefined,
  });
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0];
}

export async function squareCrop(asset: any) {
  try {
    const ImageManipulator = await import('expo-image-manipulator');
    const { width, height } = asset;
    const side = Math.min(width || 600, height || 600);
    const result = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ crop: { originX: ((width || side) - side) / 2, originY: ((height || side) - side) / 2, width: side, height: side } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return { ...asset, uri: result.uri, width: side, height: side };
  } catch {
    return asset;
  }
}
