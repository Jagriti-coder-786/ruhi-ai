export interface TextChunk {
  index: number;
  content: string;
  charCount: number;
}

export function chunkText(
  text: string,
  chunkSize: number = 700,
  chunkOverlap: number = 100
): TextChunk[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < normalized.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < normalized.length) {
      // Find clean sentence or newline boundary
      const nextNewline = normalized.lastIndexOf('\n', endIndex);
      const nextPeriod = normalized.lastIndexOf('. ', endIndex);
      const boundary = Math.max(nextNewline, nextPeriod);

      if (boundary > startIndex + chunkSize * 0.5) {
        endIndex = boundary + 1;
      }
    } else {
      endIndex = normalized.length;
    }

    const chunkContent = normalized.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 20) {
      chunks.push({
        index: chunkIndex++,
        content: chunkContent,
        charCount: chunkContent.length,
      });
    }

    startIndex = endIndex - chunkOverlap;
    if (startIndex >= normalized.length - chunkOverlap) {
      break;
    }
  }

  return chunks;
}
