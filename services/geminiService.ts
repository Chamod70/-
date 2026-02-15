
import { GoogleGenAI, Modality } from "@google/genai";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function generateSermonText(topic: string): Promise<string> {
  const ai = getAIClient();
  const prompt = `ඔබ ඉතාමත් ශාන්ත, කරුණාවන්ත, සහ වයෝවෘද්ධ බෞද්ධ භික්ෂුවකි (ධර්ම දේශකයෙකි).
කාර්යය: ${topic} යන මාතෘකාව ඔස්සේ තත්පර 60ක කෙටි ධර්ම දේශනාවක් සකසන්න.

විශේෂ උපදෙස්:
- භාෂාව: ඉතාමත් සරල, ගම්භීර සහ හදවතට දැනෙන පද්‍යමය සිංහල භාෂාව භාවිතා කරන්න.
- රිද්මය: සැබෑ දේශකයෙකු දේශනා කරන ආකාරයට, වචන අතර ස්වභාවික විවේකයන් (natural pauses) ඇති වන ලෙස සකසන්න.
- හැඟීම: දේශනාව තුළින් මහා මෙත්තාවක් සහ අනුකම්පාවක් විහිදිය යුතුය.

ව්යුහය:
1. "පින්වත්නි..." යනුවෙන් ආරම්භ කරන්න.
2. සෑම කෙටි වැකියක් අවසානයේදීම "..." යොදා ස්වභාවික විවේකය සලකුණු කරන්න.
3. සැබෑ ධර්ම දේශනාවකදී මෙන් ඇතැම් වැදගත් වචන අවධාරණය කරන රිද්මයක් පවත්වා ගන්න.

සීමාව: වචන 70-90 අතර ප්‍රමාණයක්. AI එකක් වගේ නෙවෙයි, ඇත්තම ස්වාමීන් වහන්සේ නමක් දේශනා කරන ස්වරූපයෙන් ලියන්න.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.4,
        topP: 0.85,
      },
    });

    return response.text || "සමාවන්න, දේශනය සැකසීමේ දෝෂයක් පවතී.";
  } catch (error) {
    console.error("Text Generation API Error:", error);
    throw error;
  }
}

export async function generateSermonAudio(text: string): Promise<Uint8Array> {
  const ai = getAIClient();
  
  // High-fidelity instructions to steer the TTS towards human-like nuances
  const ttsPrompt = `හඬ පෞරුෂය: අතිශයින්ම ශාන්ත, කරුණාබරිත සහ ප්‍රඥාවන්ත මහලු ස්වාමීන් වහන්සේ නමකි. 
ශෛලිය: මෙය යන්ත්‍රයක් (AI) පවසන දෙයක් ලෙස නොව, සැබෑ මනුෂ්‍ය ස්වාමීන් වහන්සේ නමකගේ හදවතින්ම ගලා එන ධර්ම දේශනාවක් ලෙස ඉදිරිපත් කරන්න.
උපදෙස්:
- වචන උච්චාරණය කිරීමේදී ඉතාමත් සෙමින් සහ රිද්මයානුකූලව කරන්න.
- සාම්ප්‍රදායික ධර්ම දේශනා ස්වරය (Bana style intonation) භාවිතා කරන්න.
- වැකි අතර ස්වභාවික හුස්ම ගැනීම් සහ විරාමයන් සහිතව, ඉතා සන්සුන්ව පවසන්න.
- හඬේ ගැඹුර සහ පෞරුෂය මතු කරන්න.

දේශනාව:
${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' }, // Charon has the best depth for an elder monk
          },
        },
      },
    });

    if (!response.candidates?.[0]) {
      throw new Error("No candidates returned from API.");
    }

    const audioPart = response.candidates[0].content?.parts?.find(p => p.inlineData);
    const base64Audio = audioPart?.inlineData?.data;

    if (!base64Audio) {
      throw new Error(`Failed to generate audio content. Finish Reason: ${response.candidates[0].finishReason}`);
    }

    return decodeBase64(base64Audio);
  } catch (error) {
    console.error("Audio Generation API Error:", error);
    throw error;
  }
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodePCMToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const numChannels = 1;
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);
  return new Blob([header, pcmData], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
