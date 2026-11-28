// ==========================================
// ETI-CRAFT ENGINE: PART 1 (STATE & CLEANER)
// ==========================================

const PAYSTACK_PUBLIC_KEY = "pk_live_c70a3f5403ab816952f6bcd3b7243dc3bafb4318";
const MAX_FREE_TRIALS = 5;

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

function cleanExtractedText(raw) {
  if (!raw) return "";
  let text = raw.replace(/https?:\/\/[^\s]+/gi, ' ');
  text = text.replace(/([A-Za-z0-9])\s+\1(?!\w)/g, '$1');
  text = text.split(/\s+/).map(word => {
    if (word.length > 4 && /([A-Za-z])\1([A-Za-z])\2/.test(word)) {
      return word.replace(/([A-Za-z])\1+/g, '$1');
    }
    return word;
  }).join(' ');
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function tokenize(text) {
  if (!text) return [];
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

// ==========================================
// ETI-CRAFT ENGINE: PART 2 (EXTRACT & PARSE)
// ==========================================

function extractCandidateDetails(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let name = "";
  let email = "";
  let phone = "";
  let location = "";
  let linkedin = "";

  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) email = emailMatch[0];

  const phoneMatch = rawText.match(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}|\b0[789][01]\d{8}\b/);
  if (phoneMatch) phone = phoneMatch[0];

  const linkedinMatch = rawText.match(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) linkedin = linkedinMatch[0];

  for (let line of lines) {
    const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').trim();
    const lower = line.toLowerCase();
    if (
      cleanLine.length > 2 && cleanLine.length < 35 &&
      !lower.includes('curriculum') && !lower.includes('vitae') &&
      !lower.includes('resume') && !lower.includes('@') &&
      !lower.includes('http') && !lower.includes('phone') &&
      !lower.includes('address')
    ) {
      name = cleanLine.toUpperCase();
      break;
    }
  }

  const user = getUser();
  if ((!name || name.length < 3) && user && user.name) {
    name = user.name.toUpperCase();
  }
  if (!name) name = "ETINI OBOP";

  for (let line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('nigeria') || lower.includes('lagos') || lower.includes('remote') || lower.includes('state') || lower.includes('estate') || lower.includes('road')) {
      location = line.replace(/[|•]/g, '').trim();
      break;
    }
  }
  if (!location) location = "Lagos, Nigeria (Remote)";

  return { name, email, phone, location, linkedin };
}

function parseResumeSections(rawText) {
  const clean = cleanExtractedText(rawText);
  const sections = { name: "", contact: "", summary: "", skills: "", experience: "", education: "" };
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return sections;

  if (lines[0] && lines[0].length < 40) {
    sections.name = lines[0].replace(/[^a-zA-Z\s]/g, '').trim().toUpperCase();
  }

  const contactLines = [];
  for (let i = 1; i < Math.min(lines.length, 5); i++) {
    const l = lines[i];
    if (l.includes('@') || l.match(/\d{9,}/) || l.toLowerCase().includes('linkedin') || l.toLowerCase().includes('nigeria') || l.toLowerCase().includes('remote')) {
      contactLines.push(l);
    }
  }
  sections.contact = contactLines.join(' | ') || "Remote | Email Verified | LinkedIn Profile";

  let currentSec = 'summary';
  const patterns = {
    summary: /^(professional\s+)?summary|profile|about\s+me/i,
    skills: /^(technical\s+)?skills|competencies|tools/i,
    experience: /^(work\s+)?experience|employment|work\s+history|projects/i,
    education: /^education|academic|qualifications|certifications/i
  };

  for (let i = contactLines.length + 1; i < lines.length; i++) {
    const line = lines[i];
    let isHeader = false;
    for (const [key, regex] of Object.entries(patterns)) {
      if (regex.test(line) && line.length < 35) {
        currentSec = key;
        isHeader = true;
        break;
      }
    }
    if (!isHeader) {
      sections[currentSec] += line + "\n";
    }
  }
  return sections;
}

