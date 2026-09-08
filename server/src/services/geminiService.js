import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Gemini AI Review & Homework Service for TutorFlow
 * Secure, server-side service utilizing Google Gemini with fallback hierarchy,
 * strict timeout management, and robust JSON extraction.
 */

// Candidate models ordered from fastest/highest capability to fallback models
function getSupportedModels() {
  const customModel = process.env.GEMINI_MODEL;
  const list = [
    customModel,
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash'
  ].filter(Boolean);
  return [...new Set(list)];
}

/**
 * Sanitize error messages to guarantee no API keys or sensitive query params leak.
 */
function sanitizeErrorMessage(message) {
  if (!message || typeof message !== 'string') {
    return 'An unexpected error occurred during AI review generation.';
  }
  return message
    .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=REDACTED')
    .replace(/AIza[0-9A-Za-z-_]{35}/gi, '[REDACTED_KEY]')
    .replace(/AQ\.[0-9A-Za-z-_]{40,}/gi, '[REDACTED_KEY]');
}

/**
 * Safely extracts and parses JSON object from Gemini response text.
 * Handles markdown code fences, surrounding commentary, and minor JSON quirks.
 */
function extractAndParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from Gemini.');
  }

  let cleaned = rawText.trim();

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Find outermost curly braces { ... }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No valid JSON object structure found in response.');
  }

  const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonSubstring);
  } catch (parseError) {
    // Attempt repairs:
    let sanitized = jsonSubstring
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
      .replace(/,\s*([\]}])/g, '$1');

    try {
      return JSON.parse(sanitized);
    } catch {
      // Escape raw backslashes that are not followed by valid JSON escape chars: " \ / b f n r t u
      sanitized = sanitized.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      try {
        return JSON.parse(sanitized);
      } catch (thirdError) {
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
    }
  }
}

/**
 * Build concise pedagogical prompt for Gemini.
 */
function buildPrompt(params, isCompactRetry = false) {
  const {
    topic,
    notes,
    studentName = 'Student',
    subject = 'General Subject',
    currentLevel = 'General',
    learningGoals = [],
    weakAreas = [],
    durationMinutes = 60
  } = params;

  const notesText = notes && notes.trim()
    ? notes.trim().slice(0, 800) // limit input notes size to prevent runaway prompt
    : 'Session completed successfully. Covered core concepts and practice problems.';

  const goals = Array.isArray(learningGoals) && learningGoals.length > 0
    ? learningGoals.slice(0, 3).join(', ')
    : 'General mastery';

  const weak = Array.isArray(weakAreas) && weakAreas.length > 0
    ? weakAreas.slice(0, 3).join(', ')
    : 'None flagged';

  if (isCompactRetry) {
    return `You are a tutoring assistant for TutorFlow.
Create a compact JSON review for a ${durationMinutes}-minute ${subject} (${currentLevel}) session with ${studentName}.
Topic: ${topic}
Notes: ${notesText}

Respond ONLY with this compact JSON schema. Keep all strings short (1 sentence each):
{
  "summary": "Brief 1-2 sentence overview of what was covered.",
  "keyTopicsCovered": ["Topic 1", "Topic 2"],
  "studentStrengths": ["Strength 1", "Strength 2"],
  "areasForImprovement": ["Focus area 1", "Focus area 2"],
  "recommendedNextSteps": ["Next step 1", "Next step 2"],
  "homework": {
    "title": "Short Homework Title",
    "description": "Short 1-sentence instruction.",
    "tasks": ["Task 1", "Task 2", "Task 3"]
  }
}`;
  }

  return `You are an expert pedagogical assistant for TutorFlow, an online 1-on-1 tutoring platform.
Analyze this completed tutoring session and produce a structured, high-value lesson review and homework assignment.

STUDENT: ${studentName} | SUBJECT: ${subject} (${currentLevel})
GOALS: ${goals}
AREAS FOR PRACTICE: ${weak}
SESSION TOPIC: ${topic} (${durationMinutes} mins)
LIVE NOTES:
${notesText}

INSTRUCTIONS:
Respond ONLY with a valid, compact JSON object strictly matching this schema. Keep descriptions concise to ensure fast generation:
{
  "summary": "Concise 2-sentence synthesis of concepts covered and student performance.",
  "keyTopicsCovered": ["Key concept or problem type covered #1", "Key concept #2"],
  "studentStrengths": ["Demonstrated competency or breakthrough #1", "Positive pedagogical observation #2"],
  "areasForImprovement": ["Misconception or topic needing reinforcement #1", "Topic needing practice #2"],
  "recommendedNextSteps": ["Action item before next lesson #1", "Focus topic for upcoming lesson #2"],
  "homework": {
    "title": "Clear assignment title",
    "description": "Short explanation of purpose (~30-45 mins)",
    "tasks": ["Actionable problem/drill #1", "Actionable problem/drill #2", "Self-check task #3"]
  }
}`;
}

