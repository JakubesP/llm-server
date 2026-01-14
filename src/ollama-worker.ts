import Ollama, { Message } from 'ollama';
import { streamToken } from './requests';

// Helper to calculate prompt size
const getPromptSize = (messages: Message[]): number => {
  return messages.reduce((size, msg) => {
    return size + (typeof msg.content === 'string' ? msg.content.length : JSON.stringify(msg.content).length);
  }, 0);
};

export async function runOllama(
  prompt: string | Message[],
  model: string,
  correlation_id?: string,
  format?: string,
): Promise<string> {
  const messages = Array.isArray(prompt)
    ? (prompt as Message[])
    : [{ role: 'user', content: prompt }];

  // Log prompt size for debugging
  const promptSize = getPromptSize(messages);
  console.log(`[Ollama] Model: ${model}, Prompt size: ${promptSize} chars, Messages: ${messages.length}`);

  // Get context window size from env or use reasonable defaults
  const numCtx = Number(process.env.NUM_CTX ?? process.env.CONTEXT_WINDOW ?? 4096);
  
  const generationOptions = {
    temperature: Number(process.env.TEMPERATURE ?? 1),
    top_p: Number(process.env.TOP_P ?? 0.95),
    top_k: Number(process.env.TOP_K ?? 0),
    num_ctx: numCtx, // Context window size
    num_predict: Number(process.env.NUM_PREDICT ?? -1), // -1 = unlimited, or set max tokens
  };

  try {
    if (correlation_id) {
      const stream = await Ollama.chat({
        model,
        // think: false,
        options: {
          low_vram: false,
          ...generationOptions,
        },
        format,
        messages,
        stream: true,
      });

      let response = '';
      const startTime = Date.now();

      for await (const chunk of stream) {
        const content = chunk.message?.content;
        if (content) {
          // Fire and forget - don't await to avoid blocking
          streamToken(correlation_id, content);
          response += content;
        }

        if (chunk.done) {
          streamToken(correlation_id);
          const duration = Date.now() - startTime;
          console.log(`[Ollama] Generation completed in ${duration}ms, Response length: ${response.length}`);
          break;
        }
      }

      return response;
    }

    const startTime = Date.now();
    const response = await Ollama.chat({
      model,
      // think: false,
      options: {
        low_vram: false,
        ...generationOptions,
      },
      format,
      messages,
      stream: false,
    });

    const duration = Date.now() - startTime;
    const content = response.message?.content || '';
    console.log(`[Ollama] Generation completed in ${duration}ms, Response length: ${content.length}`);

    return content;
  } catch (err) {
    console.error('Ollama error:', err);
    throw err;
  }
}
