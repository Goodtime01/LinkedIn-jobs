import { formatSalaryNaira } from './jobs.js';

// Keywords to match our 4 strict categories
const CATEGORY_MAP = {
  'Automation': ['zapier', 'make.com', 'integromat', 'airtable', 'automation', 'workflow', 'n8n'],
  'No-Code': ['bubble', 'webflow', 'glide', 'flutterflow', 'nocode', 'no-code', 'retool'],
  'AI Workflow': ['chatgpt', 'openai', 'prompt', 'llm', 'claude', 'ai agent', 'midjourney'],
  'Virtual Assistant': ['virtual assistant', 'executive assistant', 'operations assistant', 'data entry']
};

// Generates an original summary so Google doesn't penalize duplicate content
function generateOriginalSummary(title, company, category) {
  if (category === 'Automation') {
    return `Ideal role at ${company} for builders who know how to connect APIs, configure webhook triggers, and automate repetitive workflows.`;
  }
  if (category === 'No-Code') {
    return `Great fit if you have experience shipping visual apps, managing responsive layouts, and structuring database workflows.`;
  }
  if (category === 'AI Workflow') {
    return `Strong match if you know how to build prompts, chain AI agents, and integrate LLM tools into daily team operations.`;
  }
  return `Excellent remote opportunity at ${company} managing schedules, inbox workflows, and digital operations.`;
}

// Fetch live jobs from the free Arbeitnow public API
export async function fetchLiveJobs() {
  const fetchedJobs = [];

  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api');
    if (!res.ok) throw new Error('Network error fetching Arbeitnow feed');

    const data = await res.json();
    const remoteListings = data.data.filter(j => j.remote === true);

    for (const item of remoteListings) {
      const textToScan = `${item.title} ${item.tags.join(' ')} ${item.description}`.toLowerCase();
      
      let matchedCategory = null;
      for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some(k => textToScan.includes(k))) {
          matchedCategory = category;
          break;
        }
      }

      // Only import if it fits our 4 categories
      if (matchedCategory) {
        // Safe default USD salary estimate for remote roles if not specified
        const estimatedUsd = 2000; 
        
        fetchedJobs.push({
          id: `arbeitnow-${item.slug}`,
          title: item.title,
          company_name: item.company_name,
          company_logo: "https://dummyimage.com/100x100/16a34a/fff&text=Job",
          category: matchedCategory,
          type: "Remote",
          salary_usd: estimatedUsd,
          salary_text: `$${estimatedUsd.toLocaleString()}/month`,
          fit_summary: generateOriginalSummary(item.title, item.company_name, matchedCategory),
          source_name: "Arbeitnow Open Feed",
          source_url: item.url,
          is_founding: false,
          logo_size: "standard"
        });
      }

      // Cap at 15 live jobs so the page stays fast on slow networks
      if (fetchedJobs.length >= 15) break;
    }
  } catch (error) {
    console.warn("Live fetch skipped (running offline or network restricted):", error);
  }

  return fetchedJobs;
}