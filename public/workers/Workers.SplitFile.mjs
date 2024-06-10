// import jschardet from "jschardet";
import JSZip from "jszip";
import { exportWorkerAlert, exportWorkerFile } from "./Workers.State.mjs";

/* ITERATION 3x */

/**
 * Split file
 * @param {File} file
 * @param {number} numSegments
 */
export async function splitTextFile(file, numSegments = 5) {
  const totalSize = file.size;
  // Dynamically calculate chunk size based on file size
  const chunkSize = Math.min(Math.ceil(totalSize / numSegments), 209715200);
  const zip = new JSZip();
  const reader = file.stream().getReader();
  let currentSegmentIndex = 0;
  let currentSegmentContent = "";

  // Overwrite encoding
  const textDecoder = new TextDecoder("utf-8", { fatal: true });

  let addedSegments = 0;

  // Helper function to add files to zip
  function addSegmentToFile(segmentContent, index) {
    const blob = new Blob([segmentContent], { type: "text/plain" });
    const fileName = `${file.name}_part_${index + 1}.txt`;
    zip.file(fileName, blob);
    addedSegments = addedSegments + 1;
    exportWorkerAlert(
      `Created: ${fileName} (size ${blob.size} bytes)`,
      "Info",
      true
    );
    blob.text().then(() => URL.revokeObjectURL(blob)); // Cleanup memory
  }

  let inProgress = true;
  let hasError = false;

  while (inProgress) {
    try {
      const { done, value } = await reader.read();
      if (done) {
        if (currentSegmentContent) {
          addSegmentToFile(currentSegmentContent, currentSegmentIndex);
        }
        inProgress = false;
      }
      const textChunk = textDecoder.decode(value, { stream: true });
      currentSegmentContent += textChunk;

      // Determine if we need to create a new segment
      if (currentSegmentContent.length >= chunkSize) {
        addSegmentToFile(currentSegmentContent, currentSegmentIndex);
        currentSegmentIndex++;
        currentSegmentContent = ""; // Reset for the next segment
      }
    } catch (error) {
      console.error("Error processing file:", error);
      hasError = true;
      inProgress = false;
      break;
    }
  }

  if (hasError) {
    return exportWorkerAlert(`Error: ${file.name} was not split`, "Error");
  }

  const zipped = await zip.generateAsync({ type: "blob" });
  const zipFileName = `${file.name}_segments.zip`;
  exportWorkerFile(zipped, zipFileName);
  exportWorkerAlert(`${file.name} split into ${addedSegments} segments`);
}
