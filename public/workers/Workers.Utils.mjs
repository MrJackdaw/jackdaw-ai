export const STATUS = Object.freeze({
  ERROR: "error",
  OK: "ok",
  LOADING: "loading"
});

/**
 * Strip HTML characters and other non-essential parts from email content
 * @param {string} data Parsed text or HTML file as a string
 */
export function pruneHTMLString(data) {
  const marker1 = /From\s(\w+@\w+\.\w+\b|\d{1,}@xxx)/gm;
  const marker2 = /<!--\s(=\s){43}-->/gm;
  return (
    data
      // Hopefully ignore/remove strings of encoded signatures
      .replace(/^[a-zA-Z0-9\s]+$/gim, "")
      // Remove script and style content
      .replace(/<(script|style)[^>]*>([\s\S]*?)<\/\1>/gim, "")
      // remove leading `>` from quoted replies
      .replace(/>+(\s|\t|\n)+?/gim, "\n")
      // Remove excessive line-breaks
      .replace(/\n{3,}/gm, "\n")
      // Remove all remaining HTML tags
      .replace(/<\/?[a-z][\s\S]*?>/gim, "")
      // Normalize white space
      .replace(/\s{2,}/gm, " ")
      // remove "= " (result of formatting)
      .replace(/(=.){1,}/gm, "") 
      // Convert HTML entities to their corresponding characters
      .replace(/&[#A-Za-z0-9]+;/gim, decodeHtmlEntities)
      .replace(/<.[^<>]*?>/gim, "")
      // TEST: split into individual emails
      .replace(marker1, (m) => `\n\n${m}`)
      .replace(marker2, (m) => `\n\n${m}`)
  );
}

/**
 * Manually parse out HTML chars from text string
 * @param {string} text  */
function decodeHtmlEntities(text) {
  const entities = {
    "&amp;": "&",
    "&mdash;": "-",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'"
    // Add more entities as needed
  };
  return text.replace(/&[#A-Za-z0-9]+;/g, (match) => entities[match] || match);
}

/** Removes cached huggingface models */
export async function clearCachedModels() {
  return caches.delete("transformers-cache");
}

/**
 * Post an error response to the UI
 * @param {string} message Message to return
 * @param {*} data Any additional error info to send
 * @returns Standardized error object
 */
export function workerError(message, data) {
  return self.postMessage({ status: STATUS.ERROR, message, data });
}

/**
 * Wrapper helper for `console.time` + `console.timeEnd` functions
 * @param {string} startTimerLabel Label of console timer to start
 * @param {string|undefined} stopTimerLabel Optional label of timer to stop
 */
export function startTimer(startTimerLabel, stopTimerLabel) {
  if (!import.meta.env.DEV) return;
  stopTimer(stopTimerLabel);
  console.log(`${startTimerLabel} \t ::start\n`);
  console.time(startTimerLabel);
}

/**
 * Wrapper helper for `console.timeEnd` function
 * @param {string} stopTimerLabel Optional label of timer to stop
 */
export function stopTimer(stopTimerLabel) {
  if (!import.meta.env.DEV) return;
  if (stopTimerLabel) console.timeEnd(stopTimerLabel);
}

const CSV_LINEBREAK = /\n\r?/;

/**
 * Get a list of column-names from CSV file, with an extra column for doc name
 * @param {string} csvContent Parsed CSV contents in a text blurb
 * @returns {string[]} list of column names
 */
function getColumnNames(csvContent) {
  const lines = csvContent.split(CSV_LINEBREAK);
  let columnNameAttempts = 1;
  let columnNames = lines[0].split(",");
  columnNames = checkRowsForColumnNames();
  columnNames.push("meta__documentName");
  console.log({ columnNames });
  return columnNames;

  /** Search up to five rows for column names in case they aren't in the first row. */
  function checkRowsForColumnNames() {
    const fromNextRow = lines[columnNameAttempts].split(",").filter(Boolean);
    columnNameAttempts += 1;
    const tryAgain =
      !fromNextRow.length || fromNextRow.length < columnNames.length;

    // Immediately try again if there are retry attempts and no results
    if (tryAgain && columnNameAttempts < 5) return checkRowsForColumnNames();
    // Return current results if next row returns the same length of items
    if (fromNextRow.length === columnNames.length) return columnNames;
    // Replace column names with this row if it has more column names.
    // Continue retrying if there are enough attempts (to avoid red-herrings)
    if (fromNextRow.length > columnNames.length) {
      columnNames = fromNextRow;
      return columnNameAttempts < 5 ? checkRowsForColumnNames() : columnNames;
    }

    if (columnNameAttempts >= 5) return columnNames;
  }
}

/**
 * Convert a CSV to JSON before sending to server (or doing anything else)
 * @param {File} file CSV file
 * @param {number} [batchSize=300] Number of rows to process per batch
 * @returns {Promise<[{(): IterableIterator}|null, Error|null]>} Array with two items: 1) Generator function
 * that yields rows from the CSV, and 2) An error if one was encountered when opening the file.
 * One item will always be null: if there's a generator, Error will be `null` (and vice-versa)
 */
export async function csvToJson(file, batchSize = 300) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve([
        // A genererator function that yields rows until there are none left
        function* yieldCSVRows() {
          const csvContent = reader.result;
          const columnNames = getColumnNames(csvContent);
          const documentName = file.name;
          // const lines = csvContent.split("\r\n").slice(1); // Skip header line
          const lines = csvContent.split(CSV_LINEBREAK).slice(1); // Skip header line
          let batch = [];

          for (const line of lines) {
            if (line.trim() === "") continue; // Skip empty lines
            const row = line.split(",");
            const jsonObject = {};

            for (let i = 0; i < columnNames.length - 1; i++) {
              jsonObject[columnNames[i]] = row[i];
            }

            jsonObject["meta__documentName"] = documentName;
            batch.push(jsonObject);

            if (batch.length === batchSize) {
              yield batch;
              batch = [];
            }
          }

          if (batch.length > 0) {
            yield batch;
          }
        },

        // No error for successful response
        null
      ]);
    };

    reader.onerror = (error) => {
      // Error resolves promise with no generator and an Error
      resolve([null, error?.message ?? JSON.stringify(error)]);
    };

    // Begin reading file
    reader.readAsText(file);
  });
}

/**
 * Create a plain-text `File` object from a string
 * @param {string} txt Input text
 * @returns {Blob}
 */
export function plainTextToBlob(txt) {
  return new Blob([txt], { type: "text/plain" });
}
