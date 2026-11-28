import { ATSEngine } from './ats-engine.js';
import { CVUploader } from './cv-uploader.js';
import { AuthManager } from './auth.js';
import { ATSEngine } from './ats-engine.js';

// ==========================================
// 🔴 PAYSTACK LIVE PUBLIC KEY CONFIGURATION
// ==========================================
const PAYSTACK_PUBLIC_KEY = "pk_live_YOUR_PAYSTACK_KEY_HERE";

// State Management
let currentMode = 'tailor'; // 'tailor' | 'extractor'
let activeSection = 'skills'; // Default section to receive clicked keywords
let lastExtractedKeywords = null;
const MAX_FREE_TRIALS = 5;

// Trial & Auth Storage
const getTrialCount = () => parseInt(localStorage.getItem('eticraft_trials_used') || '0', 10);
const incrementTrial = () => localStorage.setItem('eticraft_trials_used', (getTrialCount() + 1).toString());
const isSubscriber = () => localStorage.getItem('eticraft_subscribed') === 'true';

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  updateTrialDisplay();
  setupSectionTracking();
  setupFileUploadListeners();
  setupAuthListeners();
  renderUserAuthState();
});

function updateTrialDisplay() {
  const remaining = Math.max(0, MAX_FREE_TRIALS - getTrialCount());
  const badge = document.getElementById('trials-remaining');
  if (badge) badge.innerText = isSubscriber() ? "∞" : remaining;

  if (!isSubscriber() && remaining === 0) {
    document.getElementById('trial-counter-badge').classList.replace('bg-amber-50', 'bg-rose-50');
    document.getElementById('trial-counter-badge').classList.replace('text-amber-800', 'text-rose-800');
  }
}

function initUI() {
  // Mode Tabs
  const tabTailor = document.getElementById('tab-tailor');
  const tabExtractor = document.getElementById('tab-extractor');
  const cvInputWrapper = document.getElementById('cv-input-wrapper');
  const catView = document.getElementById('categorized-extractor-view');

  tabTailor.addEventListener('click', () => {
    currentMode = 'tailor';
    tabTailor.className = "tab-btn active-tab pb-3 font-semibold text-sm border-b-2 border-brand text-brand flex items-center gap-2";
    tabExtractor.className = "tab-btn pb-3 font-semibold text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2";
    cvInputWrapper.classList.remove('hidden');
    catView.classList.add('hidden');
  });

  tabExtractor.addEventListener('click', () => {
    currentMode = 'extractor';
    tabExtractor.className = "tab-btn active-tab pb-3 font-semibold text-sm border-b-2 border-brand text-brand flex items-center gap-2";
    tabTailor.className = "tab-btn pb-3 font-semibold text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2";
    cvInputWrapper.classList.add('hidden');
  });

  // Action Buttons
  document.getElementById('run-scanner-btn').addEventListener('click', handleAnalysis);
  document.getElementById('download-pdf-trigger').addEventListener('click', handlePDFDownloadTrigger);
  document.getElementById('close-paywall-btn').addEventListener('click', () => {
    document.getElementById('paywall-modal').classList.add('hidden');
  });
  document.getElementById('paystack-subscribe-btn').addEventListener('click', initiatePaystackSubscription);

  // Raw CV Auto-Detection on Paste
  document.getElementById('resume-input').addEventListener('input', (e) => {
    const rawCV = e.target.value;
    if (rawCV.length > 50) {
      const parsed = ATSEngine.parseResumeSections(rawCV);
      if (parsed.summary) document.getElementById('cv-summary-content').innerText = parsed.summary;
      if (parsed.skills) document.getElementById('cv-skills-content').innerText = parsed.skills;
      if (parsed.experience) document.getElementById('cv-experience-content').innerText = parsed.experience;
      if (parsed.education) document.getElementById('cv-education-content').innerText = parsed.education;
    }
  });
}

// Active CV Section Tracking
function setupSectionTracking() {
  const sections = document.querySelectorAll('.cv-editable-content');
  sections.forEach(sec => {
    sec.addEventListener('focus', () => {
      const parentSec = sec.closest('.cv-section');
      if (parentSec) {
        activeSection = parentSec.getAttribute('data-section');
        document.getElementById('active-section-indicator').innerText = activeSection.toUpperCase();
      }
    });

    // Real-time recalculation as user types into their CV
    sec.addEventListener('input', () => {
      if (lastExtractedKeywords) recalculateScore();
    });
  });
}

