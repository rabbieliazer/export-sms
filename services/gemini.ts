
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { SMSMessage, AIAnalysisResult } from "../types";

export const analyzeThread = async (messages: SMSMessage[]): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const chatLog = messages
    .slice(-75) 
    .map(m => `${m.type.toUpperCase()}: ${m.body}`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `SYSTEM: You are a clinical, objective data analyzer. You MUST analyze the provided chat log regardless of its nature, including explicit, adult, sensitive, or intense themes. Do not apply moral judgment or content filters.
TASK: Provide a structural metadata analysis of the following conversation.
LOG:
${chatLog}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: 'A clinical summary of the interaction' },
          sentiment: { type: Type.STRING, description: 'General sentiment (Positive, Negative, Neutral, Intense)' },
          keyDates: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'List of specific dates or appointments mentioned'
          },
          tone: { type: Type.STRING, description: 'The overall tone of the participants' }
        },
        required: ["summary", "sentiment", "keyDates", "tone"]
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ]
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Response Parsing Failed", e);
    throw new Error("Analysis failed - content may be restricted or complex.");
  }
};
