// =========================================================
// ETI-CRAFT ATS ENGINE & CONTROLLER (CRASH-PROOF BUNDLE)
// =========================================================

// --- 1. DOMAIN DICTIONARIES ---
const HARD_SKILLS = [
  "zapier", "make.com", "integromat", "airtable", "n8n", "hubspot", "webhooks",
  "rest api", "json", "graphql", "sql", "postgresql", "supabase", "firebase",
  "bubble.io", "bubble", "webflow", "glide", "flutterflow", "retool", "shopify",
  "wordpress", "figma", "chatgpt", "openai", "claude", "prompt engineering",
  "llm", "voiceflow", "botpress", "git", "github", "ci/cd", "docker", "javascript",
  "python", "html5", "css3", "project management", "clickup", "asana", "notion"
];

const SOFT_SKILLS = [
  "communication", "problem solving", "critical thinking", "adaptability",
  "time management", "attention to detail", "client management", "leadership",
  "troubleshooting", "cross-functional collaboration", "stakeholder management"
];

const ACTION_VERBS = [
  "spearheaded", "architected", "engineered", "automated", "streamlined",
  "deployed", "orchestrated", "optimized", "integrated", "eliminated",
  "designed", "developed", "formulated", "executed", "managed", "scaled"
];

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "all", "am", "an", "and", "any", "are",
  "as", "at", "be", "because", "been", "before", "being", "both", "but", "by", "can",
  "did", "do", "does", "for", "from", "had", "has", "have", "he", "her", "here", "him",
  "his", "how", "i", "if", "in", "into", "is", "it", "its", "me", "more", "my", "no",
  "nor", "not", "of", "off", "on", "or", "our", "out", "over", "she", "so", "some",
  "than", "that", "the", "their", "them", "then", "there", "these", "they", "this",
  "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
  "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your"
]);

// --- 2. STATE & STORAGE MANAGEMENT ---
let currentMode = 'tailor'; // 'tailor' | 'extractor'
let activeSection = 'skills';
let lastExtractedKeywords = null;
const MAX_FREE_TRIALS = 5;

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('eticraft_user_profile')); } catch (e) { return null; }
};
const isSubscribed = () => localStorage.getItem('eticraft_subscribed') === 'true';
const getTrialsRemaining = () => {
  if (isSubscribed()) return 999;
  const used = parseInt(localStorage.getItem('eticraft_trials_used') || '0', 10);
  return Math.max(0, MAX_FREE_TRIALS - used);
};
const consumeTrial = () => {
  if (isSubscribed()) return true;
  const used = parseInt(localStorage.getItem('eticraft_trials_used') || '0', 10);
  if (used >= MAX_FREE_TRIALS) return false;
  localStorage.setItem('eticraft_trials_used', (used + 1).toString());
  return true;
};

// --- 3. CORE NLP ATS TEXT PROCESSOR ---
function tokenize(text) {
  if (!text) return [];
  const tokens = text.toLowerCase().match(/[a-z0-9]+([\.\-\/][a-z0-9]+)*/g) || [];
  return tokens.filter(t => !STOP_WORDS.has(t) && t.length > 1);
}