/**
 * Low-level call to Gemini REST API with strict AbortController timeout.
 */
async function callGeminiApi(model, apiKey, promptText, timeoutMs = 22000) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.2, // lower temperature for deterministic, rapid JSON output
          maxOutputTokens: 2500 // ample output token boundary to prevent runaway strings or truncated JSON
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let msg = `Gemini API returned status ${response.status}`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson?.error?.message) {
          msg = errJson.error.message;
        }
      } catch {
        // ignore json parse error
      }
      const err = new Error(sanitizeErrorMessage(msg));
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini API returned an empty response body.');
    }

    return rawText;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`Gemini AI generation timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
      timeoutErr.statusCode = 504;
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  }
}

/**
 * Generate a comprehensive structured session review and homework plan using Gemini.
 * Includes multi-model fallback, retry logic, timeout protection, and robust JSON validation.
 *
 * @param {Object} params
 * @returns {Promise<{ aiReview: Object, aiSummaryText: string, modelUsed: string }>}
 */
export async function generateSessionReview(params) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    const error = new Error('Gemini API Key is not configured on the server. Please set GEMINI_API_KEY in server environment variables.');
    error.statusCode = 503;
    error.code = 'GEMINI_KEY_MISSING';
    throw error;
  }

  const { topic = 'Tutoring Session', subject = 'Tutoring' } = params;
  const models = getSupportedModels();
  let lastError = null;

  for (const model of models) {
    try {
      // Primary Attempt on current model
      const prompt = buildPrompt(params, false);
      let rawText;
      try {
        rawText = await callGeminiApi(model, apiKey, prompt, 22000);
      } catch (callErr) {
        // If timed out or unavailable, try next model
        if (callErr.statusCode === 504 || callErr.status === 404 || callErr.status === 503) {
          lastError = callErr;
          continue;
        }
        throw callErr;
      }

      // Try parsing JSON from response
      let parsed;
      try {
        parsed = extractAndParseJson(rawText);
      } catch (parseErr) {
        console.warn(`[geminiService] JSON parse failed on model ${model}: ${parseErr.message}. Retrying with compact prompt...`);
        // Retry once on same model with compact prompt
        try {
          const compactPrompt = buildPrompt(params, true);
          const retryText = await callGeminiApi(model, apiKey, compactPrompt, 18000);
          parsed = extractAndParseJson(retryText);
        } catch (retryErr) {
          console.warn(`[geminiService] Retry on model ${model} failed: ${retryErr.message}. Falling back to next model...`);
          lastError = retryErr;
          continue;
        }
      }

      // Normalize and sanitize structured fields
      const structuredReview = {
        summary: typeof parsed.summary === 'string' && parsed.summary.trim()
          ? parsed.summary.trim()
          : `${topic} lesson review completed successfully.`,
        keyTopicsCovered: Array.isArray(parsed.keyTopicsCovered) && parsed.keyTopicsCovered.length > 0
          ? parsed.keyTopicsCovered.map(String).filter(Boolean)
          : [topic],
        studentStrengths: Array.isArray(parsed.studentStrengths) && parsed.studentStrengths.length > 0
          ? parsed.studentStrengths.map(String).filter(Boolean)
          : ['Demonstrated understanding of core concepts during guided exercises.'],
        areasForImprovement: Array.isArray(parsed.areasForImprovement) && parsed.areasForImprovement.length > 0
          ? parsed.areasForImprovement.map(String).filter(Boolean)
          : ['Continue practicing independent problem-solving and formula application.'],
        recommendedNextSteps: Array.isArray(parsed.recommendedNextSteps) && parsed.recommendedNextSteps.length > 0
          ? parsed.recommendedNextSteps.map(String).filter(Boolean)
          : ['Complete assigned homework drill prior to the upcoming lesson.'],
        homework: {
          title: parsed.homework?.title && typeof parsed.homework.title === 'string'
            ? parsed.homework.title.trim()
            : `${subject}: Mastery Practice Drill`,
          description: parsed.homework?.description && typeof parsed.homework.description === 'string'
            ? parsed.homework.description.trim()
            : `Independent practice drill based on ${topic} (~30 mins).`,
          tasks: Array.isArray(parsed.homework?.tasks) && parsed.homework.tasks.length > 0
            ? parsed.homework.tasks.map(String).filter(Boolean)
            : [
                `Review session notes and formulas for ${topic}.`,
                `Solve 3-5 practice problems focusing on identified weak areas.`,
                `Prepare any questions on challenging steps for the next lesson.`
              ]
        },
        generatedAt: new Date(),
        modelUsed: model
      };

      // Formulate human-readable fallback markdown summary string for aiSummary
      const aiSummaryText = `${structuredReview.summary}\n\n**Key Topics:**\n${structuredReview.keyTopicsCovered.map(t => `- ${t}`).join('\n')}\n\n**Strengths:**\n${structuredReview.studentStrengths.map(s => `- ${s}`).join('\n')}\n\n**Areas for Improvement:**\n${structuredReview.areasForImprovement.map(a => `- ${a}`).join('\n')}\n\n**Homework (${structuredReview.homework.title}):**\n${structuredReview.homework.tasks.map(t => `- [ ] ${t}`).join('\n')}`;

      return {
        aiReview: structuredReview,
        aiSummaryText,
        modelUsed: model
      };
    } catch (err) {
      lastError = err;
      // If error is an unrecoverable client quota error (429), rethrow immediately with clear message
      if (err.status === 429) {
        const rateLimitErr = new Error('Gemini AI API rate limit reached. Please wait a moment and click Retry.');
        rateLimitErr.statusCode = 429;
        rateLimitErr.code = 'RATE_LIMIT_EXCEEDED';
        throw rateLimitErr;
      }
    }
  }

  // All models and retries exhausted - return controlled, friendly error
  const finalError = new Error(
    lastError?.statusCode === 504
      ? 'Gemini AI service timed out while synthesizing the review. Please click Retry to generate the review.'
      : (lastError?.message || 'Gemini AI service was temporarily unable to generate the review. Please try again.')
  );
  finalError.statusCode = lastError?.statusCode || 502;
  finalError.code = 'AI_SERVICE_UNAVAILABLE';
  throw finalError;
}

/**
 * Build pre-session lesson plan prompt for Gemini.
 */
function buildPlanPrompt(params, isCompactRetry = false) {
  const {
    topic,
    studentName = 'Student',
    subject = 'Tutoring Subject',
    currentLevel = 'General',
    learningGoals = [],
    weakAreas = [],
    durationMinutes = 60,
    pastSessionsSummary = ''
  } = params;

  const goals = Array.isArray(learningGoals) && learningGoals.length > 0
    ? learningGoals.slice(0, 3).join(', ')
    : 'General conceptual mastery';

  const weak = Array.isArray(weakAreas) && weakAreas.length > 0
    ? weakAreas.slice(0, 3).join(', ')
    : 'None flagged';

  const historyContext = pastSessionsSummary && pastSessionsSummary.trim()
    ? `\nPREVIOUS SESSIONS CONTEXT & PAST AI FEEDBACK:\n${pastSessionsSummary.trim().slice(0, 700)}\n`
    : '';

  if (isCompactRetry) {
    return `You are an expert tutor for TutorFlow.