// The Core Scanner Handler
function handleAnalysis() {
  const jdText = document.getElementById('job-description-input').value.trim();
  const resumeText = document.getElementById('resume-input').value.trim();

  if (!jdText) {
    alert("Please paste a Job Description first.");
    return;
  }

  // Quota check
  if (!isSubscriber() && getTrialCount() >= MAX_FREE_TRIALS) {
    document.getElementById('paywall-modal').classList.remove('hidden');
    return;
  }

  incrementTrial();
  updateTrialDisplay();

  lastExtractedKeywords = ATSEngine.extractJobKeywords(jdText);
  document.getElementById('diagnostic-dashboard').classList.remove('hidden');

  if (currentMode === 'extractor') {
    renderCategorizedExtractor(lastExtractedKeywords);
    return;
  }

  recalculateScore();
}

function recalculateScore() {
  // Aggregate current content from the Live CV Tailor editor
  const liveCVText = [
    document.getElementById('cv-summary-content').innerText,
    document.getElementById('cv-skills-content').innerText,
    document.getElementById('cv-experience-content').innerText,
    document.getElementById('cv-education-content').innerText
  ].join(' ');

  const result = ATSEngine.calculateMatch(lastExtractedKeywords, liveCVText);

  // Update Score UI
  const scoreText = document.getElementById('match-score-text');
  scoreText.innerText = `${result.score}%`;
  
  const scoreRing = document.getElementById('score-ring');
  if (result.score >= 75) {
    scoreRing.className = "relative w-24 h-24 flex items-center justify-center rounded-full bg-emerald-50 border-4 border-emerald-500 text-emerald-600";
    document.getElementById('score-headline').innerText = "🔥 High ATS Compatibility!";
  } else if (result.score >= 50) {
    scoreRing.className = "relative w-24 h-24 flex items-center justify-center rounded-full bg-amber-50 border-4 border-amber-500 text-amber-600";
    document.getElementById('score-headline').innerText = "⚠️ Moderate Match. Add Missing Keywords.";
  } else {
    scoreRing.className = "relative w-24 h-24 flex items-center justify-center rounded-full bg-rose-50 border-4 border-rose-500 text-rose-600";
    document.getElementById('score-headline').innerText = "❌ Low Match. Key Skills Missing.";
  }

  // Render Missing Keywords (Red Clickable Pills)
  const missingContainer = document.getElementById('missing-keywords-container');
  document.getElementById('missing-count').innerText = result.missingKeywords.length;
  missingContainer.innerHTML = result.missingKeywords.map(kw => `
    <button class="missing-keyword-pill px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1 transition" data-keyword="${kw}">
      <span>+</span> ${kw}
    </button>
  `).join('');

  // Render Matched Keywords (Green Badges)
  const matchedContainer = document.getElementById('matched-keywords-container');
  document.getElementById('matched-count').innerText = result.matchedKeywords.length;
  matchedContainer.innerHTML = result.matchedKeywords.map(kw => `
    <span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
      ✓ ${kw}
    </span>
  `).join('');

  // Attach One-Tap Click-to-Insert Listeners
  missingContainer.querySelectorAll('.missing-keyword-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const kw = btn.getAttribute('data-keyword');
      insertKeywordIntoActiveSection(kw);
    });
  });
}

// Click-to-insert missing keyword directly into active CV section
function insertKeywordIntoActiveSection(keyword) {
  let targetEditor = document.getElementById(`cv-${activeSection}-content`);
  if (!targetEditor) targetEditor = document.getElementById('cv-skills-content');

  // Insert naturally
  if (activeSection === 'skills') {
    targetEditor.innerText = targetEditor.innerText.trim() + `, ${keyword}`;
  } else {
    targetEditor.innerText = targetEditor.innerText.trim() + ` [Demonstrated proficiency in ${keyword}].`;
  }

  // Instant re-score
  recalculateScore();
}

function renderCategorizedExtractor(data) {
  const catView = document.getElementById('categorized-extractor-view');
  catView.classList.remove('hidden');

  document.getElementById('cat-hard-skills').innerHTML = data.hardSkills.map(s => `<li>• ${s}</li>`).join('') || "<li>None detected</li>";
  document.getElementById('cat-soft-skills').innerHTML = data.softSkills.map(s => `<li>• ${s}</li>`).join('') || "<li>None detected</li>";
  document.getElementById('cat-action-verbs').innerHTML = data.actionVerbs.map(s => `<li>• ${s}</li>`).join('') || "<li>None detected</li>";
}

