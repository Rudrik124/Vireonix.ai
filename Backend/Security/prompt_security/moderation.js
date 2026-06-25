/**
 * Moderation Module - AI Safety First Checkpoint
 * Purpose: Validate user prompts before sending to API keys
 * Workflow: User Prompt → Moderation → Approved/Blocked
 */

class Moderation {
  constructor(options = {}) {
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

module.exports = Moderation;