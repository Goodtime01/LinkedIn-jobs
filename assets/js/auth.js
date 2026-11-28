const STORAGE_KEY_USER = 'eticraft_user_profile';
const STORAGE_KEY_TRIALS = 'eticraft_trials_used';
const MAX_FREE_TRIALS = 5;

export class AuthManager {
  static getUser() {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    return data ? JSON.parse(data) : null;
  }

  static isSubscribed() {
    return localStorage.getItem('eticraft_subscribed') === 'true';
  }

  static getTrialsRemaining() {
    if (this.isSubscribed()) return 999;
    const used = parseInt(localStorage.getItem(STORAGE_KEY_TRIALS) || '0', 10);
    return Math.max(0, MAX_FREE_TRIALS - used);
  }

  static consumeTrial() {
    if (this.isSubscribed()) return true;
    const used = parseInt(localStorage.getItem(STORAGE_KEY_TRIALS) || '0', 10);
    if (used >= MAX_FREE_TRIALS) return false;

    localStorage.setItem(STORAGE_KEY_TRIALS, (used + 1).toString());
    return true;
  }

  // Simple Email Sign In
  static signInWithEmail(email) {
    const profile = {
      email: email,
      name: email.split('@')[0],
      provider: 'email',
      signedInAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    return profile;
  }

  // Google Sign In (Parses JWT from Google GSI)
  static handleGoogleCredential(response) {
    try {
      // Decode JWT payload without external library
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));

      const profile = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        provider: 'google',
        signedInAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.error("Google decoding failed:", err);
      return null;
    }
  }

  static signOut() {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
}