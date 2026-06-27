/**
 * Moderation Module - AI Safety First Checkpoint
 * Purpose: Validate user prompts before sending to API keys
 * Workflow: User Prompt → Moderation → Approved/Blocked
 */

import { getOpenAIModerationConfig } from './openaiConfig.js';

class Moderation {
  constructor(options = {}) {
    this.openai = getOpenAIModerationConfig(options.openai || {});

    // Unsafe Content Categories
    this.unsafeKeywords = {
      nsfw: [
        'porn', 'xxx', 'sexual content', 'explicit', 'nude', 'adult content',
        'prostitution', 'escort', 'sexual act', 'erotic', 'xxx video'
      ],
      violence: [
        'kill', 'murder', 'torture', 'bomb', 'weapon', 'gun violence',
        'stab', 'cut throat', 'behead', 'brutality', 'gore', 'bloodshed',
        'how to hurt', 'how to kill', 'instructions for violence'
      ],
      hateSpeech: [
        'racial slur', 'ethnic slur', 'racist', 'sexist', 'homophobic',
        'transphobic', 'discriminate', 'inferior race', 'sub-human',
        'hate group', 'white supremacy', 'genocide'
      ],
      harassment: [
        'doxx', 'doxing', 'swat', 'cyberbully', 'threaten', 'intimidate',
        'stalk', 'send hate mail', 'harass', 'abuse', 'target someone'
      ],
      illegalActivities: [
        'illegal drug', 'cocaine', 'heroin', 'methamphetamine', 'make bomb',
        'create weapon', 'money laundering', 'fraud', 'hacking tutorial',
        'ransomware', 'steal identity', 'how to hack'
      ],
      selfHarm: [
        'self harm', 'self-harm', 'suicide', 'cut myself', 'overdose',
        'harm myself', 'kill myself', 'hurt myself', 'eating disorder',
        'suicidal ideation', 'ways to end life'
      ]
    };

    // Deepfake Request Patterns
    this.deepfakeKeywords = [
      'generate', 'create', 'make', 'produce',
      'deepfake', 'deep fake', 'fake video', 'fake speech',
      'voice clone', 'voice copy', 'facial swap', 'face swap',
      'video synthesis', 'synthetic video', 'impersonate',
      'mimic voice', 'fake audio'
    ];

    this.deepfakeTargets = [
      'elon musk', 'taylor swift', 'celebrity', 'politician',
      'president', 'ceo', 'influencer', 'public figure',
      'actor', 'actress', 'musician', 'famous person'
    ];

    // Copyright Abuse Patterns
    this.copyrightKeywords = [
      'copy', 'replicate', 'exact', 'identical', 'steal',
      'generate', 'create', 'produce', 'generate exact'
    ];

    this.copyrightTargets = [
      'disney', 'pixar', 'marvel', 'dreamworks', 'sony', 'warner bros',
      'universal', 'paramount', 'studio ghibli', 'movie scene',
      'animation style', 'music track', 'copyrighted content',
      'trademarked', 'licensed content', 'proprietary'
    ];

    this.customKeywords = options.customKeywords || [];
    this.severityLevels = {
      low: 1,
      medium: 2,
      high: 3
    };
  }

  /**
   * Main moderation function - API Safety Checkpoint
   * @param {string} prompt - User prompt to moderate
   * @returns {object} - {status: 'APPROVED'|'BLOCKED', reason: string, details: object}
   */
  moderate(prompt) {
    return this.moderateLocal(prompt);
  }

  /**
   * Main moderation function using OpenAI moderation API when configured.
   * Falls back to local moderation if the API is unavailable.
   * @param {string} prompt - User prompt to moderate
   * @returns {Promise<object>} - Moderation result
   */
  async moderateAsync(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      return {
        status: 'APPROVED',
        reason: 'Empty or invalid prompt',
        details: { warning: 'No content to moderate' }
      };
    }

    const localCheck = this.moderateLocal(prompt);

    if (!this.openai.isConfigured) {
      return {
        status: 'BLOCKED',
        reason: 'OpenAI moderation is not configured',
        details: {
          ...localCheck.details,
          moderationFallback: 'openai_moderation_unavailable',
          moderationError: 'OPENAI_MODERATION_API_KEY is missing'
        }
      };
    }

