// Rate: 1 USD = ~1,500 NGN
const USD_TO_NGN = 1500;

export const INITIAL_JOBS = [
  // ==========================================
  // 1. AUTOMATION (5 Roles)
  // ==========================================
  {
    id: "auto-001",
    title: "Senior Make.com & Airtable Architect",
    company_name: "OpsScale Systems",
    company_logo: "https://dummyimage.com/100x100/16a34a/fff&text=Ops",
    category: "Automation",
    type: "Remote",
    salary_usd: 2800,
    salary_text: "$2,800/month",
    fit_summary: "Ideal if you have mastered webhook payloads, router error handling, and relational schema modeling in Airtable.",
    source_name: "Arbeitnow Open Feed",
    source_url: "https://www.arbeitnow.com",
    is_founding: true,
    logo_size: "large"
  },
  {
    id: "auto-002",
    title: "Zapier & HubSpot Workflow Specialist",
    company_name: "GrowthFunnel Digital",
    company_logo: "https://dummyimage.com/100x100/ea580c/fff&text=GF",
    category: "Automation",
    type: "Remote",
    salary_usd: 2200,
    salary_text: "$2,200/month",
    fit_summary: "Great match for builders who connect lead forms to multi-step Zapier sequences and automated CRM deal tracking.",
    source_name: "RemoteOK",
    source_url: "https://remoteok.com",
    is_founding: true,
    logo_size: "large"
  },
  {
    id: "auto-003",
    title: "n8n Self-Hosted Automation Engineer",
    company_name: "CloudFlow Labs",
    company_logo: "https://dummyimage.com/100x100/0284c7/fff&text=CF",
    category: "Automation",
    type: "Remote",
    salary_usd: 3500,
    salary_text: "$3,500/month",
    fit_summary: "Perfect if you understand Docker deployments, JavaScript nodes in n8n, and custom REST API integrations.",
    source_name: "WeWorkRemotely",
    source_url: "https://weworkremotely.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "auto-004",
    title: "E-Commerce Automation Manager (Shopify + Klaviyo)",
    company_name: "CartBoost Global",
    company_logo: "https://dummyimage.com/100x100/10b981/fff&text=CB",
    category: "Automation",
    type: "Remote",
    salary_usd: 1900,
    salary_text: "$1,900/month",
    fit_summary: "You will manage abandoned cart webhooks, inventory sync automations, and transactional email triggers.",
    source_name: "RemoteOK",
    source_url: "https://remoteok.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "auto-005",
    title: "Billing & Stripe Operations Automator",
    company_name: "FinPulse Tech",
    company_logo: "https://dummyimage.com/100x100/6366f1/fff&text=FP",
    category: "Automation",
    type: "Remote",
    salary_usd: 2400,
    salary_text: "$2,400/month",
    fit_summary: "Handle failed invoice retries, subscription churn webhooks, and automated revenue reconciliation in Google Sheets.",
    source_name: "Company Careers",
    source_url: "https://example.com/careers",
    is_founding: false,
    logo_size: "standard"
  },

  // ==========================================
  // 2. NO-CODE DEVELOPMENT (5 Roles)
  // ==========================================
  {
    id: "nocode-001",
    title: "Bubble.io Full-Stack Web App Builder",
    company_name: "SaaS Launchers",
    company_logo: "https://dummyimage.com/100x100/2563eb/fff&text=Bubble",
    category: "No-Code",
    type: "Remote",
    salary_usd: 3200,
    salary_text: "$3,200/month",
    fit_summary: "Build customer portals and MVP marketplaces with complex database privacy rules and custom API connector plugins.",
    source_name: "RemoteOK",
    source_url: "https://remoteok.com",
    is_founding: true,
    logo_size: "large"
  },
  {
    id: "nocode-002",
    title: "Webflow CMS & Interactions Specialist",
    company_name: "Studio Nova",
    company_logo: "https://dummyimage.com/100x100/4338ca/fff&text=WF",
    category: "No-Code",
    type: "Remote",
    salary_usd: 2600,
    salary_text: "$2,600/month",
    fit_summary: "Translate Figma prototypes into pixel-perfect responsive Webflow websites with clean Client-First naming.",
    source_name: "Arbeitnow Open Feed",
    source_url: "https://www.arbeitnow.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "nocode-003",
    title: "FlutterFlow Mobile App Developer",
    company_name: "AppSprint Mobile",
    company_logo: "https://dummyimage.com/100x100/0ea5e9/fff&text=FF",
    category: "No-Code",
    type: "Remote",
    salary_usd: 3000,
    salary_text: "$3,000/month",
    fit_summary: "Great opportunity to ship cross-platform iOS and Android apps connected to Supabase and Firebase backends.",
    source_name: "WeWorkRemotely",
    source_url: "https://weworkremotely.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "nocode-004",
    title: "Internal Tools Developer (Retool / Appsmith)",
    company_name: "Logix Logistics",
    company_logo: "https://dummyimage.com/100x100/334155/fff&text=Tool",
    category: "No-Code",
    type: "Remote",
    salary_usd: 2700,
    salary_text: "$2,700/month",
    fit_summary: "Build internal inventory dashboards and operational tools connected directly to SQL databases and REST endpoints.",
    source_name: "Company Careers",
    source_url: "https://example.com/careers",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "nocode-005",
    title: "Glide & Softr Portal Developer",
    company_name: "CommunityHub",
    company_logo: "https://dummyimage.com/100x100/14b8a6/fff&text=Glide",
    category: "No-Code",
    type: "Remote",
    salary_usd: 1700,
    salary_text: "$1,700/month",
    fit_summary: "Design clean member portals and client intake directories backed by Airtable and Google Sheets databases.",
    source_name: "RemoteOK",
    source_url: "https://remoteok.com",
    is_founding: false,
    logo_size: "standard"
  },

  // ==========================================
  // 3. AI WORKFLOW (5 Roles)
  // ==========================================
  {
    id: "ai-001",
    title: "ChatGPT & Claude Workflow Engineer",
    company_name: "HyperGrowth Media",
    company_logo: "https://dummyimage.com/100x100/8b5cf6/fff&text=AI",
    category: "AI Workflow",
    type: "Remote",
    salary_usd: 2500,
    salary_text: "$2,500/month",
    fit_summary: "Chain multi-prompt LLM pipelines, create custom OpenAI Assistants, and automate long-form research summaries.",
    source_name: "Arbeitnow Open Feed",
    source_url: "https://www.arbeitnow.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "ai-002",
    title: "AI Customer Support Agent Configurator",
    company_name: "ReplyHero AI",
    company_logo: "https://dummyimage.com/100x100/7c3aed/fff&text=RH",
    category: "AI Workflow",
    type: "Remote",
    salary_usd: 2100,
    salary_text: "$2,100/month",
    fit_summary: "Train and deploy custom chatbots on Voiceflow or Botpress using internal company documentation and FAQ sheets.",
    source_name: "WeWorkRemotely",
    source_url: "https://weworkremotely.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "ai-003",
    title: "Generative Content Operations Lead",
    company_name: "PixelCraft Studios",
    company_logo: "https://dummyimage.com/100x100/ec4899/fff&text=PC",
    category: "AI Workflow",
    type: "Remote",
    salary_usd: 1800,
    salary_text: "$1,800/month",
    fit_summary: "Build Midjourney prompt templates and run bulk AI image generation pipelines for social media campaigns.",
    source_name: "Company Careers",
    source_url: "https://example.com/careers",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "ai-004",
    title: "Notion AI & Knowledge Base Architect",
    company_name: "Synergy Workspace",
    company_logo: "https://dummyimage.com/100x100/0f172a/fff&text=Notion",
    category: "AI Workflow",
    type: "Remote",
    salary_usd: 1600,
    salary_text: "$1,600/month",
    fit_summary: "Structure company Notion workspaces, link Q&A databases, and integrate AI summarization workflows for teams.",
    source_name: "RemoteOK",
    source_url: "https://remoteok.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "ai-005",
    title: "Outbound Lead Enrichment AI Specialist",
    company_name: "PipelineAI",
    company_logo: "https://dummyimage.com/100x100/d97706/fff&text=Pipe",
    category: "AI Workflow",
    type: "Remote",
    salary_usd: 2300,
    salary_text: "$2,300/month",
    fit_summary: "Use Clay.com and ChatGPT API calls to research prospect websites and auto-write personalized cold outreach copy.",
    source_name: "Arbeitnow Open Feed",
    source_url: "https://www.arbeitnow.com",
    is_founding: false,
    logo_size: "standard"
  },

  // ==========================================
  // 4. VIRTUAL ASSISTANT (5 Roles)
  // ==========================================
  {
    id: "va-001",
    title: "Executive Virtual Assistant (Zapier Savvy)",
    company_name: "Vantage Group LLC",
    company_logo: "https://dummyimage.com/100x100/f59e0b/fff&text=VG",
    category: "Virtual Assistant",
    type: "Remote",
    salary_usd: 1200,
    salary_text: "$1,200/month",
    fit_summary: "Ideal entry role if you have strong English fluency, calendar management skills, and basic Zapier workflow skills.",
    source_name: "RemoteOK",
    source_url: "https://remoteok.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "va-002",
    title: "Operations & Project Management VA",
    company_name: "ScaleUp Co",
    company_logo: "https://dummyimage.com/100x100/059669/fff&text=SU",
    category: "Virtual Assistant",
    type: "Remote",
    salary_usd: 1400,
    salary_text: "$1,400/month",
    fit_summary: "Manage ClickUp and Asana sprint boards, track team deadlines, and organize client onboarding documents.",
    source_name: "WeWorkRemotely",
    source_url: "https://weworkremotely.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "va-003",
    title: "E-Commerce Customer Care & Order VA",
    company_name: "Nordic Goods Online",
    company_logo: "https://dummyimage.com/100x100/0284c7/fff&text=NG",
    category: "Virtual Assistant",
    type: "Remote",
    salary_usd: 1000,
    salary_text: "$1,000/month",
    fit_summary: "Handle customer inquiries through Zendesk/Gorgias, process returns on Shopify, and manage shipping escalations.",
    source_name: "RemoteOK",
    source_url: "https://remoteok.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "va-004",
    title: "Lead Generation & Research Assistant",
    company_name: "Apex Outreach",
    company_logo: "https://dummyimage.com/100x100/e11d48/fff&text=Apex",
    category: "Virtual Assistant",
    type: "Remote",
    salary_usd: 950,
    salary_text: "$950/month",
    fit_summary: "Scrape verified prospect emails via LinkedIn Sales Navigator, clean spreadsheets, and upload leads into Lemlist.",
    source_name: "Arbeitnow Open Feed",
    source_url: "https://www.arbeitnow.com",
    is_founding: false,
    logo_size: "standard"
  },
  {
    id: "va-005",
    title: "Social Media & Community Support VA",
    company_name: "CreatorPulse",
    company_logo: "https://dummyimage.com/100x100/9333ea/fff&text=CP",
    category: "Virtual Assistant",
    type: "Remote",
    salary_usd: 1100,
    salary_text: "$1,100/month",
    fit_summary: "Schedule social posts using Buffer or Metricool, reply to community DMs, and compile weekly engagement metrics.",
    source_name: "Company Careers",
    source_url: "https://example.com/careers",
    is_founding: false,
    logo_size: "standard"
  }
];

// Dual-currency helper: Calculates estimated Naira
export function formatSalaryNaira(usdAmount) {
  if (!usdAmount) return "";
  const ngn = usdAmount * USD_TO_NGN;
  return `(~₦${ngn.toLocaleString()}/mo)`;
}