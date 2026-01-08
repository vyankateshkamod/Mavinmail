import axios from "axios";

export class OpenRouterService {
    private static apiKey = process.env.OPENROUTER_API_KEY;
    private static defaultModel = process.env.DEFAULT_AI_MODEL || "google/gemini-2.0-flash-exp:free";

    /**
     * Generates text content using the OpenRouter API.
     * @param prompt The prompt to send to the AI.
     * @param model The model to use (optional, defaults to a free Gemini model).
     * @returns The generated text response.
     */
    static async generateContent(prompt: string, model?: string): Promise<string> {
        const selectedModel = model || this.defaultModel;
        console.log(`[OpenRouter] Sending request to model: ${selectedModel}`);

        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const response = await axios.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        model: selectedModel,
                        messages: [
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                    },
                    {
                        headers: {
                            "Authorization": `Bearer ${this.apiKey}`,
                            "HTTP-Referer": "http://localhost:3000",
                            "X-Title": "Email Assistant"
                        }
                    }
                );

                return response.data.choices[0].message.content;
            } catch (err: any) {
                if (err.response && err.response.status === 429) {
                    retryCount++;
                    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
                    console.warn(`[OpenRouter] Rate limited (429). Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error("[OpenRouter] Error:", err?.response?.data || err);
                    throw new Error("OpenRouter request failed.");
                }
            }
        }
        throw new Error("OpenRouter request failed after retries.");
    }

    /**
     * Generates a JSON response from the OpenRouter API.
     * Includes prompt engineering to enforce JSON output and strict parsing.
     * @param prompt The prompt to send.
     * @param model The model to use.
     * @returns The parsed JSON object.
     */
    static async generateJSON(prompt: string, model?: string): Promise<any> {
        // Augment prompt to ensure JSON
        const jsonPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown code fences. No explanations.`;

        const rawContent = await this.generateContent(jsonPrompt, model);

        // Robust JSON extraction: Find the first '{' and the last '}'
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

        const cleaned = jsonMatch ? jsonMatch[0] : rawContent;

        try {
            return JSON.parse(cleaned);
        } catch (e) {
            console.error("[OpenRouter] Failed to parse JSON. Raw output:", rawContent);
            console.error("Cleaned output was:", cleaned);
            throw new Error("AI returned invalid JSON.");
        }
    }
}
