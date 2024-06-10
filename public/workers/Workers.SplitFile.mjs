// import jschardet from "jschardet";
import JSZip from "jszip";
import { exportWorkerAlert, exportWorkerFile } from "./Workers.State.mjs";

/** Convert a number to Megabytes */
const megabytesToBytes = (n) => n * 1048576;
const bytesToMegabytes = (n) => n / 1048576;
const GIGAB = megabytesToBytes(1000);

/**
 * Split file
 * @param {File} file
 * @param {number} numSegments
 */
export async function splitTextFile(file, numSegments = 5) {
  const totalSize = file.size;
  // Restrict max chunk size to 200MB
  const chunkSize = Math.min(
    Math.ceil(totalSize / numSegments),
    megabytesToBytes(200)
  );

  const expectSegments = Math.ceil(totalSize / chunkSize);
  const reader = file.stream().getReader();
  let currentSegmentIndex = 0;
  let currentSegmentContent = "";
  let zip = new JSZip();

  // Overwrite encoding
  const textDecoder = new TextDecoder("utf-8", { fatal: true });
  let addedSegments = 0;
  let accumulatedSize = 0;

  // Helper function to add files to zip
  async function addSegmentToFile(segmentContent, index) {
    const blob = new Blob([segmentContent], { type: "text/plain" });
    const blobSizeMB = Math.round(bytesToMegabytes(blob.size));
    const fileName = `${file.name}_part_${index + 1}.txt`;
    zip.file(fileName, blob);
    addedSegments = addedSegments + 1;
    accumulatedSize += megabytesToBytes(blobSizeMB);

    URL.revokeObjectURL(blob); // Cleanup memory

    const progMsg = `Created ${fileName} (~${blobSizeMB} MB)...`;
    exportWorkerAlert(progMsg, "Info", true);
  }

  let inProgress = true;
  let hasError = false;
  let emittedZipFiles = 0;

  // Emit a zip file with all accumulated segments so far
  async function emitZipSegment() {
    emittedZipFiles += 1;
    const zipFileName = `${file.name}_segments-${emittedZipFiles}.zip`;
    const info = `Created ${addedSegments} of ${expectSegments} segments`;
    const zipped = await zip.generateAsync({ type: "blob" });
    exportWorkerFile(zipped, zipFileName);
    exportWorkerAlert(info);
  }

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

      // When accumulated zip is larger than 1GB, warn user, emit a file, and then continue.
      if (accumulatedSize >= GIGAB) {
        let warn = `Your file download is at or over 1GB.`;
        warn = `${warn} Generating zip file with ${addedSegments} of ${expectSegments} segments:`;
        warn = `${warn} please don't refresh the page until all segments are completed.`;
        exportWorkerAlert(warn, "Warning");

        await emitZipSegment();

        // reset zip context
        zip = new JSZip();
        accumulatedSize = 0;
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

  emitZipSegment();
}
