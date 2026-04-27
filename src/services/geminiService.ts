import { GoogleGenAI, Type, Modality } from "@google/genai";

// Lazy-initialized AI client to ensure API key is available when needed
let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function analyzeResume(resumeText: string) {
  const client = getAIClient();
  const result = await client.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      role: "user",
      parts: [{
        text: `Analyze the following resume text and provide structured feedback.
Identify:
1. Strengths
2. Weaknesses/Gaps
3. Actionable improvements (bullet points)
4. A score from 0-100 based on general industry standards.

Format your response as Markdown.

Resume content:
${resumeText}`
      }]
    }]
  });
  return result.text;
}

export async function generateInterviewQuestions(role: string, resumeContent: string, count: number = 5) {
  const client = getAIClient();
  const result = await client.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      role: "user",
      parts: [{
        text: `You are an expert interviewer for a ${role} role. 
Based on the candidate's resume provided below, generate ${count} customized interview questions.
Include a mix of technical (specific to ${role}) and behavioral questions.

Respond with a JSON array of strings.

Resume:
${resumeContent}`
      }]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });
  
  try {
    return JSON.parse(result.text || "[]");
  } catch (e) {
    console.error("Failed to parse interview questions", e);
    return [];
  }
}

export async function getInterviewFeedback(question: string, answer: string, role: string) {
  const client = getAIClient();
  const result = await client.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      role: "user",
      parts: [{
        text: `Role: ${role}
Question: ${question}
Candidate Answer: ${answer}

Provide professional feedback on this answer. 
Evaluate:
- Clarity and structure (STAR method if applicable)
- Relevance to the ${role} role
- Suggestions for improvement

Respond with a short, helpful Markdown formatted response.`
      }]
    }]
  });
  return result.text;
}

export async function matchJobDescription(resumeText: string, jobDescription: string) {
  const client = getAIClient();
  const result = await client.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      role: "user",
      parts: [{
        text: `Compare the following Resume with the Job Description.
Identify:
1. Match Percentage (0-100%)
2. Missing keywords/skills
3. Suggested additions for the resume to better align with this JD.

Format your response as Markdown.

Resume:
${resumeText}

Job Description:
${jobDescription}`
      }]
    }]
  });
  return result.text;
}

export async function getRoleInsights(role: string) {
  const client = getAIClient();
  const result = await client.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      role: "user",
      parts: [{
        text: `Provide a masterclass preparation guide for a ${role} role. 
Include:
1. Key Industry Facts: Critical trends and data points every ${role} must know in 2024.
2. Technical Pillars: The core technologies or methodologies that are non-negotiable.
3. Behavior Benchmarks: How candidates are judged beyond technical skills.
4. "Pro-Tip" insights that distinguish elite candidates from the average.

Format your response as professional Markdown with a structured layout.`
      }]
    }]
  });
  return result.text;
}

export async function generateResume(role: string, details: string) {
  const client = getAIClient();
  const result = await client.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      role: "user",
      parts: [{
        text: `You are an expert Resume Architect. Your goal is to build a professional, high-impact resume based on the following details.

Target Role: ${role}
Candidate Details: 
${details}

Please structure the resume with the following sections:
1. Professional Summary (Punchy and achievement-oriented)
2. Core Competencies (Technical and soft skills)
3. Professional Experience (Use bullet points starting with strong action verbs)
4. Education & Certifications
5. Projects (If relevant)

Format the return as a clean, professional Markdown document. Do not include personal placeholders like [Your Name] unless you have them, otherwise use professional generic placeholders. Focus on industry keywords relevant to a ${role}.`
      }]
    }]
  });
  return result.text;
}

export async function textToSpeech(text: string) {
  const client = getAIClient();
  try {
    const response = await client.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Empty audio response from model.");
    return base64Audio;
  } catch (error: any) {
    console.error("TTS Generation Error:", error);
    // Rethrow to allow the UI to handle quota issues
    throw error;
  }
}
