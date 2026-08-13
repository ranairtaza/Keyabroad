import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { MatcherExplanationSchema, MatcherExplanationResult } from './schema';

export class AIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generates a structured response based on a strictly defined Zod schema.
   */
  async generateStructured<T extends z.ZodTypeAny>(
    systemPrompt: string,
    userPrompt: string,
    schema: T,
    schemaName: string
  ): Promise<z.infer<T>> {
    const response = await this.openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: zodResponseFormat(schema, schemaName),
      temperature: 0.1, // Low temperature for deterministic output
    });

    const parsedData = response.choices[0]?.message?.parsed;
    if (!parsedData) {
      throw new Error("Failed to parse structured output from AI.");
    }
    return parsedData;
  }
}