function extractNGrams(text) {
  const tokens = tokenize(text);
  const ngrams = new Set(tokens);
  for (let i = 0; i < tokens.length - 1; i++) {
    ngrams.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return ngrams;
}

function extractJobKeywords(jobText) {
  const rawTokens = tokenize(jobText);
  const ngrams = extractNGrams(jobText);
  const freqMap = {};
  rawTokens.forEach(t => freqMap[t] = (freqMap[t] || 0) + 1);

  const detectedHard = HARD_SKILLS.filter(s => ngrams.has(s) || jobText.toLowerCase().includes(s));
  const detectedSoft = SOFT_SKILLS.filter(s => ngrams.has(s) || jobText.toLowerCase().includes(s));
  const detectedVerbs = ACTION_VERBS.filter(v => ngrams.has(v));

  const classified = new Set([...detectedHard, ...detectedSoft, ...detectedVerbs]);
  const topDomain = Object.entries(freqMap)
    .filter(([w]) => !classified.has(w) && w.length > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);

  return {
    hardSkills: Array.from(new Set(detectedHard)),
    softSkills: Array.from(new Set(detectedSoft)),
    actionVerbs: Array.from(new Set(detectedVerbs)),
    criticalKeywords: Array.from(new Set([...detectedHard, ...topDomain]))
  };
}

function calculateMatch(jobKeywords, resumeText) {
  const resumeNGrams = extractNGrams(resumeText);
  const resumeRaw = resumeText.toLowerCase();

  const matched = [];
  const missing = [];

  jobKeywords.criticalKeywords.forEach(kw => {
    if (resumeNGrams.has(kw) || resumeRaw.includes(kw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });

  const totalCritical = jobKeywords.criticalKeywords.length || 1;
  const criticalScore = (matched.length / totalCritical) * 60;

  const matchedSoft = jobKeywords.softSkills.filter(s => resumeRaw.includes(s));
  const softScore = jobKeywords.softSkills.length ? (matchedSoft.length / jobKeywords.softSkills.length) * 25 : 25;

  const matchedVerbs = jobKeywords.actionVerbs.filter(v => resumeRaw.includes(v));
  const verbScore = jobKeywords.actionVerbs.length ? (matchedVerbs.length / jobKeywords.actionVerbs.length) * 15 : 15;

  return {
    score: Math.min(100, Math.round(criticalScore + softScore + verbScore)),
    matchedKeywords: matched,
    missingKeywords: missing
  };
}

function parseResumeSections(rawText) {
  const sections = { summary: "", skills: "", experience: "", education: "" };
  const lines = rawText.split('\n');
  let currentSection = 'summary';

  const headerPatterns = {
    summary: /^(professional\s+)?summary|about\s+me|profile/i,
    skills: /^(technical\s+)?skills|competencies|tools|technologies/i,
    experience: /^(work\s+)?experience|employment|work\s+history/i,
    education: /^education|academic|qualifications/i
  };

  lines.forEach(line => {
    const trimmed = line.trim();
    let isHeader = false;
    for (const [key, regex] of Object.entries(headerPatterns)) {
      if (regex.test(trimmed) && trimmed.length < 35) {
        currentSection = key;
        isHeader = true;
        break;
      }
    }
    if (!isHeader && trimmed.length > 0) {
      sections[currentSection] += `${trimmed}\n`;
    }
  });
  return sections;
}

// --- 4. MULTI-FORMAT FILE EXTRACTOR (PDF, DOCX, TXT, OCR) ---
async function processUploadedFile(file, onProgress) {
  const fileName = file.name.toLowerCase();

  // 1. Plain text
  if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
    return await file.text();
  }

  // 2. PDF Document
  if (fileName.endsWith('.pdf')) {
    if (!window.pdfjsLib) throw new Error("PDF parser loading... please retry in 5 seconds.");
    if (onProgress) onProgress("Parsing PDF pages...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(" ") + "\n";
    }
    return fullText;
  }

  // 3. Word Document (.docx)
  if (fileName.endsWith('.docx')) {
    if (!window.mammoth) throw new Error("Word parser loading... please retry in 5 seconds.");
    if (onProgress) onProgress("Reading Word (.docx) document...");
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  }

  // 4. Image (.png, .jpg, .jpeg via Tesseract OCR)
  if (file.type.startsWith('image/') || fileName.match(/\.(png|jpg|jpeg)$/)) {
    if (!window.Tesseract) throw new Error("Image OCR engine loading... please retry in 5 seconds.");
    if (onProgress) onProgress("Scanning picture via OCR (this takes ~5-10s)...");
    const ret = await window.Tesseract.recognize(file, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(`Scanning image: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    return ret.data.text;
  }

  throw new Error("Unsupported file format. Please upload a PDF, Word (.docx), TXT, or Image.");
}

// --- 5. INITIALIZATION & UI LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  try {
    initAuth();
    initFileUpload();
    initTabs();
    initScanner();
    initCVLiveEditor();
    renderUserAuthState();
  } catch (err) {
    console.error("Initialization error:", err);
  }
});

function initAuth() {
  const triggerBtn = document.getElementById('auth-trigger-btn');
  const modal = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('close-auth-btn');
  const emailForm = document.getElementById('email-auth-form');

  if (triggerBtn && modal) {
    triggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('hidden');
    });
  }

  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('auth-email-input');
      const email = emailInput ? emailInput.value.trim() : '';
      if (email) {
        const profile = { name: email.split('@')[0], email: email, provider: 'email' };
        localStorage.setItem('eticraft_user_profile', JSON.stringify(profile));
        modal.classList.add('hidden');
        renderUserAuthState();
        alert(`Welcome, ${profile.name}! You are signed in.`);
      }
    });
  }

  // Safe Google Identity Services check (never throws)
  try {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: "demo-client-id.apps.googleusercontent.com",
        callback: (res) => {
          try {
            const base64Url = res.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
            localStorage.setItem('eticraft_user_profile', JSON.stringify({ name: payload.name, email: payload.email, provider: 'google' }));
            if (modal) modal.classList.add('hidden');
            renderUserAuthState();
          } catch (e) {
            console.warn("Google credential parse skipped:", e);
          }
        }
      });
      const gWrapper = document.getElementById('google-signin-wrapper');
      if (gWrapper) {
        window.google.accounts.id.renderButton(gWrapper, { theme: "outline", size: "large", width: 240 });
      }
    }
  } catch (gErr) {
    console.warn("Google Identity Services in demo mode.");
  }
}

function renderUserAuthState() {
  const user = getUser();
  const authContainer = document.getElementById('auth-container');
  const trialsBadge = document.getElementById('trials-remaining');

  if (trialsBadge) {
    trialsBadge.innerText = isSubscribed() ? "∞" : getTrialsRemaining();
  }

  if (user && authContainer) {
    authContainer.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xs font-semibold text-slate-800">👤 ${user.name}</span>
        <button id="signout-btn" class="text-[11px] text-rose-500 hover:text-rose-700 underline font-medium">Sign out</button>
      </div>
    `;
    const signOutBtn = document.getElementById('signout-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        localStorage.removeItem('eticraft_user_profile');
        renderUserAuthState();
      });
    }
  }
}

function initFileUpload() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('cv-file-input');
  const progressBar = document.getElementById('upload-progress-bar');
  const resumeTextarea = document.getElementById('resume-input');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', (e) => {
      if (e.target !== fileInput) fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        if (progressBar) {
          progressBar.classList.remove('hidden');
          progressBar.innerText = "⏳ Processing file... please wait";
        }

        const extractedText = await processUploadedFile(file, (msg) => {
          if (progressBar) progressBar.innerText = `⏳ ${msg}`;
        });

        if (resumeTextarea) resumeTextarea.value = extractedText;
        if (progressBar) progressBar.classList.add('hidden');

        // Auto-fill sections in Live Tailor
        const parsed = parseResumeSections(extractedText);
        if (parsed.summary) document.getElementById('cv-summary-content').innerText = parsed.summary;
        if (parsed.skills) document.getElementById('cv-skills-content').innerText = parsed.skills;
        if (parsed.experience) document.getElementById('cv-experience-content').innerText = parsed.experience;
        if (parsed.education) document.getElementById('cv-education-content').innerText = parsed.education;

        alert(`✅ Extracted text from: ${file.name}`);
      } catch (err) {
        if (progressBar) progressBar.classList.add('hidden');
        alert(`Upload error: ${err.message}`);
      }
    });
  }
}

