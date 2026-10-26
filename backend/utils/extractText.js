// direct import path avoids pdf-parse's debug-mode test-file bug
import pdf from "pdf-parse/lib/pdf-parse.js";

const extractText = async (buffer) => {
  const data = await pdf(buffer);
  // clean up extra whitespace that pdf-parse leaves in
  return data.text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
};

export default extractText;
