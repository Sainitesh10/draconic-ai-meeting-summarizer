import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Helper to convert a File to the inlineData format expected by Gemini 
 * for audio files (mp3, wav, m4a, etc.)
 */
async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type || 'audio/mp3'
    },
  };
}

export const analyzeMeeting = async (apiKey, userName, textTranscript, audioFile = null) => {
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please configure it in settings.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an elite AI Meeting Summarizer.
    Your task is to analyze the provided meeting transcript or audio recording and extract key intelligence.
    The current user logged into the system is named "${userName}".
    
    Please output your analysis as a raw JSON object with NO markdown formatting, strictly adhering to this structure:
    {
      "summary": "A concise, professional 3-4 sentence summary of the entire meeting.",
      "my_tasks": [
        "Task 1 specifically assigned to ${userName}",
        "Task 2 specifically assigned to ${userName}"
      ],
      "decisions": [
        "Key decision 1 made during the meeting",
        "Key decision 2 made during the meeting"
      ],
      "follow_up_email": "A professional follow-up email draft summarizing the meeting and listing next steps, ready to be sent to all participants."
    }
    
    If providing an audio file, listen carefully to extract the tasks. If a text transcript is provided, read it carefully. 
    If a field has no data, return an empty array or empty string. Do NOT wrap the JSON in \`\`\`json blocks.
  `;

  let parts = [prompt];
  
  if (audioFile) {
    const audioPart = await fileToGenerativePart(audioFile);
    parts.push(audioPart);
  } else if (textTranscript) {
    parts.push(`Meeting Transcript:\n\n${textTranscript}`);
  } else {
    throw new Error("You must provide either an audio file or a text transcript.");
  }

  try {
    const result = await model.generateContent(parts);
    const responseText = result.response.text().trim().replace(/```json/gi, '').replace(/```/g, '');
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze meeting. Ensure your API key is valid and you have quota.");
  }
};