function initTabs() {
  const tabTailor = document.getElementById('tab-tailor');
  const tabExtractor = document.getElementById('tab-extractor');
  const cvInputWrapper = document.getElementById('cv-input-wrapper');
  const catView = document.getElementById('categorized-extractor-view');

  if (tabTailor && tabExtractor) {
    tabTailor.addEventListener('click', () => {
      currentMode = 'tailor';
      tabTailor.className = "tab-btn active-tab pb-3 font-semibold text-sm border-b-2 border-brand text-brand flex items-center gap-2";
      tabExtractor.className = "tab-btn pb-3 font-semibold text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2";
      if (cvInputWrapper) cvInputWrapper.classList.remove('hidden');
      if (catView) catView.classList.add('hidden');
    });

    tabExtractor.addEventListener('click', () => {
      currentMode = 'extractor';
      tabExtractor.className = "tab-btn active-tab pb-3 font-semibold text-sm border-b-2 border-brand text-brand flex items-center gap-2";
      tabTailor.className = "tab-btn pb-3 font-semibold text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2";
      if (cvInputWrapper) cvInputWrapper.classList.add('hidden');
    });
  }
}

function initScanner() {
  const runBtn = document.getElementById('run-scanner-btn');
  const clearJd = document.getElementById('clear-jd-btn');
  const clearCv = document.getElementById('clear-cv-btn');
  const paywallModal = document.getElementById('paywall-modal');
  const closePaywall = document.getElementById('close-paywall-btn');
  const downloadPdf = document.getElementById('download-pdf-trigger');

  if (clearJd) clearJd.addEventListener('click', () => document.getElementById('job-description-input').value = '');
  if (clearCv) clearCv.addEventListener('click', () => document.getElementById('resume-input').value = '');
  if (closePaywall) closePaywall.addEventListener('click', () => paywallModal.classList.add('hidden'));

  if (downloadPdf) {
    downloadPdf.addEventListener('click', () => {
      if (!isSubscribed() && getTrialsRemaining() <= 0) {
        if (paywallModal) paywallModal.classList.remove('hidden');
        return;
      }
      window.print();
    });
  }

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const jd = document.getElementById('job-description-input').value.trim();
      if (!jd) {
        alert("Please paste a Job Description first.");
        return;
      }

      if (!consumeTrial()) {
        if (paywallModal) paywallModal.classList.remove('hidden');
        return;
      }

      renderUserAuthState();
      lastExtractedKeywords = extractJobKeywords(jd);
      document.getElementById('diagnostic-dashboard').classList.remove('hidden');

      if (currentMode === 'extractor') {
        const catView = document.getElementById('categorized-extractor-view');
        if (catView) {
          catView.classList.remove('hidden');
          document.getElementById('cat-hard-skills').innerHTML = lastExtractedKeywords.hardSkills.map(s => `<li>• ${s}</li>`).join('') || "<li>None detected</li>";
          document.getElementById('cat-soft-skills').innerHTML = lastExtractedKeywords.softSkills.map(s => `<li>• ${s}</li>`).join('') || "<li>None detected</li>";
          document.getElementById('cat-action-verbs').innerHTML = lastExtractedKeywords.actionVerbs.map(s => `<li>• ${s}</li>`).join('') || "<li>None detected</li>";
        }
        return;
      }

      recalculateAndRender();
    });
  }
}