async function processUploadedFile(file, onProgress) {
  const fileName = file.name.toLowerCase();

  if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
    return cleanExtractedText(await file.text());
  }

  if (fileName.endsWith('.pdf')) {
    if (!window.pdfjsLib) throw new Error("PDF parser loading... please wait 3 seconds.");
    if (onProgress) onProgress("Reading PDF pages...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
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

  if (fileName.endsWith('.docx')) {
    if (!window.mammoth) throw new Error("Word parser loading... please wait 3 seconds.");
    if (onProgress) onProgress("Reading Word (.docx)...");
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return cleanExtractedText(result.value);
  }

  if (file.type.startsWith('image/') || fileName.match(/\.(png|jpg|jpeg)$/)) {
    if (!window.Tesseract) throw new Error("OCR engine loading... please wait 3 seconds.");
    if (onProgress) onProgress("Running OCR on image (~5-10s)...");
    const ret = await window.Tesseract.recognize(file, 'eng');
    return cleanExtractedText(ret.data.text);
  }

  throw new Error("Unsupported format. Please upload PDF, Word (.docx), or Image.");
}


// ==========================================
// ETI-CRAFT ENGINE: PART 3 (TAILORING)
// ==========================================

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

function tailorCVToFitDescription() {
  const jd = document.getElementById('job-description-input').value.trim();
  const resume = document.getElementById('resume-input').value.trim();

  if (!jd) {
    alert("Please paste a Job Description first so we know what to tailor against!");
    return;
  }

  const candidate = extractCandidateDetails(resume);
  const parsedCV = parseResumeSections(resume);

  const keywords = extractJobKeywords(jd);
  const topHardSkills = keywords.hardSkills.slice(0, 6);
  const topVerbs = keywords.actionVerbs.length >= 3 ? keywords.actionVerbs : ["engineered", "streamlined", "orchestrated", "automated"];
  const critical = keywords.criticalKeywords.slice(0, 5);

  const firstLine = jd.split('\n')[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const targetTitle = firstLine.length < 40 && firstLine.length > 5 ? firstLine : "Workflow & Technology Specialist";

  const contactParts = [candidate.location];
  if (candidate.phone) contactParts.push(candidate.phone);
  if (candidate.email) contactParts.push(candidate.email);
  if (candidate.linkedin) contactParts.push(candidate.linkedin);
  const cleanContactBar = contactParts.join(' | ');

  const skillsList = topHardSkills.length ? topHardSkills.join(', ') : "process automation, workflow architecture, and API integration";
  const tailoredSummary = `Results-oriented ${targetTitle} with proven expertise in ${skillsList}. Demonstrates a proven track record of bridging technical execution with business operations, specializing in end-to-end workflow design, system optimization, and high-impact digital problem-solving. Committed to delivering scalable, high-efficiency solutions tailored to organizational objectives.`;

  const coreTech = topHardSkills.length ? topHardSkills.map(s => s.toUpperCase()).join(' • ') : "ZAPIER • MAKE.COM • AIRTABLE • REST APIS";
  const softCompetencies = keywords.softSkills.length ? keywords.softSkills.join(' • ') : "Cross-Functional Leadership • Agile Execution • Troubleshooting • Process Optimization";
  const tailoredSkills = `• Core Technical Stack: ${coreTech}\n• Functional Competencies: System Architecture, Workflow Automation, Webhook Engineering, Database Modeling\n• Operational & Soft Skills: ${softCompetencies}`;

  const verb1 = (topVerbs[0] || "Engineered").toUpperCase();
  const verb2 = (topVerbs[1] || "Automated").toUpperCase();
  const verb3 = (topVerbs[2] || "Streamlined").toUpperCase();
  const skill1 = critical[0] || "automation";
  const skill2 = critical[1] || "workflow systems";
  const skill3 = critical[2] || "API integrations";

  const tailoredExperience = `
<p class="font-bold text-slate-900">${targetTitle} | Professional Projects & Consulting</p>
<p class="text-slate-600 text-[11px] mb-2">2023 - Present | Remote</p>
<p class="mt-1">• <strong>${verb1}</strong> robust ${skill1} pipelines and data architectures, reducing manual processing overhead by 45% while ensuring 99.8% execution accuracy.</p>
<p class="mt-1">• <strong>${verb2}</strong> end-to-end ${skill2} and multi-system integrations to eliminate data silos and accelerate cross-functional delivery cycles by 3x.</p>
<p class="mt-1">• <strong>${verb3}</strong> scalable ${skill3} frameworks, collaborating directly with stakeholders to translate business bottlenecks into automated, measurable workflows.</p>
  `.trim();

  document.getElementById('cv-name').innerText = candidate.name;
  document.getElementById('cv-contact').innerText = cleanContactBar;
  document.getElementById('cv-summary-content').innerText = tailoredSummary;
  document.getElementById('cv-skills-content').innerText = tailoredSkills;
  document.getElementById('cv-experience-content').innerHTML = tailoredExperience;

  if (parsedCV.education && parsedCV.education.trim().length > 10) {
    document.getElementById('cv-education-content').innerText = parsedCV.education.trim();
  }

  document.title = `${candidate.name.replace(/\s+/g, '_')}_Tailored_Resume`;

  lastExtractedKeywords = keywords;
  document.getElementById('diagnostic-dashboard').classList.remove('hidden');
  recalculateAndRender();

  alert(`🎉 Success! CV completely tailored for ${candidate.name}. Ready to download and submit!`);
}


// ==========================================
// ETI-CRAFT ENGINE: PART 4 (UI, AUTH & PAY)
// ==========================================

function updateCVEditor(rawText) {
  if (!rawText || rawText.length < 20) return;
  const candidate = extractCandidateDetails(rawText);
  const parsed = parseResumeSections(rawText);

  if (candidate.name) document.getElementById('cv-name').innerText = candidate.name;
  
  const contactParts = [candidate.location];
  if (candidate.phone) contactParts.push(candidate.phone);
  if (candidate.email) contactParts.push(candidate.email);
  if (candidate.linkedin) contactParts.push(candidate.linkedin);
  document.getElementById('cv-contact').innerText = contactParts.join(' | ');

  if (parsed.summary) document.getElementById('cv-summary-content').innerText = parsed.summary.trim();
  if (parsed.skills) document.getElementById('cv-skills-content').innerText = parsed.skills.trim();
  if (parsed.experience) document.getElementById('cv-experience-content').innerText = parsed.experience.trim();
  if (parsed.education) document.getElementById('cv-education-content').innerText = parsed.education.trim();
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initFileUpload();
  initTabs();
  initScanner();
  initCVLiveEditor();
  renderUserAuthState();
});

// --- SIGN IN CONTROLLER (GOOGLE + EMAIL) ---
function initAuth() {
  const modal = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('close-auth-btn');
  const emailForm = document.getElementById('email-auth-form');
  const googleBtn = document.getElementById('google-auth-btn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  // 1. Sign In with Email
  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('auth-email-input');
      const email = emailInput ? emailInput.value.trim() : '';

      if (email) {
        const profile = { name: email.split('@')[0], email: email, provider: 'email' };
        localStorage.setItem('eticraft_user_profile', JSON.stringify(profile));
        if (modal) modal.classList.add('hidden');
        if (emailInput) emailInput.value = '';
        renderUserAuthState();
        alert(`Welcome, ${profile.name}! You are signed in.`);
      }
    });
  }

  // 2. Sign In with Google
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      const email = prompt("Enter your Google Account email (e.g. user@gmail.com):");
      if (email && email.includes('@')) {
        const profile = {
          name: email.split('@')[0].toUpperCase(),
          email: email,
          provider: 'google'
        };
        localStorage.setItem('eticraft_user_profile', JSON.stringify(profile));
        if (modal) modal.classList.add('hidden');
        renderUserAuthState();
        alert(`Signed in with Google as ${profile.name}!`);
      }
    });
  }
}


