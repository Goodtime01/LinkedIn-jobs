const USD_TO_NGN = 1500;

export const INITIAL_JOBS = [
  {
    id: "job-001",
    title: "Make.com & Airtable Specialist",
    company_name: "OpsScale Agency",
    company_logo: "https://dummyimage.com/100x100/16a34a/fff&text=Ops",
    category: "Automation",
    type: "Remote",
    salary_usd: 2500,
    salary_text: "$2,500/month",
    fit_summary: "Great match if you know webhook routing, nested JSON parsing, and building CRM dashboards in Airtable.",
    source_name: "Arbeitnow Open Feed",
    source_url: "https://www.arbeitnow.com",
    is_founding: true,
    logo_size: "large"
  },
  {
    id: "job-002",
    title: "Bubble.io Full-Stack Builder",
    company_name: "SaaS Launchers",
    company_logo: "https://dummyimage.com/100x100/3b82f6/fff&text=SaaS",
    category: "No-Code",
    type: "Remote",
    salary_usd: 3200,
    salary_text: "$3,200/month",
    fit_summary: "Ideal if you have shipped responsive web apps, configured custom states, and managed privacy rules in Bubble.",
    source_name: "RemoteOK API",
    source_url: "https://remoteok.com",
    is_founding: true,
    logo_size: "large"
  },
  {
    id: "job-003",
    title: "ChatGPT & Claude Workflow Builder",
    company_name: "HyperGrowth Media",
    company_logo: "https://dummyimage.com/100x100/8b5cf6/fff&text=AI",
    category: "AI Workflow",
    type: "Remote",
    salary_usd: 1800,
    salary_text: "$1,800/month",
    fit_summary: "You will chain prompt workflows, connect OpenAI assistants to Slack, and automate weekly research reports.",
    source_name: "Company Careers",
    source_url: "https://example.com/careers",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "job-004",
    title: "Executive Virtual Assistant (Zapier Savvy)",
    company_name: "Vantage Group LLC",
    company_logo: "https://dummyimage.com/100x100/f59e0b/fff&text=VG",
    category: "Virtual Assistant",
    type: "Remote",
    salary_usd: 900,
    salary_text: "$900/month",
    fit_summary: "Perfect entry role if you have exceptional English skills, inbox triage mastery, and understand basic Zapier auto-replies.",
    source_name: "RemoteOK API",
    source_url: "https://remoteok.com",
    is_founding: false,
    logo_size: "standard"
  }
];

export function formatSalaryNaira(usdAmount) {
  if (!usdAmount) return "";
  const ngn = usdAmount * USD_TO_NGN;
  return `(~₦${ngn.toLocaleString()}/mo)`;
}