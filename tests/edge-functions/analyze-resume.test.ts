// Deno unit tests for the resume text-extraction helper.
// Run locally with: deno test -A tests/edge-functions/analyze-resume.test.ts

import { assertEquals, assertRejects } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { extractTextFromFile } from "../../supabase/functions/analyze-resume/index.ts";

Deno.test("extractTextFromFile: reads txt file", async () => {
  const content = "Hello this is a test resume with enough text to pass validation";
  const blob = new Blob([new TextEncoder().encode(content)], {
    type: "text/plain",
  });

  const text = await extractTextFromFile(blob, "resume.txt");
  assertEquals(text, content);
});

Deno.test("extractTextFromFile: reads md file", async () => {
  const content = "This is a markdown resume file with plenty of text content for testing";
  const blob = new Blob([new TextEncoder().encode(content)], {
    type: "text/markdown",
  });

  const text = await extractTextFromFile(blob, "resume.md");
  assertEquals(text, content);
});

Deno.test("extractTextFromFile: invalid pdf throws friendly error", async () => {
  const blob = new Blob([new Uint8Array([1, 2, 3, 4])], {
    type: "application/pdf",
  });

  await assertRejects(
    () => extractTextFromFile(blob, "resume.pdf"),
    Error,
    "Invalid PDF file format",
  );
});

Deno.test("extractTextFromFile: flate-compressed pdf extracts readable text", async () => {
  if (typeof (globalThis as any).CompressionStream === "undefined") {
    // Environment does not support CompressionStream; skip.
    return;
  }

  const textObject = "BT /F1 12 Tf 72 720 Td (John Doe) Tj (Software Engineer) Tj ET";
  const raw = new TextEncoder().encode(textObject);

  const cs = new CompressionStream("deflate");
  const compressedAb = await new Response(new Blob([raw]).stream().pipeThrough(cs)).arrayBuffer();
  const compressed = new Uint8Array(compressedAb);

  const header = new TextEncoder().encode(
    `%PDF-1.4\n1 0 obj\n<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n`,
  );
  const footer = new TextEncoder().encode("\nendstream\nendobj\n%%EOF");

  const pdf = new Uint8Array(header.length + compressed.length + footer.length);
  pdf.set(header, 0);
  pdf.set(compressed, header.length);
  pdf.set(footer, header.length + compressed.length);

  const blob = new Blob([pdf], { type: "application/pdf" });
  const text = await extractTextFromFile(blob, "resume.pdf");

  if (!text.includes("John Doe") || !text.includes("Software Engineer")) {
    throw new Error(`Expected extracted text to include resume content, got: ${text}`);
  }
});

Deno.test("extractTextFromFile: pdf with no extractable text throws helpful error", async () => {
  // A minimal PDF header but no actual text content
  const pdfContent = "%PDF-1.4\n%%EOF";
  const blob = new Blob([new TextEncoder().encode(pdfContent)], {
    type: "application/pdf",
  });

  await assertRejects(
    () => extractTextFromFile(blob, "resume.pdf"),
    Error,
    "Could not extract readable text from PDF",
  );
});

Deno.test("extractTextFromFile: binary file throws unsupported format error", async () => {
  // Binary content with many non-printable characters
  const binaryContent = new Uint8Array(100).fill(0);
  const blob = new Blob([binaryContent], {
    type: "application/octet-stream",
  });

  await assertRejects(
    () => extractTextFromFile(blob, "resume.bin"),
    Error,
    "Unsupported file format",
  );
});

Deno.test("extractTextFromFile: plain text fallback works", async () => {
  const content = "This is plain text content without a specific extension but should still work fine";
  const blob = new Blob([new TextEncoder().encode(content)], {
    type: "text/plain",
  });

  const text = await extractTextFromFile(blob, "resume");
  assertEquals(text, content);
});
