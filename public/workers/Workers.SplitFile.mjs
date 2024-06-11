// import jschardet from "jschardet";
import JSZip from "jszip";
import { exportWorkerAlert, exportWorkerFile } from "./Workers.State.mjs";

/** Convert a number to Megabytes */
const MEGABYTE = 1048576;
const megabytesToBytes = (n) => n * MEGABYTE;
const bytesToMegabytes = (n) => n / MEGABYTE;
const ZIP_FILE_THRESH_MB = 75; // Max size of each zip file
const ZIP_FILE_THRESH = megabytesToBytes(ZIP_FILE_THRESH_MB); // Max size of each zip file

/**
 * Split file
 * @param {File} file
 * @param {number} numSegments
 */
export async function splitTextFile(file, numSegments = 5) {
  const MAX_SIZE_MB = 20;
  const totalSize = file.size;
  // Restrict max chunk size to MAX_SIZE_MB
  const chunkSize = Math.min(
    Math.ceil(totalSize / numSegments),
    megabytesToBytes(MAX_SIZE_MB)
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
      if (accumulatedSize >= ZIP_FILE_THRESH) {
        let warn = `Your file download is at or over ${ZIP_FILE_THRESH_MB}MB.`;
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
