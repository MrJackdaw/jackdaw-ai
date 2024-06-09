import JSZip from "jszip";
import { exportWorkerAlert, exportWorkerFile } from "./Workers.State.mjs";

/**
 * Split a large text-based file into multiple smaller fragments.
 * @param {File} file Target text(-based) file.
 * @param {number} [numSegments=5] Split `file` into this many parts (defaults to 5).
 */
export async function splitTextFile(file, numSegments = 5) {
  const chunkSize = 1024 * 1024; // 1MB
  let accumulatedContent = "";
  let totalEmails = 0;
  const emails = [];

  // Read file in chunks and process
  for await (const chunk of readFileChunks(file, chunkSize)) {
    accumulatedContent += new TextDecoder().decode(chunk);
    const parts = accumulatedContent.split("From ");
    accumulatedContent = parts.pop(); // Keep the last part for the next chunk
    emails.push(...parts);
  }
  // Add the last accumulated part
  if (accumulatedContent) {
    emails.push(accumulatedContent);
  }
  totalEmails = emails.length;

  const partSize = Math.ceil(totalEmails / numSegments);
  const zip = new JSZip();

  for (let i = 0; i < numSegments; i++) {
    const startIdx = i * partSize;
    const endIdx =
      (i + 1) * partSize < totalEmails ? (i + 1) * partSize : totalEmails;

    const partEmails = emails.slice(startIdx, endIdx);
    const partContent = partEmails.join("From ");
    const partBlob = new Blob([partContent], { type: "text/plain" });
    const partFileName = `${file.name}_part_${i + 1}.mbox`;

    zip.file(partFileName, partBlob);
    console.log(`Created: ${partFileName} (size ${partBlob.size}B)`);
  }

  // Generate zip file
  const zipped = await zip.generateAsync({ type: "blob" });
  const zipFileName = `${file.name}_segments.zip`;
  exportWorkerFile(zipped, zipFileName);
  exportWorkerAlert(`${file.name} split into ${numSegments} segments`);
}

/**
 * Reads a file in chunks and returns an async generator.
 * @param {File} file The file to read.
 * @param {number} chunkSize The size of each chunk to read.
 */
async function* readFileChunks(file) {
  // Default to 1MB chunks
  const reader = file.stream().getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield value;
  }
}
