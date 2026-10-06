export interface ParsedDocument {
  text: string;
  wordCount: number;
  metadata?: Record<string, unknown>;
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ParsedDocument> {
  // 1. Text, Markdown, JSON, CSV
  if (
    mimeType.includes('text') ||
    mimeType === 'application/json' ||
    mimeType === 'text/csv' ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.json') ||
    fileName.endsWith('.csv')
  ) {
    const rawText = buffer.toString('utf-8');
    return {
      text: rawText,
      wordCount: rawText.split(/\s+/).filter(Boolean).length,
    };
  }

  // 2. Simple fallback / structured extractor for other text or binary formats
  // Clean readable strings from buffer
  const extracted = buffer
    .toString('latin1')
    .replace(/[^\x20-\x7E\t\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    text: extracted.length > 50 ? extracted : `[Document: ${fileName} (${mimeType}) - Uploaded content indexed]`,
    wordCount: extracted.split(/\s+/).filter(Boolean).length,
  };
}
