// =========================================================
// ETI-CRAFT V2: INTELLIGENT DE-DUPLICATOR & ATS ENGINE
// =========================================================

const HARD_SKILLS = [
  "zapier", "make.com", "integromat", "airtable", "n8n", "hubspot", "webhooks",
  "rest api", "json", "graphql", "sql", "postgresql", "supabase", "firebase",
  "bubble.io", "bubble", "webflow", "glide", "flutterflow", "retool", "shopify",
  "wordpress", "figma", "chatgpt", "openai", "claude", "prompt engineering",
  "llm", "voiceflow", "botpress", "git", "github", "ci/cd", "docker", "javascript",
  "python", "html5", "css3", "project management", "clickup", "asana", "notion",
  "biology", "front-end", "developer", "operations", "virtual assistant"
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

// Noise words to reject (including social links and query params)
const STOP_WORDS = new Set([
  "https", "http", "www", "com", "org", "whatsapp", "telegram", "channel", "apply",
  "click", "link", "like", "opportunities", "jobdetails", "jobid", "clid", "ntkn",
  "a", "about", "above", "after", "again", "all", "am", "an", "and", "any", "are",
  "as", "at", "be", "because", "been", "before", "being", "both", "but", "by", "can",
  "did", "do", "does", "for", "from", "had", "has", "have", "he", "her", "here", "him",
  "his", "how", "i", "if", "in", "into", "is", "it", "its", "me", "more", "my", "no",
  "nor", "not", "of", "off", "on", "or", "our", "out", "over", "she", "so", "some",
  "than", "that", "the", "their", "them", "then", "there", "these", "they", "this",
  "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
  "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your"
]);

let currentMode = 'tailor';
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

// --- SMART TEXT SANITIZER (FIXES PDF STUTTER / REPEATS) ---
function cleanExtractedText(raw) {
  if (!raw) return "";
  
  // 1. Remove URLs and query strings completely
  let text = raw.replace(/https?:\/\/[^\s]+/gi, ' ');

  // 2. Fix the PDF spacing / stutter issue:
  // Detects spaced duplicate letters like "B Bi io ol lo og gy y" or "C C U UR RR"
  // Reconstructs clean words
  text = text.replace(/([A-Za-z0-9])\s+\1(?!\w)/g, '$1');
  
  // 3. Fix words where every character got repeated twice (e.g. "EEnndd" -> "End")
  text = text.split(/\s+/).map(word => {
    // If a word has repeated sequential pairs (e.g. "CCUURRRRIICCUULLUUMM")
    if (word.length > 4 && /([A-Za-z])\1([A-Za-z])\2/.test(word)) {
      return word.replace(/([A-Za-z])\1+/g, '$1');
    }
    return word;
  }).join(' ');

  // 4. Normalize multiple spaces and line breaks
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

// --- NLP TOKENIZER ---
function tokenize(text) {
  if (!text) return [];
  // Strip URLs and numbers before analyzing keywords
  const clean = text.replace(/https?:\/\/[^\s]+/gi, ' ').replace(/\b\d+\b/g, ' ');
  const tokens = clean.toLowerCase().match(/[a-z]+([\.\-\/][a-z]+)*/g) || [];
  return tokens.filter(t => !STOP_WORDS.has(t) && t.length > 2 && !/^\d+$/.test(t));
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
  const clean = cleanExtractedText(jobText);
  const rawTokens = tokenize(clean);
  const ngrams = extractNGrams(clean);
  const freqMap = {};
  rawTokens.forEach(t => freqMap[t] = (freqMap[t] || 0) + 1);

  const detectedHard = HARD_SKILLS.filter(s => ngrams.has(s) || clean.toLowerCase().includes(s));
  const detectedSoft = SOFT_SKILLS.filter(s => ngrams.has(s) || clean.toLowerCase().includes(s));
  const detectedVerbs = ACTION_VERBS.filter(v => ngrams.has(v));

  const classified = new Set([...detectedHard, ...detectedSoft, ...detectedVerbs]);
  
  // Pull top keywords, rejecting pure numbers or web garbage
  const topDomain = Object.entries(freqMap)
    .filter(([w]) => !classified.has(w) && w.length > 3 && !STOP_WORDS.has(w))
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
  const cleanResume = cleanExtractedText(resumeText);
  const resumeNGrams = extractNGrams(cleanResume);
  const resumeRaw = cleanResume.toLowerCase();

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

// --- ACCURATE RESUME SECTION PARSER ---
function parseResumeSections(rawText) {
  const clean = cleanExtractedText(rawText);
  const sections = {
    contact: "",
    summary: "",
    skills: "",
    experience: "",
    education: ""
  };

  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  let currentSec = 'contact';

  const patterns = {
    summary: /^(professional\s+)?summary|profile|about\s+me/i,
    skills: /^(technical\s+)?skills|competencies|tools/i,
    experience: /^(work\s+)?experience|employment|work\s+history/i,
    education: /^education|academic|qualifications/i
  };

  lines.forEach((line, index) => {
    // If we're at the top 3-4 lines and no header has triggered, it's contact/header info
    if (index < 4 && currentSec === 'contact') {
      sections.contact += line + " | ";
      return;
    }

    let isHeader = false;
    for (const [key, regex] of Object.entries(patterns)) {
      if (regex.test(line) && line.length < 35) {
        currentSec = key;
        isHeader = true;
        break;
      }
    }

    if (!isHeader) {
      if (currentSec === 'contact') currentSec = 'summary';
      sections[currentSec] += line + "\n";
    }
  });

  return sections;
}

// --- FILE EXTRACTOR WITH PROPER PDF KERNING MERGE ---
async function processUploadedFile(file, onProgress) {
  const fileName = file.name.toLowerCase();

  // 1. TXT
  if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
    return cleanExtractedText(await file.text());
  }

  // 2. PDF Document
  if (fileName.endsWith('.pdf')) {
    if (!window.pdfjsLib) throw new Error("PDF parser loading... please wait 3 seconds.");
    if (onProgress) onProgress("Reading PDF pages...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // Combine text items smoothly without adding spaces between fragmented characters
      let lastY, text = "";
      for (const item of content.items) {
        if (lastY === undefined || Math.abs(item.transform[5] - lastY) < 4) {
          text += item.str;
        } else {
          text += "\n" + item.str;
        }
        lastY = item.transform[5];
      }
      fullText += text + "\n\n";
    }
    return cleanExtractedText(fullText);
  }

  // 3. Word Document (.docx)
  if (fileName.endsWith('.docx')) {
    if (!window.mammoth) throw new Error("Word parser loading... please wait 3 seconds.");
    if (onProgress) onProgress("Reading Word (.docx)...");
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return cleanExtractedText(result.value);
  }

  // 4. Image OCR
  if (file.type.startsWith('image/') || fileName.match(/\.(png|jpg|jpeg)$/)) {
    if (!window.Tesseract) throw new Error("OCR engine loading... please wait 3 seconds.");
    if (onProgress) onProgress("Running OCR on image (~5-10s)...");
    const ret = await window.Tesseract.recognize(file, 'eng');
    return cleanExtractedText(ret.data.text);
  }

  throw new Error("Unsupported format. Please upload PDF, Word (.docx), or Image.");
}

// --- UI WIRING ---
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initFileUpload();
  initTabs();
  initScanner();
  initCVLiveEditor();
  renderUserAuthState();
});

