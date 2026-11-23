const DB_NAME = 'NoCodeJobsDB';
const DB_VERSION = 1;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('saved_jobs')) {
        db.createObjectStore('saved_jobs', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function toggleSaveJob(job) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('saved_jobs', 'readwrite');
    const store = tx.objectStore('saved_jobs');
    const getReq = store.get(job.id);

    getReq.onsuccess = () => {
      if (getReq.result) {
        store.delete(job.id);
        resolve(false);
      } else {
        store.put(job);
        resolve(true);
      }
    };
  });
}

export async function getSavedJobs() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('saved_jobs', 'readonly');
    const store = tx.objectStore('saved_jobs');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

 export function checkLinkedInPostQuota() {
  const today = new Date().toISOString().slice(0, 10);
  const lastPostDate = localStorage.getItem('last_linkedin_post_date');
  return lastPostDate === today;
}

export function markLinkedInPostUsed() {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem('last_linkedin_post_date', today);
}