import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function transcribeAndFormatAudio(base64Audio: string, mimeType: string): Promise<string[]> {
  const prompt = `Jesteś asystentem komunikacji w recepcji (np. w przychodni, urzędzie).
Twoim zadaniem jest przetworzenie nagranej wypowiedzi pracownika na tekst, który zostanie wyświetlony pacjentowi/klientowi na ekranie.
Zasady:
1. Przekształć mowę na tekst.
2. Formatowanie dla słabowidzących: Podziel tekst na bardzo krótkie fragmenty (maksymalnie 2-4 słowa na fragment). Każdy fragment będzie wyświetlany na osobnym ekranie (slajdzie).
3. Uprość złożone zdania i usuń zbędne dygresje, potknięcia językowe czy powtórzenia.
4. Podkreśl (użyj pogrubienia Markdown: **tekst**) kluczowe informacje: daty, godziny, numery gabinetów, nazwy dokumentów do przygotowania, kwoty.
5. Język wyjściowy: Polski.
6. Używaj prostego, zrozumiałego języka.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "Pojedynczy slajd zawierający 2-4 słowa.",
          },
          description: "Lista slajdów do wyświetlenia.",
        },
      }
    });

    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Wystąpił błąd podczas przetwarzania nagrania.");
  }
}