Create a compact pre-session plan for a ${durationMinutes}-min ${subject} (${currentLevel}) session with ${studentName}.
Topic: ${topic}
Weak Areas: ${weak}
Goals: ${goals}
${historyContext}
Respond ONLY with this JSON schema. EXACTLY 4 outline items and EXACTLY 3 questions:
{
  "learningObjectives": ["Objective 1", "Objective 2"],
  "lessonOutline": [
    "1. Warm-up & diagnostic review (10m)",
    "2. Guided core concept explanation (20m)",
    "3. Practice problem solving (20m)",
    "4. Wrap-up and synthesis (10m)"
  ],
  "practiceQuestions": [
    "Question 1: Foundational practice",
    "Question 2: Core concept exercise",
    "Question 3: Application challenge"
  ]
}`;
  }

  return `You are an expert pedagogical assistant for TutorFlow, an online 1-on-1 tutoring platform.
Design a highly tailored pre-session study plan and 3 targeted practice questions for an upcoming tutoring session.

STUDENT: ${studentName} | SUBJECT: ${subject} (${currentLevel})
STUDENT LEARNING GOALS: ${goals}
AREAS NEEDING REINFORCEMENT: ${weak}
UPCOMING SESSION TOPIC: ${topic} (${durationMinutes} minutes)
${historyContext}
INSTRUCTIONS:
Respond ONLY with a valid JSON object strictly matching this schema. Ensure EXACTLY 4 structured lesson outline steps and EXACTLY 3 practice questions:
{
  "learningObjectives": [
    "Clear, measurable learning objective #1",
    "Clear, measurable learning objective #2"
  ],
  "lessonOutline": [
    "1. Warm-Up & Diagnostic Review: Assess foundational understanding and prerequisite concepts",
    "2. Core Concept Walkthrough: Guided instruction on core theory, formulas, and representative examples",
    "3. Scaffolded Practice: Student solves targeted problems with tutor guidance and misconception correction",
    "4. Synthesis & Wrap-Up: Exit check problem and recap of key takeaways"
  ],
  "practiceQuestions": [
    "Practice Question 1 (Foundational concept check)",
    "Practice Question 2 (Standard application problem)",
    "Practice Question 3 (Challenging synthesis or multi-step problem addressing weak areas)"
  ]
}`;
}

/**
 * Generate structured pre-session lesson plan using Gemini AI.
 * Guaranteed to produce learningObjectives, exactly 4 lessonOutline items, and exactly 3 practiceQuestions.
 *
 * @param {Object} params
 * @returns {Promise<{ aiPlan: Object, modelUsed: string }>}
 */
export async function generateSessionPlan(params) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    const error = new Error('Gemini API Key is not configured on the server. Please set GEMINI_API_KEY in server environment variables.');
    error.statusCode = 503;
    error.code = 'GEMINI_KEY_MISSING';
    throw error;
  }

  const { topic = 'Tutoring Session', subject = 'Tutoring' } = params;
  const models = getSupportedModels();
  let lastError = null;

  for (const model of models) {
    try {
      const prompt = buildPlanPrompt(params, false);
      let rawText;
      try {
        rawText = await callGeminiApi(model, apiKey, prompt, 22000);
      } catch (callErr) {
        if (callErr.statusCode === 504 || callErr.status === 404 || callErr.status === 503) {
          lastError = callErr;
          continue;
        }
        throw callErr;
      }

      let parsed;
      try {
        parsed = extractAndParseJson(rawText);
      } catch (parseErr) {
        console.warn(`[geminiService] Plan JSON parse failed on model ${model}: ${parseErr.message}. Retrying with compact prompt...`);
        try {
          const compactPrompt = buildPlanPrompt(params, true);
          const retryText = await callGeminiApi(model, apiKey, compactPrompt, 18000);
          parsed = extractAndParseJson(retryText);
        } catch (retryErr) {
          console.warn(`[geminiService] Plan retry on model ${model} failed: ${retryErr.message}. Falling back to next model...`);
          lastError = retryErr;
          continue;
        }
      }

      // 1. Objectives
      const objectives = Array.isArray(parsed.learningObjectives) && parsed.learningObjectives.length > 0
        ? parsed.learningObjectives.map(String).filter(Boolean)
        : [
            `Master core conceptual foundations and problem-solving strategies for ${topic}.`,
            `Apply key formulas and methods to representative ${subject} exercises with accuracy.`
          ];

      // 2. Exact 4-step Lesson Outline
      let rawOutline = Array.isArray(parsed.lessonOutline)
        ? parsed.lessonOutline.map(String).filter(Boolean)
        : [];

      const defaultOutlineSteps = [
        `1. Warm-Up & Diagnostic Review: Verify prerequisite mastery and review relevant formulas for ${topic}.`,
        `2. Core Concept Walkthrough: Guided instruction and interactive examples on ${topic}.`,
        `3. Scaffolded Practice: Work through multi-step exercises with immediate tutor feedback.`,
        `4. Synthesis & Wrap-Up: Exit check problem and preview of key homework takeaways.`
      ];

      let lessonOutline = [];
      if (rawOutline.length >= 4) {
        lessonOutline = rawOutline.slice(0, 4);
      } else {
        lessonOutline = [...rawOutline];
        for (let i = lessonOutline.length; i < 4; i++) {
          lessonOutline.push(defaultOutlineSteps[i]);
        }
      }

      // 3. Exact 3 Practice Questions
      let rawQuestions = Array.isArray(parsed.practiceQuestions)
        ? parsed.practiceQuestions.map(String).filter(Boolean)
        : [];

      const defaultQuestions = [
        `Practice Problem 1 (Foundational): Explain and apply the core definitions of ${topic} to a basic exercise.`,
        `Practice Problem 2 (Standard): Solve a standard multi-step problem testing primary principles of ${topic}.`,
        `Practice Problem 3 (Synthesis): Solve an advanced application problem on ${topic}, demonstrating full work and reasoning.`
      ];

      let practiceQuestions = [];
      if (rawQuestions.length >= 3) {
        practiceQuestions = rawQuestions.slice(0, 3);
      } else {
        practiceQuestions = [...rawQuestions];
        for (let i = practiceQuestions.length; i < 3; i++) {
          practiceQuestions.push(defaultQuestions[i]);
        }
      }

      const structuredPlan = {
        learningObjectives: objectives,
        lessonOutline: lessonOutline,
        practiceQuestions: practiceQuestions,
        generatedAt: new Date(),
        modelUsed: model
      };

      return {
        aiPlan: structuredPlan,
        modelUsed: model
      };
    } catch (err) {
      lastError = err;
      if (err.status === 429) {
        const rateLimitErr = new Error('Gemini AI API rate limit reached. Please wait a moment and click Retry.');
        rateLimitErr.statusCode = 429;
        rateLimitErr.code = 'RATE_LIMIT_EXCEEDED';
        throw rateLimitErr;
      }
    }
  }

  const finalError = new Error(
    lastError?.statusCode === 504
      ? 'Gemini AI service timed out while synthesizing the lesson plan. Please click Retry to generate the plan.'
      : (lastError?.message || 'Gemini AI service was temporarily unable to generate the lesson plan. Please try again.')
  );
  finalError.statusCode = lastError?.statusCode || 502;
  finalError.code = 'AI_SERVICE_UNAVAILABLE';
  throw finalError;
}

/**
 * Build student cumulative progress summary prompt for Gemini.
 */
function buildProgressPrompt(params, isCompactRetry = false) {
  const {
    studentName = 'Student',
    subject = 'Tutoring Subject',
    currentLevel = 'General',
    learningGoals = [],
    weakAreas = [],
    pastReviewsText = ''
  } = params;

  const goals = Array.isArray(learningGoals) && learningGoals.length > 0
    ? learningGoals.slice(0, 4).join(', ')
    : 'General conceptual mastery';

  const weak = Array.isArray(weakAreas) && weakAreas.length > 0
    ? weakAreas.slice(0, 4).join(', ')
    : 'None flagged';

  if (isCompactRetry) {
    return `You are a tutoring assistant for TutorFlow.