    try {
      const openAiCheck = await this.checkOpenAIModeration(prompt);

      if (openAiCheck.status === 'BLOCKED') {
        return openAiCheck;
      }

      return {
        ...localCheck,
        details: {
          ...localCheck.details,
          provider: 'openai',
          model: this.openai.model,
          moderationFallback: 'openai_moderation_passed'
        }
      };
    } catch (error) {
      return {
        status: 'BLOCKED',
        reason: 'OpenAI moderation service unavailable',
        details: {
          ...localCheck.details,
          moderationFallback: 'openai_moderation_unavailable',
          moderationError: error.message
        }
      };
    }
  }

  /**
   * Local moderation fallback and post-check.
   * @private
   */
  moderateLocal(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      return {
        status: 'APPROVED',
        reason: 'Empty or invalid prompt',
        details: { warning: 'No content to moderate' }
      };
    }

    // Run all safety checks
    const unsafeCheck = this.checkUnsafeContent(prompt);
    const deepfakeCheck = this.checkDeepfakeRequest(prompt);
    const copyrightCheck = this.checkCopyrightAbuse(prompt);

    // Determine final decision
    const isBlocked = unsafeCheck.isBlocked || deepfakeCheck.isBlocked || copyrightCheck.isBlocked;

    if (isBlocked) {
      return {
        status: 'BLOCKED',
        reason: this.determineBlockReason(unsafeCheck, deepfakeCheck, copyrightCheck),
        details: {
          unsafeContent: unsafeCheck.details,
          deepfakeRequest: deepfakeCheck.details,
          copyrightAbuse: copyrightCheck.details
        }
      };
    }

    return {
      status: 'APPROVED',
      reason: 'Prompt passed all safety checks',
      details: {
        checksPerformed: ['unsafe content', 'deepfake detection', 'copyright abuse'],
        allChecksPassed: true
      }
    };
  }

  /**
   * Call the OpenAI moderation endpoint.
   * @private
   */
  async checkOpenAIModeration(prompt) {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openai.apiKey}`
      },
      body: JSON.stringify({
        model: this.openai.model,
        input: prompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI moderation request failed (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    const result = payload?.results?.[0] || {};
    const detectedCategories = Object.entries(result.categories || {})
      .filter(([, isDetected]) => Boolean(isDetected))
      .map(([category]) => category);
    const normalizedCategories = [...new Set(detectedCategories.map((category) => {
      if (category.startsWith('sexual')) return 'nsfw';
      if (category.startsWith('violence')) return 'violence';
      if (category.startsWith('hate')) return 'hateSpeech';
      if (category.startsWith('harassment')) return 'harassment';
      if (category.startsWith('self-harm')) return 'selfHarm';
      if (category.startsWith('illicit')) return 'illegalActivities';
      return category;
    }))];

    if (!result.flagged && detectedCategories.length === 0) {
      return {
        status: 'APPROVED',
        reason: 'Prompt passed OpenAI moderation',
        details: {
          provider: 'openai',
          model: this.openai.model,
          flagged: false,
          categories: []
        }
      };
    }

    return {
      status: 'BLOCKED',
      reason: `Reason: ${normalizedCategories[0]?.toUpperCase() || 'OPENAI MODERATION'}`,
      details: {
        provider: 'openai',
        model: this.openai.model,
        flagged: Boolean(result.flagged),
        unsafeContent: {
          detected: true,
          categories: normalizedCategories,
          openaiCategories: detectedCategories,
          categoryScores: result.category_scores || {},
          reason: normalizedCategories[0]?.toUpperCase() || 'OPENAI MODERATION'
        },
        deepfakeRequest: this.checkDeepfakeRequest(prompt).details,
        copyrightAbuse: this.checkCopyrightAbuse(prompt).details
      }
    };
  }

  /**
   * Check for unsafe content (NSFW, violence, hate speech, etc.)
   * @private
   */
  checkUnsafeContent(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const detectedCategories = [];
    const detectedTerms = [];

    // Check each unsafe category
    for (const [category, keywords] of Object.entries(this.unsafeKeywords)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(lowerPrompt)) {
          detectedCategories.push(category);
          detectedTerms.push(keyword);
          break; // Only add category once
        }
      }
    }

    const isBlocked = detectedCategories.length > 0;

    return {
      isBlocked,
      details: {
        detected: isBlocked,
        categories: [...new Set(detectedCategories)],
        blockedTerms: [...new Set(detectedTerms)],
        reason: isBlocked ? `${detectedCategories[0]?.toUpperCase()}` : null
      }
    };
  }

  /**
   * Check for deepfake requests
   * Example: "Generate Elon Musk saying...", "Create celebrity deepfake"
   * @private
   */
  checkDeepfakeRequest(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    let hasDeepfakeAction = false;
    let hasTargetPerson = false;

    // Check for deepfake action verbs
    for (const keyword of this.deepfakeKeywords) {
      if (lowerPrompt.includes(keyword)) {
        hasDeepfakeAction = true;
        break;
      }
    }

    // Check for target person/celebrity
    const detectedTargets = [];
    for (const target of this.deepfakeTargets) {
      if (lowerPrompt.includes(target)) {
        detectedTargets.push(target);
        hasTargetPerson = true;
      }
    }

    // Deepfake detected if both action and target are present
    const isBlocked = hasDeepfakeAction && hasTargetPerson;

    return {
      isBlocked,
      details: {
        detected: isBlocked,
        hasDeepfakeAction,
        hasTargetPerson,
        targetPersons: detectedTargets,
        reason: isBlocked ? 'DEEPFAKE REQUEST DETECTED' : null
      }
    };
  }

  /**
   * Check for copyright abuse
   * Example: "Create exact Disney animation", "Generate Marvel movie scene"
   * @private
   */
  checkCopyrightAbuse(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    let hasCopyAction = false;
    let hasCopyrightTarget = false;
    const detectedTargets = [];

    // Check for copy-related action verbs combined with "exact" or "exactly"
    const exactPattern = /(?:exact|identical|copy|replicate|steal).*(?:generate|create|produce|make)/gi;
    hasCopyAction = exactPattern.test(prompt);

    if (!hasCopyAction) {
      // Alternative: check for copy verbs with copyright targets
      for (const keyword of this.copyrightKeywords) {
        if (lowerPrompt.includes(keyword)) {
          hasCopyAction = true;
          break;
        }
      }
    }

    // Check for copyrighted studios/brands
    for (const target of this.copyrightTargets) {
      if (lowerPrompt.includes(target)) {
        detectedTargets.push(target);
        hasCopyrightTarget = true;
      }
    }

    // Copyright abuse detected if both copy action and target are present
    const isBlocked = hasCopyAction && hasCopyrightTarget;

    return {
      isBlocked,
      details: {
        detected: isBlocked,
        hasCopyAction,
        hasCopyrightTarget,
        targets: detectedTargets,
        reason: isBlocked ? 'COPYRIGHT ABUSE' : null
      }
    };
  }

  /**
   * Determine the primary block reason
   * @private
   */
  determineBlockReason(unsafeCheck, deepfakeCheck, copyrightCheck) {
    if (unsafeCheck.isBlocked) {
      return `Reason: ${unsafeCheck.details.categories[0]?.toUpperCase() || 'UNSAFE CONTENT'}`;
    }
    if (deepfakeCheck.isBlocked) {
      return `Reason: ${deepfakeCheck.details.reason}`;
    }
    if (copyrightCheck.isBlocked) {
      return `Reason: ${copyrightCheck.details.reason}`;
    }
    return 'Reason: Content policy violation';
  }

  /**
   * Add custom keyword for unsafe content detection
   * @param {string} keyword - Keyword to add
   * @param {string} category - Category (nsfw, violence, hateSpeech, etc.)
   */
  addCustomKeyword(keyword, category = 'custom') {
    if (!this.unsafeKeywords[category]) {
      this.unsafeKeywords[category] = [];
    }
    if (!this.unsafeKeywords[category].includes(keyword)) {
      this.unsafeKeywords[category].push(keyword);
    }
  }

  /**
   * Get moderation statistics
   * @returns {object} - Statistics about keywords and categories
   */
  getModerationStats() {
    return {
      unsafeContentCategories: Object.keys(this.unsafeKeywords),
      totalUnsafeKeywords: Object.values(this.unsafeKeywords).reduce((sum, arr) => sum + arr.length, 0),
      deepfakeActionsTracked: this.deepfakeKeywords.length,
      deepfakeTargetsTracked: this.deepfakeTargets.length,
      copyrightActionsTracked: this.copyrightKeywords.length,
      copyrightTargetsTracked: this.copyrightTargets.length
    };
  }
}

export default Moderation;