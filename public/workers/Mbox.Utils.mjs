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
  return (
    data
      // Remove script and style content
      .replace(/<(script|style)[^>]*>([\s\S]*?)<\/\1>/gim, "")
      // remove leading `>` from inlined reply-sections
      .replace(/>+(\s|\t|\n)+?/gim, "\n")
      // Remove all remaining HTML tags
      // .replace(/<.[^<>]*?>/gim, "")
      .replace(/<\/?[a-z][\s\S]*?>/gim, "")
      // Normalize white space
      .replace(/\s{2,}/g, " ")
      // Convert HTML entities to their corresponding characters
      .replace(/&[#A-Za-z0-9]+;/gim, decodeHtmlEntities)
      // Remove leading `>` from quoted lines
      .replace(/^>{3,}\s+/gm, "")
      // Remove excessive line-breaks
      .replace(/\n{3,}/g, "\n")
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
