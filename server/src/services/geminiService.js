import dotenv from 'dotenv';
dotenv.config();

/**
 * Gemini AI Review & Homework Service for TutorFlow
 * Secure, server-side service utilizing Google Gemini to synthesize
 * completed tutoring sessions into structured reviews and personalized homework.
 */

function getSupportedModels() {
  const customModel = process.env.GEMINI_MODEL;
  const list = [customModel, 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'].filter(Boolean);
  return [...new Set(list)];
}

/**
 * Generate a comprehensive structured session review and homework plan using Gemini.
 *
 * @param {Object} params
 * @param {string} params.topic - Session topic/goal
 * @param {string} params.notes - Tutor's final live whiteboard and pedagogical notes
 * @param {string} params.studentName - Student's name
 * @param {string} params.subject - Student's subject (e.g. AP Calculus BC)
 * @param {string} params.currentLevel - Student's current level (e.g. Grade 12 / Advanced)
 * @param {string[]} params.learningGoals - Student's enrolled learning goals
 * @param {string[]} params.weakAreas - Student's enrolled weak areas
 * @param {number} [params.durationMinutes] - Session duration in minutes
 * @returns {Promise<{ aiReview: Object, aiSummaryText: string, modelUsed: string }>}
 */
export async function generateSessionReview({
  topic,
  notes,
  studentName = 'Student',
  subject = 'Tutoring Subject',
  currentLevel = 'General',
  learningGoals = [],
  weakAreas = [],
  durationMinutes = 60
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    const error = new Error('Gemini API Key is not configured on the server. Please set GEMINI_API_KEY in server environment variables.');
    error.statusCode = 503;
    error.code = 'GEMINI_KEY_MISSING';
    throw error;
  }

  // Construct prompt providing full session and student pedagogical context
  const goalsText = Array.isArray(learningGoals) && learningGoals.length > 0
    ? learningGoals.map((g, i) => `  ${i + 1}. ${g}`).join('\n')
    : '  - General subject mastery';

  const weakAreasText = Array.isArray(weakAreas) && weakAreas.length > 0
    ? weakAreas.map((w, i) => `  ${i + 1}. ${w}`).join('\n')
    : '  - None specified';

  const notesText = notes && notes.trim()
    ? notes.trim()
    : 'Session completed successfully. Tutor covered foundational concepts and practice exercises.';

  const prompt = `You are an expert pedagogical AI teaching assistant for TutorFlow, an elite 1-on-1 online tutoring platform.
Analyze the following completed tutoring session and tutor notes, and produce a structured, high-value lesson review and customized homework assignment for the student.

--- STUDENT CONTEXT ---
Student Name: ${studentName}
Subject: ${subject}
Current Level: ${currentLevel}
Target Learning Goals:
${goalsText}
Identified Focus/Weak Areas:
${weakAreasText}

--- SESSION DATA ---
Topic / Goal: ${topic}
Duration: ${durationMinutes} minutes
Tutor's Session Notes:
${notesText}

--- INSTRUCTIONS ---
Respond ONLY with a valid JSON object strictly matching this schema. Do not include markdown formatting or commentary outside the JSON.

{
  "summary": "Concise 2-3 sentence executive synthesis of what was accomplished during this session and overall student engagement.",
  "keyTopicsCovered": [
    "Specific concept, method, or problem type covered #1",
    "Specific concept, method, or problem type covered #2"
  ],
  "studentStrengths": [
    "Specific skill, intuition, or concept the student demonstrated mastery of during the session",
    "Positive pedagogical observation or breakthrough"
  ],
  "areasForImprovement": [
    "Specific weak point, misconception, or calculation pattern needing targeted reinforcement",
    "Concept requiring further independent practice"
  ],
  "recommendedNextSteps": [
    "Immediate action item for student before next session",
    "Proposed focus topic for the upcoming tutoring session"
  ],
  "homework": {
    "title": "Clear, engaging title for the assignment",
    "description": "Short explanation of the purpose and expected time commitment (e.g. ~30-45 mins)",
    "tasks": [
      "Concrete actionable problem/drill #1 with specific guidance",
      "Concrete actionable problem/drill #2 with specific guidance",
      "Reflection or summary task #3"
    ]
  }
}`;

  let lastError = null;

  for (const model of getSupportedModels()) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // 25-second request timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        let parsedErrorMsg = `Gemini API returned status ${response.status}`;
        try {
          const errJson = JSON.parse(errorBody);
          if (errJson?.error?.message) {
            parsedErrorMsg = errJson.error.message;
          }
        } catch {
          // ignore json parse error
        }

        // If model not found or unavailable, try next candidate model
        if (response.status === 404 || response.status === 503) {
          lastError = new Error(`Model ${model} unavailable: ${parsedErrorMsg}`);
          continue;
        }

        const err = new Error(`Gemini AI service error: ${parsedErrorMsg}`);
        err.statusCode = response.status === 429 ? 429 : 502;
        throw err;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini returned an empty response.');
      }

      // Clean markdown fences if present
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanJson);

      // Validate and structure fields
      const structuredReview = {
        summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : `${topic} session review completed.`,
        keyTopicsCovered: Array.isArray(parsed.keyTopicsCovered) && parsed.keyTopicsCovered.length > 0
          ? parsed.keyTopicsCovered.map(String)
          : [topic],
        studentStrengths: Array.isArray(parsed.studentStrengths) && parsed.studentStrengths.length > 0
          ? parsed.studentStrengths.map(String)
          : ['Active participation and effort throughout the lesson.'],
        areasForImprovement: Array.isArray(parsed.areasForImprovement) && parsed.areasForImprovement.length > 0
          ? parsed.areasForImprovement.map(String)
          : ['Continue practicing core formulas and foundational problems.'],
        recommendedNextSteps: Array.isArray(parsed.recommendedNextSteps) && parsed.recommendedNextSteps.length > 0
          ? parsed.recommendedNextSteps.map(String)
          : ['Complete assigned homework before the next scheduled session.'],
        homework: {
          title: parsed.homework?.title || `${subject}: Practice & Mastery Drill`,
          description: parsed.homework?.description || `Independent practice problems based on ${topic}.`,
          tasks: Array.isArray(parsed.homework?.tasks) && parsed.homework.tasks.length > 0
            ? parsed.homework.tasks.map(String)
            : [`Review notes and practice 3-5 problems related to ${topic}.`]
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
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Gemini AI generation request timed out after 25 seconds. Please try again.');
        timeoutErr.statusCode = 504;
        throw timeoutErr;
      }
      lastError = err;
      // If error is an explicit status code error from Gemini (e.g. 429, 502), rethrow
      if (err.statusCode && err.statusCode !== 502) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to generate AI review from any available Gemini models.');
}
