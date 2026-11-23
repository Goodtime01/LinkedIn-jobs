import { INITIAL_JOBS, formatSalaryNaira } from './jobs.js';
import { toggleSaveJob, getSavedJobs, checkLinkedInPostQuota, markLinkedInPostUsed } from './storage.js';
import { fetchLiveJobs } from './fetch.js';

let allJobs = [...INITIAL_JOBS];
let activeFilter = 'All';
let currentTab = 'feed';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(console.error);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  renderJobs();
  setupFilterListeners();
  setupNavListeners();
  setupFormListener();

  // Fetch live jobs in the background without freezing the UI
  const liveJobs = await fetchLiveJobs();
  if (liveJobs && liveJobs.length > 0) {
    // Avoid duplicates
    const existingIds = new Set(allJobs.map(j => j.id));
    const uniqueLiveJobs = liveJobs.filter(j => !existingIds.has(j.id));
    
    allJobs = [...allJobs, ...uniqueLiveJobs];
    renderJobs();
  }
});

async function renderJobs() {
  const container = document.getElementById('jobs-container');
  const savedJobs = await getSavedJobs();
  const savedIds = new Set(savedJobs.map(j => j.id));

  let list = currentTab === 'saved' ? savedJobs : allJobs;

  if (activeFilter !== 'All') {
    list = list.filter(j => j.category === activeFilter);
  }

  if (list.length === 0) {
    container.innerHTML = `<p style="text-align:center; padding: 40px; color:#64748b;">No jobs found in this section.</p>`;
    return;
  }

  container.innerHTML = list.map(job => {
    const isSaved = savedIds.has(job.id);
    const foundingClass = job.is_founding ? 'is-founding' : '';
    const logoClass = job.logo_size === 'large' ? 'logo-large' : '';

    return `
      <div class="job-card ${foundingClass}" data-id="${job.id}">
        <div class="card-top">
          <img src="${job.company_logo}" alt="${job.company_name}" class="company-logo ${logoClass}">
          <div class="card-info">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="card-company">${job.company_name}</span>
              ${job.is_founding ? `<span class="founding-badge">Founding Post</span>` : ''}
            </div>
            <h2 class="card-title">${job.title}</h2>
          </div>
        </div>

        <div style="display:flex; align-items:baseline; gap:6px;">
          <span class="card-salary">${job.salary_text}</span>
          <span class="naira-approx">${formatSalaryNaira(job.salary_usd)}</span>
        </div>

        <div class="tags-row">
          <span class="pill pill-green">${job.type}</span>
          <span class="pill">${job.category}</span>
        </div>

        <div class="card-footer">
          <span>Source: ${job.source_name}</span>
          <button class="btn-save ${isSaved ? 'saved' : ''}" data-save-id="${job.id}">
            ${isSaved ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-save')) return;
      openJobModal(card.getAttribute('data-id'));
    });
  });

  container.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-save-id');
      const targetJob = allJobs.find(j => j.id === id);
      if (targetJob) {
        await toggleSaveJob(targetJob);
        renderJobs();
      }
    });
  });
}

function openJobModal(id) {
  const job = allJobs.find(j => j.id === id);
  if (!job) return;

  const modal = document.getElementById('job-modal');
  const details = document.getElementById('modal-details');
  const waText = encodeURIComponent(`Check out this role: ${job.title} at ${job.company_name} (${job.salary_text})`);

  details.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h2 style="font-size:1.1rem; font-weight:800;">${job.title}</h2>
      <button id="close-modal" style="background:none; border:none; font-size:1.4rem; cursor:pointer;">&times;</button>
    </div>
    <p style="color:#64748b; font-size:0.85rem;">${job.company_name} • ${job.type}</p>
    
    <div class="fit-box">
      <strong>Why this fits you:</strong><br>
      ${job.fit_summary}
    </div>

    <div style="margin: 8px 0;">
      <p style="font-weight:700; color:#16a34a;">${job.salary_text} ${formatSalaryNaira(job.salary_usd)}</p>
    </div>

    <p style="font-size:0.75rem; color:#64748b;">
      Original listing published via <strong>${job.source_name}</strong>.
    </p>

    <a href="${job.source_url}" target="_blank" rel="noopener noreferrer" class="btn-apply">
      View Original Listing & Apply ↗
    </a>

    <a href="https://wa.me/?text=${waText}" target="_blank" class="btn-whatsapp">
      Share on WhatsApp
    </a>
  `;

  modal.classList.add('active');
  document.getElementById('close-modal').addEventListener('click', () => modal.classList.remove('active'));
}

function setupFilterListeners() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-category');
      renderJobs();
    });
  });
}

function setupNavListeners() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      currentTab = targetTab;

      const feedContainer = document.getElementById('feed-section');
      const formContainer = document.getElementById('form-section');

      if (targetTab === 'post') {
        feedContainer.style.display = 'none';
        formContainer.style.display = 'flex';
        updateLinkedInPostQuotaUI();
      } else {
        feedContainer.style.display = 'block';
        formContainer.style.display = 'none';
        renderJobs();
      }
    });
  });
}

function updateLinkedInPostQuotaUI() {
  const isUsed = checkLinkedInPostQuota();
  const counterEl = document.getElementById('linkedin-post-quota-status');
  if (isUsed) {
    counterEl.innerText = "1/1 LinkedIn Post Used Today (Resets 7am tomorrow)";
    counterEl.style.color = "#dc2626";
  } else {
    counterEl.innerText = "0/1 LinkedIn Post Used Today (Available for this post)";
    counterEl.style.color = "#16a34a";
  }
}

function setupFormListener() {
  const form = document.getElementById('employer-post-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('job-title').value;
    const company = document.getElementById('company-name').value;
    const salaryUSD = parseInt(document.getElementById('salary-usd').value, 10);
    const category = document.getElementById('job-category').value;
    const applyUrl = document.getElementById('apply-url').value;
    const summary = document.getElementById('fit-summary').value;

    const newJob = {
      id: `custom-${Date.now()}`,
      title: title,
      company_name: company,
      company_logo: "https://dummyimage.com/100x100/16a34a/fff&text=★",
      category: category,
      type: "Remote",
      salary_usd: salaryUSD,
      salary_text: `$${salaryUSD.toLocaleString()}/month`,
      fit_summary: summary,
      source_name: company,
      source_url: applyUrl,
      is_founding: true,
      logo_size: "large"
    };

    allJobs.unshift(newJob);

    if (!checkLinkedInPostQuota()) {
      markLinkedInPostUsed();
      alert("Success! Your job is posted with Founding Employer perks and added to today's LinkedIn post queue!");
    } else {
      alert("Success! Your job is posted with Founding Employer perks. (Today's LinkedIn post quota is already full).");
    }

    form.reset();
    document.querySelector('.nav-item[data-tab="feed"]').click();
  });
}