function initAuth() {
  const triggerBtn = document.getElementById('auth-trigger-btn');
  const modal = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('close-auth-btn');
  const emailForm = document.getElementById('email-auth-form');

  if (triggerBtn && modal) triggerBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email-input').value.trim();
      if (email) {
        const profile = { name: email.split('@')[0], email: email, provider: 'email' };
        localStorage.setItem('eticraft_user_profile', JSON.stringify(profile));
        modal.classList.add('hidden');
        renderUserAuthState();
        alert(`Signed in as ${profile.name}!`);
      }
    });
  }
}

function renderUserAuthState() {
  const user = getUser();
  const authContainer = document.getElementById('auth-container');
  const trialsBadge = document.getElementById('trials-remaining');

  if (trialsBadge) trialsBadge.innerText = isSubscribed() ? "∞" : getTrialsRemaining();

  if (user && authContainer) {
    authContainer.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xs font-semibold text-slate-800">👤 ${user.name}</span>
        <button id="signout-btn" class="text-[11px] text-rose-500 hover:text-rose-700 underline font-medium">Sign out</button>
      </div>
    `;
    document.getElementById('signout-btn').addEventListener('click', () => {
      localStorage.removeItem('eticraft_user_profile');
      renderUserAuthState();
    });
  }
}

function initFileUpload() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('cv-file-input');
  const progressBar = document.getElementById('upload-progress-bar');
  const resumeTextarea = document.getElementById('resume-input');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        if (progressBar) progressBar.classList.remove('hidden');
        const extracted = await processUploadedFile(file, (msg) => {
          if (progressBar) progressBar.innerText = `⏳ ${msg}`;
        });

        if (resumeTextarea) resumeTextarea.value = extracted;
        if (progressBar) progressBar.classList.add('hidden');

        // Automatically format sections in the Live CV Builder
        const parsed = parseResumeSections(extracted);
        if (parsed.summary) document.getElementById('cv-summary-content').innerText = parsed.summary.trim();
        if (parsed.skills) document.getElementById('cv-skills-content').innerText = parsed.skills.trim();
        if (parsed.experience) document.getElementById('cv-experience-content').innerText = parsed.experience.trim();
        if (parsed.education) document.getElementById('cv-education-content').innerText = parsed.education.trim();

        alert(`✅ Cleaned and loaded: ${file.name}`);
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
      scoreRing.className = "relative w-24 h-24 flex items-center justify-center rounded-full bg-emerald-50 border-4 border-emerald-500 text-emerald-600 font-bold";
    } else if (result.score >= 45) {
      scoreRing.className = "relative w-24 h-24 flex items-center justify-center rounded-full bg-amber-50 border-4 border-amber-500 text-amber-600 font-bold";
    } else {
      scoreRing.className = "relative w-24 h-24 flex items-center justify-center rounded-full bg-rose-50 border-4 border-rose-500 text-rose-600 font-bold";
    }
  }

  // Missing Keywords (Click to Insert)
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