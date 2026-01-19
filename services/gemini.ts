
import { GoogleGenAI, Type } from "@google/genai";
import { SMSMessage, AIAnalysisResult } from "../types";

export const analyzeThread = async (messages: SMSMessage[]): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare chat log for context
  const chatLog = messages
    .slice(-50) // Analyze last 50 messages to stay within limits and focus on recent context
    .map(m => `${m.type.toUpperCase()}: ${m.body}`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this SMS conversation log and provide a summary, sentiment, key dates mentioned, and overall tone.\n\nLOG:\n${chatLog}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: 'A short summary of the conversation' },
          sentiment: { type: Type.STRING, description: 'General sentiment (Positive, Negative, Neutral, Tense)' },
          keyDates: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'List of specific dates or appointments mentioned'
          },
          tone: { type: Type.STRING, description: 'The overall tone of the participants' }
        },
        required: ["summary", "sentiment", "keyDates", "tone"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Analysis failed");
  }
};
