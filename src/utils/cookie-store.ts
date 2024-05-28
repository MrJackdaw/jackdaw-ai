import { DateTime } from "luxon";

/**
 * Helper class that gives `document.cookies` a key-value API. Writing to cookies is
 * disabled for security, so it can *read* cookies, but will write all values to
 * `localStorage`. */
export default class CookieStore {
  static prefix = "__k-";

  /** Sets a cookie */
  static set(name: string, value: string, expiresDays?: number) {
    const key = `${this.prefix}${name}`;
    const expires = expiresDays
      ? DateTime.now().plus({ days: expiresDays }).toSeconds()
      : undefined;
    localStorage.setItem(key, JSON.stringify({ value, expires }));
  }

  /** Gets a cookie by name */
  static get(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /** Read a value that is controlled by this classs from localStorage */
  static getLocal(name: string) {
    const key = `${this.prefix}${name}`;
    return localStorage.getItem(key);
  }

  /** Check if cookie exists */
  static checkIfExpired(name: string) {
    const stored = this.getLocal(name);
    if (!stored) return true;

    try {
      const { expires } = JSON.parse(stored);
      const notANumber = !expires || isNaN(Number(expires));
      if (notANumber) return true;

      return DateTime.fromSeconds(Number(expires)) <= DateTime.now();
    } catch (error) {
      return true;
    }
    // const cookie = CookieStore.get(name);
    // if (cookie === null) return true;
    // // Find the date string in the cookie value
    // const dateString = cookie.split(";")[0].split("=")[1];
    // const date = new Date(dateString);
    // // DateTime
  }

  /** Deletes a cookie by name */
  static expire(name: string) {
    // document.cookie = `${name}=; path=/`;
    // document.cookie = document.cookie.replace(`${name}=;`, "");
    const key = `${this.prefix}${name}`;
    localStorage.removeItem(key);
  }

  static reset() {
    CookieStore.expire("first-upload");
  }

  static getUser() {
    return CookieStore.get("__sess");
  }
}
