
import { UserProfile, Application } from '../types';

export const LocalStore = {
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
