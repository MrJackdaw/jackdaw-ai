import { useState, FormEventHandler, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  notificationChannel,
  stringToColor,
  updateUserSettings
} from "utils/general";
import CookieStore from "utils/cookie-store";
import {
  sendParserMessage,
  changeMboxOwner,
  clearParserModelCache
} from "mbox/Mbox";
import { logoutUser } from "data/requests";
import { updateNotification } from "state/notifications";
import { SettingsStore } from "state/settings-store";
import useSettings from "hooks/useSettings";
import "./Form.GeneralSettings.scss";
import useUser from "hooks/useUser";
import { ChatStore } from "state/chat-store";

const CHANNEL = notificationChannel("GeneralSettingsForm");

/** @Form Settings for authenticated and unauthenticated users */
export default function GeneralSettingsForm() {
  const $picker = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { owner, colorIdent } = useSettings(["owner", "colorIdent"]);
  const { authenticated } = useUser(["authenticated"]);
  const [editingOwner, setEditingOwner] = useState(false);
  const [changingColor, setChangingColor] = useState(false);
  const [newOwner, setNewOwner] = useState(owner);
  const stop: FormEventHandler = (e) => e.preventDefault();
  const finishColorEditing = () => setChangingColor(false);
  const changeColorIdentifier = (e?: FormEvent<HTMLInputElement>) => {
    if (changingColor && e?.currentTarget.value) {
      SettingsStore.colorIdent(e.currentTarget.value);
      updateUserSettings(SettingsStore.getState());
    } else if (!changingColor) {
      setChangingColor(true);
      return void $picker.current?.focus();
    }
  };
  const clearInbox = () => {
    ChatStore.reset();
    sendParserMessage("Mbox.clearEmails");
    setTimeout(() => navigate("/"));
  };
  const clearOwnerIdent = () => {
    setNewOwner("");
    changeMboxOwner("");
  };
  const changeOwnerIdent = () => {
    setEditingOwner(false);
    if (owner === newOwner) return;
    if (!newOwner) return void clearOwnerIdent();
    changeMboxOwner(newOwner);
    updateNotification("Handle changed", CHANNEL);
  };
  const clearAllData = async () => {
    await logoutUser().finally(() => {
      clearParserModelCache();
      CookieStore.reset();
      localStorage.clear();
      window.location.reload();
    });
  };

  return (
    <form
      autoComplete="false"
      className="form--general-settings"
      onSubmit={(e) => {
        stop(e);
        changeOwnerIdent();
      }}
    >
      <fieldset>
        <legend>Callsign</legend>

        <section className="callsign--grid">
          <label
            className="inline--grid"
            onClick={() => changeColorIdentifier()}
            data-tooltip="Personalize the UI with a color of your choice."
          >
            <input
              type="color"
              className={editingOwner ? "beacon infinite" : undefined}
              ref={$picker}
              onBlur={finishColorEditing}
              onChange={changeColorIdentifier}
              value={colorIdent || stringToColor(owner) || "#07c"}
            />
          </label>

          <label>
            <span className="label">Display Name</span>
            <input
              placeholder="tango"
              type="text"
              value={newOwner}
              onChange={({ target }) => setNewOwner(target.value)}
              onBlur={() => changeOwnerIdent()}
              onFocus={() => setEditingOwner(true)}
            />
          </label>
        </section>

        <details>
          <summary>
            <span className="material-symbols-outlined">help</span>
            <span>
              What is my <span className="gold">Callsign</span>?
            </span>
          </summary>
          <div className="hint">
            <span className="gold">Your Callsign (or </span>"display name"{" "}
            <span className="gold">
              ) is how the AI identifies you in conversations.&nbsp;
            </span>
            You can change it to anything you like. If you are logged in,
            clearing this will revert to your account email.
          </div>
        </details>

        <button
          className="button--grid"
          type="button"
          onClick={clearOwnerIdent}
        >
          <span className="material-symbols-outlined">close</span>
          <span>Clear Callsign</span>
        </button>
      </fieldset>

      <fieldset>
        <legend>Active Conversation</legend>

        <details>
          <summary>
            <span className="material-symbols-outlined">help</span>
            <span>What is this?</span>
          </summary>

          <p className="hint">
            <span className="gold">
              This will clear your active conversation, along with any documents
              and associated text embeddings you have loaded into memory
            </span>
            . It <b>DOES NOT affect cloud data</b> (for logged-in account
            owners).
          </p>
        </details>

        <button className="button--grid" type="button" onClick={clearInbox}>
          <span className="material-symbols-outlined">close</span>
          <span>Clear memory</span>
        </button>
      </fieldset>

      <fieldset>
        <legend>Cached Models</legend>

        <details>
          <summary>
            <span className="material-symbols-outlined">help</span>
            <span>
              What is a <span className="gold">cached model</span>?
            </span>
          </summary>

          <p className="hint">
            <span className="gold">
              A cached model is any model you previously downloaded for offline
              work.
            </span>{" "}
            You can clear this without logging out or deleting your account, if
            you have one. This will not affect your other settings.
          </p>
        </details>

        <button
          className="button--grid"
          type="button"
          onClick={clearParserModelCache}
        >
          <span className="material-symbols-outlined">close</span>
          <span>Clear Model Cache</span>
        </button>
      </fieldset>

      <fieldset>
        <legend>Extreme Log out</legend>

        <details>
          <summary>
            <span className="material-symbols-outlined">help</span>
            <span>
              What is the <span className="gold">Extreme™ Log Out</span>?
            </span>
          </summary>

          <div className="hint">
            <p>
              <span className="gold">This will log you out, then clear:</span>
            </p>
            <ul>
              <li>Your cached display name</li>
              <li>Any API keys you stored in the browser for this app</li>
              <li>All downloaded models and anything you stashed in memory</li>
              <li className="gold">
                Anything else you put in the browser with this app!
              </li>
            </ul>
            <p>
              <span className="gold">
                This DOES NOT delete your account or cloud data
              </span>{" "}
              (for logged-in account owners).
            </p>
          </div>
        </details>

        <button
          type="button"
          className={`button--grid ${
            authenticated ? "bg--error dark" : ""
          }`.trim()}
          onClick={clearAllData}
        >
          <span className="material-symbols-outlined">
            {authenticated ? "power_settings_new" : "close"}
          </span>
          <span>{authenticated ? "Log out" : "Clear Browser"}</span>
        </button>
      </fieldset>
    </form>
  );
}
