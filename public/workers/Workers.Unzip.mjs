import JSZip from "jszip";
import { workerError } from "./Workers.Utils.mjs";
import { exportWorkerAlert } from "./Workers.State.mjs";
import {
  documentsFromTextBlurb,
  batchLoad,
  setVectorStoreDocumentContext
} from "./Workers.VectorStore.mjs";

/**
 * Unzip a target file and attempt to parse and embed its contents. The zip
 * file must contain plain text files, or anything that returns plain text when
 * `zip.file( path ).async("text")` is called.
 * @param {File} file Zip file (requires type 'application/zip')
 */
export async function unzipAndParse(file) {
  // Ensure we're getting the right file type
  if (file.type !== "application/zip") return workerError("Invalid file type");

  exportWorkerAlert("Unzipping archive...", "Warning");
  // Open file contents
  const zip = await new JSZip().loadAsync(file);
  exportWorkerAlert(`Found ${zip.length} files`, "Warning");

  zip.forEach(async (path, file) => {
    // Notify user of each file attempt
    exportWorkerAlert(`Opening ${file.name}...`, "Warning");
    setVectorStoreDocumentContext(file.name);

    await zip
      .file(path)
      .async("text") // read contents as text
      .then(documentsFromTextBlurb)
      .then(batchLoad)
      .catch((e) => {
        console.log(e);
        // Warn user that this one failed, and move on
        exportWorkerAlert(
          `${file.name} was not added to your project`,
          "Error"
        );
      });
  });
}
