// Deno unit tests for the resume text-extraction helper.
// Run locally with: deno test -A tests/edge-functions/analyze-resume.test.ts

import { assertEquals, assertRejects } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { extractTextFromFile } from "../../supabase/functions/analyze-resume/index.ts";

Deno.test("extractTextFromFile: reads txt", async () => {
  const blob = new Blob([new TextEncoder().encode("Hello resume")], {
    type: "text/plain",
  });

  const text = await extractTextFromFile(blob, "resume.txt");
  assertEquals(text, "Hello resume");
});

Deno.test("extractTextFromFile: invalid pdf throws friendly error (and not Buffer crash)", async () => {
  const blob = new Blob([new Uint8Array([1, 2, 3, 4])], {
    type: "application/pdf",
  });

  await assertRejects(
    () => extractTextFromFile(blob, "resume.pdf"),
    Error,
    "Failed to parse PDF file",
  );
});

Deno.test("extractTextFromFile: unknown binary throws unsupported format", async () => {
  const blob = new Blob([new Uint8Array([255, 254, 253, 252])], {
    type: "application/octet-stream",
  });

  await assertRejects(
    () => extractTextFromFile(blob, "resume.bin"),
    Error,
    "Unsupported file format",
  );
});
