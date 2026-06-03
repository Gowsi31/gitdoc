import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = 'text-embedding-3-small';

export async function embedTexts(texts) {
  if (texts.length === 0) return [];
  const response = await openai.embeddings.create({ model: MODEL, input: texts });
  return response.data.map(d => d.embedding);
}

export async function embedQuery(text) {
  const [embedding] = await embedTexts([text]);
  return embedding;
}
