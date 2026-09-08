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
    // Attempt minor repair: remove trailing commas before closing braces/brackets
    const sanitized = jsonSubstring
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' '); // remove control characters

    try {
      return JSON.parse(sanitized);
    } catch (secondError) {
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
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
          maxOutputTokens: 1200 // compact output token boundary to prevent runaway strings
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