// --- DYNAMIC HEADER: SWITCHES BETWEEN 'SIGN IN' AND 'SIGN OUT' ---
function renderUserAuthState() {
  const user = getUser();
  const authContainer = document.getElementById('auth-container');
  const trialsBadge = document.getElementById('trials-remaining');

  if (trialsBadge) {
    trialsBadge.innerText = isSubscribed() ? "∞" : getTrialsRemaining();
  }

  if (!authContainer) return;

  // 1. IF SIGNED IN: Show Name + Red 'Sign Out' Button
  if (user) {
    authContainer.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xs font-semibold text-slate-800">👤 ${user.name}</span>
        <button id="signout-btn" class="text-xs bg-rose-50 text-rose-600 border border-rose-200 font-semibold px-2.5 py-1 rounded-md hover:bg-rose-100 transition cursor-pointer">
          Sign Out
        </button>
      </div>
    `;

    document.getElementById('signout-btn').addEventListener('click', () => {
      localStorage.removeItem('eticraft_user_profile');
      renderUserAuthState(); // Instantly returns to the Sign In button
      alert("You have successfully signed out.");
    });
  } 
  // 2. IF SIGNED OUT: Show the Black 'Sign In' Button
  else {
    authContainer.innerHTML = `
      <button id="auth-trigger-btn" class="text-xs bg-slate-900 text-white font-medium px-3.5 py-2 rounded-lg hover:bg-slate-800 transition cursor-pointer">
        Sign In
      </button>
    `;

    const triggerBtn = document.getElementById('auth-trigger-btn');
    const modal = document.getElementById('auth-modal');
    if (triggerBtn && modal) {
      triggerBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
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

        updateCVEditor(extracted);
        alert(`✅ Cleaned and loaded: ${file.name}`);
      } catch (err) {
        if (progressBar) progressBar.classList.add('hidden');
        alert(`Upload error: ${err.message}`);
      }
    });
  }

  if (resumeTextarea) {
    resumeTextarea.addEventListener('input', (e) => {
      updateCVEditor(e.target.value.trim());
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
  const autoTailorBtn = document.getElementById('auto-tailor-btn');
  const clearJd = document.getElementById('clear-jd-btn');
  const clearCv = document.getElementById('clear-cv-btn');
  const paywallModal = document.getElementById('paywall-modal');
  const closePaywall = document.getElementById('close-paywall-btn');
  const downloadPdf = document.getElementById('download-pdf-trigger');
  const paystackBtn = document.getElementById('paystack-subscribe-btn');

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

  if (autoTailorBtn) {
    autoTailorBtn.addEventListener('click', () => {
      if (!isSubscribed() && getTrialsRemaining() <= 0) {
        if (paywallModal) paywallModal.classList.remove('hidden');
        return;
      }
      if (!consumeTrial()) {
        if (paywallModal) paywallModal.classList.remove('hidden');
        return;
      }
      renderUserAuthState();
      tailorCVToFitDescription();
    });
  }

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const jd = document.getElementById('job-description-input').value.trim();
      if (!jd) {
        alert("Please paste a Job Description first.");
        return;
      }

      if (!isSubscribed() && getTrialsRemaining() <= 0) {
        if (paywallModal) paywallModal.classList.remove('hidden');
        return;
      }

      if (!consumeTrial()) {
        if (paywallModal) paywallModal.classList.remove('hidden');
        return;
      }

      renderUserAuthState();
      lastExtractedKeywords = extractJobKeywords(jd);
      document.getElementById('diagnostic-dashboard').classList.remove('hidden');
      recalculateAndRender();
    });
  }

  if (paystackBtn) {
    paystackBtn.addEventListener('click', initiatePaystackSubscription);
  }
}

function initiatePaystackSubscription() {
  const selectedPlan = document.querySelector('input[name="sub_plan"]:checked').value;
  const isYearly = selectedPlan === 'yearly';
  const amount = isYearly ? 30000 * 100 : 3000 * 100;

  const user = getUser();
  const userEmail = (user && user.email) ? user.email : "customer@example.com";

  if (!window.PaystackPop) {
    alert("Paystack could not load. Please check your internet connection.");
    return;
  }

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: userEmail,
    amount: amount,
    currency: "NGN",
    ref: "SUB_" + Math.floor((Math.random() * 1000000000) + 1),
    callback: function(response) {
      alert("🎉 Subscription Activated! Unlimited scans, tailoring, and PDF downloads unlocked.");
      localStorage.setItem('eticraft_subscribed', 'true');
      document.getElementById('paywall-modal').classList.add('hidden');
      renderUserAuthState();
    },
    onClose: function() {
      alert("Subscription payment was cancelled.");
    }
  });

  handler.openIframe();
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