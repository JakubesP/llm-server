import Ollama, { Message } from 'ollama';
import { OLLAMA_MODEL } from './constants';
import { streamToken } from './requests';

export async function runOllama(
  prompt: string | Message[],
  correlation_id?: string,
  model: string = OLLAMA_MODEL
): Promise<string> {
  const messages = Array.isArray(prompt)
    ? (prompt as Message[])
    : [{ role: 'user', content: prompt }];

  try {
    if (correlation_id) {
      const stream = await Ollama.chat({
        model,
        // think: false,
        options: { low_vram: false },
        messages,
        stream: true,
      });

      let response = '';

      for await (const chunk of stream) {
        const content = chunk.message?.content;
        if (content) {
          await streamToken(correlation_id, content);
          response += content;
        }

        if (chunk.done) {
          await streamToken(correlation_id);
          break;
        }
      }

      return response;
    }

    const response = await Ollama.chat({
      model,
      // think: false,
      options: { low_vram: false },
      messages,
      stream: false,
    });

    return response.message?.content || '';
  } catch (err) {
    console.error('Ollama error:', err);
    throw err;
  }
}