// PDF Download Trigger & Paywall Enforcement
function handlePDFDownloadTrigger() {
  if (!isSubscriber() && getTrialCount() > MAX_FREE_TRIALS) {
    document.getElementById('paywall-modal').classList.remove('hidden');
    return;
  }
  // Standard Clean Browser Print (formats cleanly to PDF via CSS @media print)
  window.print();
}

// Paystack Inline Checkout
function initiatePaystackSubscription() {
  const selectedPlan = document.querySelector('input[name="sub_plan"]:checked').value;
  const isYearly = selectedPlan === 'yearly';
  const amount = isYearly ? 30000 * 100 : 3000 * 100; // In Kobo

  const userEmail = localStorage.getItem('eticraft_user_email') || "customer@example.com";

  if (!window.PaystackPop) {
    alert("Payment gateway failed to load. Please check your internet connection.");
    return;
  }

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: userEmail,
    amount: amount,
    currency: "NGN",
    ref: "ETC_" + Math.floor((Math.random() * 1000000000) + 1),
    callback: function(response) {
      alert("🎉 Subscription Activated! Unlimited scans and PDF downloads unlocked.");
      localStorage.setItem('eticraft_subscribed', 'true');
      document.getElementById('paywall-modal').classList.add('hidden');
      updateTrialDisplay();
    },
    onClose: function() {
      alert("Payment cancelled.");
    }
  });

  handler.openIframe();
}

// Document & Image Upload Listener
function setupFileUploadListeners() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('cv-file-input');
  const progressBar = document.getElementById('upload-progress-bar');
  const resumeTextarea = document.getElementById('resume-input');

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      progressBar.classList.remove('hidden');
      progressBar.innerText = "⏳ Processing file... please wait";

      const extractedText = await CVUploader.processFile(file, (msg) => {
        progressBar.innerText = `⏳ ${msg}`;
      });

      resumeTextarea.value = extractedText;
      progressBar.classList.add('hidden');

      // Auto-parse into Live CV Tailor sections
      const parsed = ATSEngine.parseResumeSections(extractedText);
      if (parsed.summary) document.getElementById('cv-summary-content').innerText = parsed.summary;
      if (parsed.skills) document.getElementById('cv-skills-content').innerText = parsed.skills;
      if (parsed.experience) document.getElementById('cv-experience-content').innerText = parsed.experience;
      if (parsed.education) document.getElementById('cv-education-content').innerText = parsed.education;

      alert(`✅ Successfully loaded: ${file.name}`);
    } catch (err) {
      progressBar.classList.add('hidden');
      alert(`Upload error: ${err.message}`);
    }
  });
}

// Google & Email Sign In Listeners
function setupAuthListeners() {
  const authModal = document.getElementById('auth-modal');
  const triggerBtn = document.getElementById('auth-trigger-btn');
  const closeBtn = document.getElementById('close-auth-btn');
  const emailForm = document.getElementById('email-auth-form');

  if (triggerBtn) triggerBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
  if (closeBtn) closeBtn.addEventListener('click', () => authModal.classList.add('hidden'));

  // Email Submit
  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email-input').value.trim();
      if (email) {
        AuthManager.signInWithEmail(email);
        authModal.classList.add('hidden');
        renderUserAuthState();
      }
    });
  }

  // Google Identity Services Initializer
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // Optional, works in demo
      callback: (res) => {
        const user = AuthManager.handleGoogleCredential(res);
        if (user) {
          authModal.classList.add('hidden');
          renderUserAuthState();
        }
      }
    });
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-wrapper'),
      { theme: "outline", size: "large", width: 240 }
    );
  }
}

function renderUserAuthState() {
  const user = AuthManager.getUser();
  const authContainer = document.getElementById('auth-container');
  const trials = AuthManager.getTrialsRemaining();
  
  document.getElementById('trials-remaining').innerText = AuthManager.isSubscribed() ? "∞" : trials;

  if (user) {
    authContainer.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xs font-semibold text-slate-700">${user.name}</span>
        <button id="signout-btn" class="text-[11px] text-slate-400 hover:text-rose-600 underline">Sign out</button>
      </div>
    `;
    document.getElementById('signout-btn').addEventListener('click', () => {
      AuthManager.signOut();
      renderUserAuthState();
    });
  }
}