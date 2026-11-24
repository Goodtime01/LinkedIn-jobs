import { INITIAL_JOBS, formatSalaryNaira } from './jobs.js';
import { toggleSaveJob, getSavedJobs } from './storage.js';
import { fetchLiveJobs } from './fetch.js';

let allJobs = [...INITIAL_JOBS];
let activeFilter = 'All';
let currentTab = 'feed';

// Register Service Worker for Offline browsing
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

  // Load live jobs in the background
  const liveJobs = await fetchLiveJobs();
  if (liveJobs && liveJobs.length > 0) {
    const existingIds = new Set(allJobs.map(j => j.id));
    const uniqueLiveJobs = liveJobs.filter(j => !existingIds.has(j.id));
    
    allJobs = [...allJobs, ...uniqueLiveJobs];
    renderJobs();
  }
});

// Render cards to the screen
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

  // Click card to open modal
  container.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-save')) return;
      openJobModal(card.getAttribute('data-id'));
    });
  });

  // Click bookmark button
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

  // 🔴 INJECT GOOGLE JOB SCHEMA INTO THE HEAD
  injectGoogleJobSchema(list);
}

// Invisible Google Jobs SEO Tag
function injectGoogleJobSchema(jobList) {
  const oldScript = document.getElementById('google-job-schema');
  if (oldScript) oldScript.remove();

  const schemaData = jobList.map(job => ({
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.fit_summary,
    "identifier": {
      "@type": "PropertyValue",
      "name": job.company_name,
      "value": job.id
    },
    "datePosted": new Date().toISOString().slice(0, 10),
    "validThrough": new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company_name,
      "logo": job.company_logo
    },
    "jobLocationType": "TELECOMMUTE",
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Worldwide"
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": {
        "@type": "QuantitativeValue",
        "value": job.salary_usd,
        "unitText": "MONTH"
      }
    }
  }));

  const script = document.createElement('script');
  script.id = 'google-job-schema';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schemaData);
  document.head.appendChild(script);
}

// Modal view
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

// Filters
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

// Bottom Navigation
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
      } else {
        feedContainer.style.display = 'block';
        formContainer.style.display = 'none';
        renderJobs();
      }
    });
  });
}

// Handle Employer Post Job with Paystack Live Integration
function setupFormListener() {
  const form = document.getElementById('employer-post-form');
  
  // 🔴 1. PASTE YOUR PAYSTACK LIVE PUBLIC KEY HERE (Starts with pk_live_...)
  const PAYSTACK_PUBLIC_KEY = "pk_live_YOUR_PAYSTACK_KEY_HERE";
  
  // 🔴 2. PASTE YOUR FORMSPREE URL HERE
  const FORMSPREE_URL = "https://formspree.io/f/YOUR_ID_HERE";

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('job-title').value;
    const company = document.getElementById('company-name').value;
    const email = document.getElementById('employer-email').value;
    const salaryUSD = parseInt(document.getElementById('salary-usd').value, 10);
    const category = document.getElementById('job-category').value;
    const applyUrl = document.getElementById('apply-url').value;
    const summary = document.getElementById('fit-summary').value;
    const tier = document.getElementById('listing-tier').value;

    const isFeatured = (tier === 'featured');

    // Function to finish publishing the job to feed & email
    const finalizeJobPost = async (payRef = "Free_Listing") => {
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
        is_founding: isFeatured,
        logo_size: isFeatured ? "large" : "standard"
      };

      try {
        if (FORMSPREE_URL && !FORMSPREE_URL.includes("YOUR_ID_HERE")) {
          await fetch(FORMSPREE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              role: title,
              company: company,
              employer_email: email,
              tier: isFeatured ? "⭐ Featured (Paid ₦25,000)" : "Standard (Free)",
              payment_reference: payRef,
              salary_usd: `$${salaryUSD}/month`,
              category: category,
              apply_link: applyUrl,
              summary: summary,
              submitted_at: new Date().toLocaleString()
            })
          });
        }
      } catch (err) {
        console.warn("Notification error:", err);
      }

      allJobs.unshift(newJob);
      alert(isFeatured 
        ? "🎉 Payment Successful! Your job is now live with Featured perks (Yellow Highlight + 2x Logo)!" 
        : "Success! Your standard role has been submitted and added to the feed!");

      form.reset();
      document.querySelector('.nav-item[data-tab="feed"]').click();
    };

    // If Featured Tier is selected, trigger Paystack checkout popup
    if (isFeatured) {
      if (!window.PaystackPop) {
        alert("Paystack could not load. Please check your internet connection.");
        return;
      }

      const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: 25000 * 100, // ₦25,000 in Kobo
        currency: 'NGN',
        ref: 'NCJ_' + Math.floor((Math.random() * 1000000000) + 1),
        metadata: {
          custom_fields: [
            { display_name: "Job Title", variable_name: "job_title", value: title },
            { display_name: "Company", variable_name: "company_name", value: company }
          ]
        },
        callback: function(response) {
          // Payment confirmed by Paystack!
          finalizeJobPost(response.reference);
        },
        onClose: function() {
          alert("Payment was cancelled. Your job has not been posted.");
        }
      });

      handler.openIframe();
    } else {
      // Standard free post
      finalizeJobPost();
    }
  });
}