function initCVLiveEditor() {
  document.querySelectorAll('.cv-editable-content').forEach(sec => {
    sec.addEventListener('focus', () => {
      const parent = sec.closest('.cv-section');
      if (parent) {
        activeSection = parent.getAttribute('data-section');
        const indicator = document.getElementById('active-section-indicator');
        if (indicator) indicator.innerText = activeSection.toUpperCase();
      }
    });

    sec.addEventListener('input', () => {
      if (lastExtractedKeywords) recalculateAndRender();
    });
  });
}

function recalculateAndRender() {
  const liveCV = [
    document.getElementById('cv-summary-content').innerText,
    document.getElementById('cv-skills-content').innerText,
    document.getElementById('cv-experience-content').innerText,
    document.getElementById('cv-education-content').innerText
  ].join(' ');

  const result = calculateMatch(lastExtractedKeywords, liveCV);

  // Score UI
  const scoreText = document.getElementById('match-score-text');
  if (scoreText) scoreText.innerText = `${result.score}%`;

  const scoreRing = document.getElementById('score-ring');
  if (scoreRing) {
    if (result.score >= 70) {
      scoreRing.className = "relative w-24 h-24 flex items-center justify-center rounded-full bg-emerald-50 border-4 border-emerald-500 text-emerald-600";
    } else if (result.score >= 45) {
      scoreRing.className = "relative w-24 h-24 flex items-center justify-center rounded-full bg-amber-50 border-4 border-amber-500 text-amber-600";
    } else {
      scoreRing.className = "relative w-24 h-24 flex items-center justify-center rounded-full bg-rose-50 border-4 border-rose-500 text-rose-600";
    }
  }

  // Missing Keywords (Clickable)
  const missingBox = document.getElementById('missing-keywords-container');
  if (missingBox) {
    document.getElementById('missing-count').innerText = result.missingKeywords.length;
    missingBox.innerHTML = result.missingKeywords.map(kw => `
      <button class="missing-pill px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1 transition" data-kw="${kw}">
        <span>+</span> ${kw}
      </button>
    `).join('');

    missingBox.querySelectorAll('.missing-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const kw = btn.getAttribute('data-kw');
        const target = document.getElementById(`cv-${activeSection}-content`) || document.getElementById('cv-skills-content');
        if (target) {
          if (activeSection === 'skills') {
            target.innerText = target.innerText.trim() + `, ${kw}`;
          } else {
            target.innerText = target.innerText.trim() + ` [Proficient in ${kw}].`;
          }
          recalculateAndRender();
        }
      });
    });
  }

// Matched Keywords
  const matchedBox = document.getElementById('matched-keywords-container');
  if (matchedBox) {
    document.getElementById('matched-count').innerText = result.matchedKeywords.length;
    matchedBox.innerHTML = result.matchedKeywords.map(kw => `
      <span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
        ✓ ${kw}
      </span>
    `).join('');
  }
}