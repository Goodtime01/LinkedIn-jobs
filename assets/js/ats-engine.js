import { HARD_SKILLS, SOFT_SKILLS, ACTION_VERBS, STOP_WORDS } from './dictionary.js';

export class ATSEngine {
  // Regex that preserves dotted tools (make.com), hyphenated (ci/cd), and clean tokens
  static tokenize(text) {
    if (!text) return [];
    const normalized = text.toLowerCase();
    const tokens = normalized.match(/[a-z0-9]+([\.\-\/][a-z0-9]+)*/g) || [];
    return tokens.filter(t => !STOP_WORDS.has(t) && t.length > 1);
  }

  // Generates Unigrams + Bigrams to capture multi-word keywords (e.g., "rest api")
  static extractNGrams(text) {
    const tokens = this.tokenize(text);
    const ngrams = new Set(tokens);

    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      ngrams.add(bigram);
    }
    return ngrams;
  }

  // Extracts and classifies keywords from a raw Job Description
  static extractJobKeywords(jobText) {
    const rawTokens = this.tokenize(jobText);
    const ngrams = this.extractNGrams(jobText);
    
    // Frequency map
    const frequencyMap = {};
    rawTokens.forEach(t => frequencyMap[t] = (frequencyMap[t] || 0) + 1);

    const detectedHard = HARD_SKILLS.filter(skill => ngrams.has(skill) || jobText.toLowerCase().includes(skill));
    const detectedSoft = SOFT_SKILLS.filter(skill => ngrams.has(skill) || jobText.toLowerCase().includes(skill));
    const detectedVerbs = ACTION_VERBS.filter(verb => ngrams.has(verb));

    // Top high-frequency domain terms (excluding classified ones)
    const classified = new Set([...detectedHard, ...detectedSoft, ...detectedVerbs]);
    const topKeywords = Object.entries(frequencyMap)
      .filter(([word]) => !classified.has(word) && word.length > 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return {
      hardSkills: Array.from(new Set(detectedHard)),
      softSkills: Array.from(new Set(detectedSoft)),
      actionVerbs: Array.from(new Set(detectedVerbs)),
      criticalKeywords: Array.from(new Set([...detectedHard, ...topKeywords]))
    };
  }

  // Calculates a weighted ATS match score
  static calculateMatch(jobKeywords, resumeText) {
    const resumeNGrams = this.extractNGrams(resumeText);
    const resumeRaw = resumeText.toLowerCase();

    const matched = [];
    const missing = [];

    jobKeywords.criticalKeywords.forEach(keyword => {
      if (resumeNGrams.has(keyword) || resumeRaw.includes(keyword)) {
        matched.push(keyword);
      } else {
        missing.push(keyword);
      }
    });

    // Score Weighting:
    // 60% based on critical hard/domain keywords, 25% on soft skills, 15% on action verbs
    const totalCritical = jobKeywords.criticalKeywords.length || 1;
    const criticalScore = (matched.length / totalCritical) * 60;

    const matchedSoft = jobKeywords.softSkills.filter(s => resumeRaw.includes(s));
    const softScore = jobKeywords.softSkills.length 
      ? (matchedSoft.length / jobKeywords.softSkills.length) * 25 
      : 25;

    const matchedVerbs = jobKeywords.actionVerbs.filter(v => resumeRaw.includes(v));
    const verbScore = jobKeywords.actionVerbs.length 
      ? (matchedVerbs.length / jobKeywords.actionVerbs.length) * 15 
      : 15;

    const finalScore = Math.min(100, Math.round(criticalScore + softScore + verbScore));

    return {
      score: finalScore,
      matchedKeywords: matched,
      missingKeywords: missing
    };
  }

  // Auto-detect and parse raw CV text into structured sections
  static parseResumeSections(rawText) {
    const sections = {
      summary: "",
      skills: "",
      experience: "",
      education: ""
    };

    const lines = rawText.split('\n');
    let currentSection = 'summary';

    const headerPatterns = {
      summary: /^(professional\s+)?summary|about\s+me|profile/i,
      skills: /^(technical\s+)?skills|competencies|tools|technologies/i,
      experience: /^(work\s+)?experience|employment|work\s+history/i,
      education: /^education|academic|qualifications|certifications/i
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      let matchedHeader = false;

      for (const [key, regex] of Object.entries(headerPatterns)) {
        if (regex.test(trimmed) && trimmed.length < 35) {
          currentSection = key;
          matchedHeader = true;
          break;
        }
      }

      if (!matchedHeader && trimmed.length > 0) {
        sections[currentSection] += `${trimmed}\n`;
      }
    });

    return sections;
  }
}