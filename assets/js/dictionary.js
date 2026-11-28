// High-precision taxonomy for No-Code, Automation, AI Workflow & General Tech
export const HARD_SKILLS = [
  // Automation & Data
  "zapier", "make.com", "integromat", "airtable", "n8n", "hubspot", "webhooks",
  "rest api", "json", "graphql", "sql", "postgresql", "supabase", "firebase",
  "workato", "tray.io", "rpa", "power automate", "etl", "database architecture",
  
  // No-Code Builders
  "bubble.io", "bubble", "webflow", "glide", "flutterflow", "retool", "appsmith",
  "softr", "framer", "shopify", "wordpress", "figma", "cms", "responsive design",

  // AI & Workflow
  "chatgpt", "openai", "claude", "anthropic", "llm", "prompt engineering",
  "langchain", "voiceflow", "botpress", "midjourney", "ai agents", "automation",

  // Technical Operations
  "git", "github", "ci/cd", "docker", "javascript", "python", "html5", "css3",
  "project management", "clickup", "asana", "jira", "notion", "trello", "scrum"
];

export const SOFT_SKILLS = [
  "cross-functional collaboration", "stakeholder management", "communication",
  "problem solving", "critical thinking", "adaptability", "time management",
  "attention to detail", "client management", "analytical skills", "leadership",
  "autonomous execution", "troubleshooting", "process optimization"
];

export const ACTION_VERBS = [
  "spearheaded", "architected", "engineered", "automated", "streamlined",
  "deployed", "orchestrated", "optimized", "integrated", "eliminated",
  "designed", "developed", "formulated", "executed", "managed", "scaled"
];

// 120+ Common English Stop-words to reject false-positive keywords
export const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
  "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into",
  "is", "isn't", "it", "its", "itself", "let's", "me", "more", "most", "mustn't",
  "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
  "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same",
  "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs",
  "them", "themselves", "then", "there", "these", "they", "this", "those", "through",
  "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
  "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your"
]);