Create a compact student progress summary for ${studentName} (${subject}, ${currentLevel}).
Goals: ${goals}
Weak Areas: ${weak}

PAST SESSIONS & AI REVIEWS:
${pastReviewsText.slice(0, 1000)}

Respond ONLY with this compact JSON schema (1-2 sentences per field, 2-3 bullet items per array):
{
  "summary": "Brief 1-2 sentence overview of the student's progress and trajectory.",
  "improvingAreas": ["Concept or skill showing noticeable improvement #1", "Concept #2"],
  "strugglingAreas": ["Persistent bottleneck or difficulty needing reinforcement #1", "Concept #2"],
  "recommendedFocus": ["High-priority topic for upcoming sessions #1", "Topic #2"]
}`;
  }

  return `You are an expert pedagogical analyst for TutorFlow, an online 1-on-1 tutoring platform.
Analyze this student's past session reviews, tutor notes, and learning trajectory to produce a clear, actionable progress summary.

STUDENT: ${studentName}
SUBJECT & LEVEL: ${subject} (${currentLevel})
INITIAL LEARNING GOALS: ${goals}
TARGETED WEAK AREAS: ${weak}

CHRONOLOGICAL PAST SESSION AI REVIEWS & LESSON DATA:
${pastReviewsText.slice(0, 1800)}

