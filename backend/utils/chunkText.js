// split long text into ~4 000-char chunks on paragraph boundaries
// so we never blow the model's context window on big PDFs
const chunkText = (text, size = 4000) => {
  const chunks = [];
  let current = "";

  for (const para of text.split(/\n\s*\n/)) {
    if ((current + para).length > size && current) {
      chunks.push(current);
      current = "";
    }

    if (para.length > size) {
      // single huge paragraph — cut it hard
      for (let i = 0; i < para.length; i += size) {
        chunks.push(para.slice(i, i + size));
      }
    } else {
      current += para + "\n\n";
    }
  }

  if (current.trim()) chunks.push(current);
  return chunks;
};

export default chunkText;
