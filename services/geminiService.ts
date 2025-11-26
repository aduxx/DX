import { GoogleGenAI, Type } from "@google/genai";
import { DocData, DocType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDocContent = async (
  topic: string,
  type: DocType,
  sender: string,
  recipient: string
): Promise<Partial<DocData>> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `
    You are an expert secretary in the Chinese government, highly skilled in drafting official documents (公文) according to GB/T 9704-2012 standards.
    Your writing style must be:
    1. Authoritative, concise, and formal (庄重、严谨).
    2. Strictly following the structure of Chinese official documents.
    3. Using standard terminology (e.g., "兹定于", "特此通知", "望遵照执行").

    Generate a JSON response containing the title and the body content.
    The body content should utilize proper paragraph breaks with '\\n'.
    Do not include the salutation or signature in the 'content' field as those are handled by the layout engine, but DO write the main body text clearly.
  `;

  const prompt = `
    Draft a ${type} (文种) from ${sender} (发文机关) to ${recipient} (主送机关).
    Topic/Context: ${topic}.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The official title of the document" },
            content: { type: Type.STRING, description: "The main body text of the document, properly formatted with line breaks" },
            docNumber: { type: Type.STRING, description: "A plausible document number e.g. X发〔202X〕X号" }
          },
          required: ["title", "content"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
};

export const polishContent = async (text: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Rewrite the following text to match the strict, formal tone of Chinese official government documents (公文风格). Keep the meaning but improve the vocabulary and sentence structure to be more professional:\n\n${text}`,
      config: {
        responseMimeType: "text/plain",
      }
    });
    return response.text || text;
  } catch (error) {
    console.error("Gemini polishing error:", error);
    return text;
  }
};