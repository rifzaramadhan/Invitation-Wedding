import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (email: string, password: string, name: string) =>
        api.post('/auth/register', { email, password, name }),
    me: () => api.get('/auth/me'),
};

// Weddings API
export const weddingsApi = {
    list: () => api.get('/weddings'),
    get: (id: string) => api.get(`/weddings/${id}`),
    create: (data: WeddingInput) => api.post('/weddings', data),
    update: (id: string, data: Partial<WeddingInput>) => api.put(`/weddings/${id}`, data),
    delete: (id: string) => api.delete(`/weddings/${id}`),
    stats: (id: string) => api.get(`/weddings/${id}/stats`),
};

// Guests API
export const guestsApi = {
    list: (weddingId: string) => api.get(`/weddings/${weddingId}/guests`),
    create: (weddingId: string, data: GuestInput) => api.post(`/weddings/${weddingId}/guests`, data),
    bulkCreate: (weddingId: string, guests: GuestInput[]) =>
        api.post(`/weddings/${weddingId}/guests/bulk`, { guests }),
    update: (id: string, data: Partial<GuestInput>) => api.put(`/guests/${id}`, data),
    delete: (id: string) => api.delete(`/guests/${id}`),
};

// Events API
export const eventsApi = {
    list: (weddingId: string) => api.get(`/weddings/${weddingId}/events`),
    create: (weddingId: string, data: EventInput) => api.post(`/weddings/${weddingId}/events`, data),
    update: (id: string, data: Partial<EventInput>) => api.put(`/events/${id}`, data),
    delete: (id: string) => api.delete(`/events/${id}`),
};

// Wishes API (Admin)
export const wishesApi = {
    list: (weddingId: string) => api.get(`/weddings/${weddingId}/wishes`),
    approve: (id: string, isApproved: boolean) => api.put(`/wishes/${id}/approve`, { isApproved }),
    delete: (id: string) => api.delete(`/wishes/${id}`),
};

// Public API (no auth required)
export const publicApi = {
    getWedding: (slug: string) => api.get(`/public/${slug}`),
    getWeddingWithGuest: (slug: string, guestSlug: string) =>
        api.get(`/public/${slug}/guest/${guestSlug}`),
    getWishes: (slug: string) => api.get(`/public/${slug}/wishes`),
    submitWish: (slug: string, data: WishInput) => api.post(`/public/${slug}/wishes`, data),
};

// Uploads API (file uploads to R2)
export const uploadsApi = {
    getPresignedUrl: (filename: string, contentType: string, type: 'image' | 'audio') =>
        api.post<{
            uploadUrl: string;
            key: string;
            publicUrl: string;
            maxSize: number;
        }>('/uploads/presigned-url', { filename, contentType, type }),
    uploadToR2: async (url: string, file: File, onProgress?: (percent: number) => void) => {
        return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', url);
            xhr.setRequestHeader('Content-Type', file.type);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    onProgress(percent);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Upload failed'));
            xhr.send(file);
        });
    },
    deleteFile: (key: string) => api.delete(`/uploads/file/${encodeURIComponent(key)}`),
};

// Types
export interface WeddingInput {
    slug: string;
    groomName: string;
    brideName: string;
    groomFullName?: string;
    brideFullName?: string;
    groomPhoto?: string;
    bridePhoto?: string;
    groomParents?: string;
    brideParents?: string;
    story?: string;
    weddingDate: string;
    musicUrl?: string;
    coverImage?: string;
    giftSettings?: {
        bankAccounts: Array<{
            bankName: string;
            accountNumber: string;
            accountName: string;
        }>;
        eWallets?: Array<{
            name: string;
            number: string;
            accountName: string;
        }>;
    };
    isActive?: boolean;
    theme?: string;
}

export interface GuestInput {
    name: string;
    slug: string;
    maxAttendees?: number;
}

export interface EventInput {
    title: string;
    location: string;
    locationUrl?: string;
    address?: string;
    startTime: string;
    endTime?: string;
    description?: string;
    order?: number;
}

export interface WishInput {
    name: string;
    message: string;
    isAttending?: boolean;
    attendeeCount?: number;
    guestSlug?: string;
}

export interface Wedding {
    id: string;
    slug: string;
    groomName: string;
    brideName: string;
    groomFullName?: string;
    brideFullName?: string;
    groomPhoto?: string;
    bridePhoto?: string;
    groomParents?: string;
    brideParents?: string;
    story?: string;
    weddingDate: string;
    musicUrl?: string;
    coverImage?: string;
    giftSettings?: {
        bankAccounts: Array<{
            bankName: string;
            accountNumber: string;
            accountName: string;
        }>;
        eWallets?: Array<{
            name: string;
            number: string;
            accountName: string;
        }>;
    };
    theme: string;
    isActive: boolean;
    createdAt: string;
    events?: Event[];
    guests?: Guest[];
}

export interface Guest {
    id: string;
    name: string;
    slug: string;
    maxAttendees: number;
    createdAt: string;
}

export interface Event {
    id: string;
    title: string;
    location: string;
    locationUrl?: string;
    address?: string;
    startTime: string;
    endTime?: string;
    description?: string;
    order: number;
}

export interface Wish {
    id: string;
    name: string;
    message: string;
    isAttending?: boolean;
    attendeeCount?: number;
    isApproved: boolean;
    createdAt: string;
    guest?: Guest;
}