INSTRUCTIONS:
Respond ONLY with a valid, compact JSON object strictly matching this schema. Be specific, encouraging, and pedagogically concrete:
{
  "summary": "Concise 2-3 sentence executive synthesis explaining what the student is improving at, general pace, and current mastery trajectory.",
  "improvingAreas": [
    "Specific concept or skill where the student has shown clear progress or breakthrough #1",
    "Specific concept #2"
  ],
  "strugglingAreas": [
    "Specific concept, problem type, or persistent struggle where the student still requires focused practice #1",
    "Specific concept #2"
  ],
  "recommendedFocus": [
    "Actionable, high-impact recommendation for upcoming tutoring sessions #1",
    "Actionable recommendation #2"
  ]
}`;
}

/**
 * Generate a cumulative student progress summary using Gemini AI based on past AI reviews and sessions.
 *
 * @param {Object} params
 * @returns {Promise<{ progressSummary: Object, modelUsed: string }>}
 */
export async function generateStudentProgressSummary(params) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    const error = new Error('Gemini API Key is not configured on the server. Please set GEMINI_API_KEY in server environment variables.');
    error.statusCode = 503;
    error.code = 'GEMINI_KEY_MISSING';
    throw error;
  }

  const { studentName = 'Student', subject = 'Tutoring', pastSessions = [] } = params;

  // Format past session AI reviews into structured text block
  let pastReviewsText = params.pastReviewsText || '';
  if (!pastReviewsText && Array.isArray(pastSessions) && pastSessions.length > 0) {
    pastReviewsText = pastSessions
      .map((s, idx) => {
        const dateStr = s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString() : `Session ${idx + 1}`;
        const topic = s.topic || 'General Topic';
        const review = s.aiReview;
        if (review) {
          const strengths = Array.isArray(review.studentStrengths) ? review.studentStrengths.join('; ') : 'None noted';
          const improvements = Array.isArray(review.areasForImprovement) ? review.areasForImprovement.join('; ') : 'None noted';
          const summary = review.summary || s.notes || 'Completed session.';
          return `[${dateStr}] Topic: ${topic}\nSummary: ${summary}\nStrengths: ${strengths}\nAreas for Improvement: ${improvements}`;
        }
        return `[${dateStr}] Topic: ${topic}\nNotes: ${s.notes || 'No notes'}`;
      })
      .join('\n\n');
  }

  const promptParams = {
    ...params,
    pastReviewsText
  };

  const models = getSupportedModels();
  let lastError = null;

  for (const model of models) {
    try {
      const prompt = buildProgressPrompt(promptParams, false);
      let rawText;
      try {
        rawText = await callGeminiApi(model, apiKey, prompt, 22000);
      } catch (callErr) {
        if (callErr.statusCode === 504 || callErr.status === 404 || callErr.status === 503) {
          lastError = callErr;
          continue;
        }
        throw callErr;
      }

      let parsed;
      try {
        parsed = extractAndParseJson(rawText);
      } catch (parseErr) {
        console.warn(`[geminiService] Progress summary JSON parse failed on model ${model}: ${parseErr.message}. Retrying with compact prompt...`);
        try {
          const compactPrompt = buildProgressPrompt(promptParams, true);
          const retryText = await callGeminiApi(model, apiKey, compactPrompt, 18000);
          parsed = extractAndParseJson(retryText);
        } catch (retryErr) {
          console.warn(`[geminiService] Progress summary retry on model ${model} failed: ${retryErr.message}. Falling back to next model...`);
          lastError = retryErr;
          continue;
        }
      }

      const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : `${studentName} has demonstrated consistent progress in ${subject}, advancing through foundational principles and tackling targeted practice exercises.`;

      const improvingAreas = Array.isArray(parsed.improvingAreas) && parsed.improvingAreas.length > 0
        ? parsed.improvingAreas.map(String).filter(Boolean)
        : [`Demonstrating stronger conceptual clarity and formula application in ${subject}.`];

      const strugglingAreas = Array.isArray(parsed.strugglingAreas) && parsed.strugglingAreas.length > 0
        ? parsed.strugglingAreas.map(String).filter(Boolean)
        : [`Requires continued guided practice with complex multi-step problems.`];

      const recommendedFocus = Array.isArray(parsed.recommendedFocus) && parsed.recommendedFocus.length > 0
        ? parsed.recommendedFocus.map(String).filter(Boolean)
        : [`Reinforce problem-solving speed and accuracy through spaced practice drills.`];

      const structuredSummary = {
        summary,
        improvingAreas,
        strugglingAreas,
        recommendedFocus
      };

      return {
        progressSummary: structuredSummary,
        modelUsed: model
      };
    } catch (err) {
      lastError = err;
      if (err.status === 429) {
        const rateLimitErr = new Error('Gemini AI API rate limit reached. Please wait a moment and click Retry.');
        rateLimitErr.statusCode = 429;
        rateLimitErr.code = 'RATE_LIMIT_EXCEEDED';
        throw rateLimitErr;
      }
    }
  }

  const finalError = new Error(
    lastError?.statusCode === 504
      ? 'Gemini AI service timed out while synthesizing the progress summary. Please click Retry to generate the summary.'
      : (lastError?.message || 'Gemini AI service was temporarily unable to generate the progress summary. Please try again.')
  );
  finalError.statusCode = lastError?.statusCode || 502;
  finalError.code = 'AI_SERVICE_UNAVAILABLE';
  throw finalError;
}
