
import { UserProfile, Application, AuthUser } from '../types';

export const LocalStore = {
  // Auth & Session
  login: (email: string, password: string): { user: AuthUser | null, error?: string } => {
    // Mock Auth DB: Check if email exists in our local store map
    const authDb = JSON.parse(localStorage.getItem('fuliza_auth_db') || '{}');
    const creds = authDb[email];
    
    if (creds && creds.password === password) {
       const user = { uid: creds.uid, email, displayName: null };
       LocalStore.createSession(user);
       return { user };
    }
    return { user: null, error: 'Invalid credentials' };
  },

  register: (email: string, password: string): { user: AuthUser, error?: string } => {
    const authDb = JSON.parse(localStorage.getItem('fuliza_auth_db') || '{}');
    if (authDb[email]) {
        return { user: null as any, error: 'User already exists' };
    }
    const uid = 'user_' + Date.now().toString(36);
    authDb[email] = { uid, password };
    localStorage.setItem('fuliza_auth_db', JSON.stringify(authDb));
    
    const user = { uid, email, displayName: null };
    LocalStore.createSession(user);
    return { user };
  },

  createSession: (user: AuthUser) => {
    localStorage.setItem('fuliza_current_session', JSON.stringify(user));
  },

  getCurrentUser: (): AuthUser | null => {
    const s = localStorage.getItem('fuliza_current_session');
    return s ? JSON.parse(s) : null;
  },

  logout: () => {
    localStorage.removeItem('fuliza_current_session');
  },

  // Profile
  saveProfile: (profile: UserProfile) => {
    try {
      localStorage.setItem(`fuliza_profile_${profile.uid}`, JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save profile locally", e);
    }
  },
  
  getProfile: (uid: string): UserProfile | null => {
    try {
      const data = localStorage.getItem(`fuliza_profile_${uid}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  getAllProfiles: (): UserProfile[] => {
    const profiles: UserProfile[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fuliza_profile_')) {
          const data = localStorage.getItem(key);
          if (data) {
            profiles.push(JSON.parse(data));
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch all profiles", e);
    }
    return profiles;
  },

  updateProfile: (uid: string, updates: Partial<UserProfile>) => {
    try {
      const current = LocalStore.getProfile(uid);
      if (current) {
        const updated = { ...current, ...updates };
        LocalStore.saveProfile(updated);
        return updated;
      }
    } catch (e) {
      console.error("Failed to update local profile", e);
    }
    return null;
  },

  // Applications
  saveApplication: (app: Application) => {
    try {
      const key = `fuliza_apps_${app.userId}`;
      const existing = localStorage.getItem(key);
      const apps: Application[] = existing ? JSON.parse(existing) : [];
      // Prevent duplicates if possible, though ID generation handles uniqueness
      const filtered = apps.filter(a => a.id !== app.id);
      filtered.unshift(app);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to save application locally", e);
    }
  },

  getApplications: (userId: string): Application[] => {
    try {
      const data = localStorage.getItem(`fuliza_apps_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
};