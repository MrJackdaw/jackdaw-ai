import { useState, FormEventHandler, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  notificationChannel,
  stringToColor,
  updateUserSettings
} from "utils/general";
import CookieStore from "utils/cookie-store";
import { sendParserMessage, changeMboxOwner, clearParser } from "mbox/Mbox";
import { logoutUser } from "data/requests";
import { updateNotification } from "state/notifications";
import { SettingsStore } from "state/settings-store";
import useSettings from "hooks/useSettings";
import ManageVectorStorageFields from "components/Fieldsets/Fields.ManageVectorStorage";
import "./Form.GeneralSettings.scss";
import useUser from "hooks/useUser";

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
    sendParserMessage("Mbox.clearEmails");
    setTimeout(() => navigate("/"));
  };
  const clearOwnerIdent = () => {
    changeMboxOwner();
    setNewOwner("");
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
      clearParser();
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
            <span>What is this?</span>
          </summary>
          <div className="hint">
            <span className="gold">
              This is how the AI will identify you during conversations
            </span>
            , or from the data you provide. It may work a little harder to guess
            who you are without it.&nbsp;
            <span className="gold">
              You can safely clear this handle without logging out
            </span>{" "}
            (if you have an account and are logged in).
          </div>
        </details>

        <button
          className="button--grid"
          type="button"
          onClick={clearOwnerIdent}
        >
          <span className="material-symbols-outlined">close</span>
          <span>Clear Identifier</span>
        </button>
      </fieldset>

      <ManageVectorStorageFields saveImmediately />

      <fieldset>
        <legend>In-memory Data</legend>

        <details>
          <summary>
            <span className="material-symbols-outlined">help</span>
            <span>Clear Memory</span>
          </summary>

          <p className="hint">
            <span className="gold">
              This will clear any documents you have loaded into memory
            </span>
            , along with any text embeddings that were generated for them. The
            action <span className="gold">DOES NOT affect your cloud data</span>{" "}
            (if you have an account and are logged in).
          </p>
        </details>

        <button className="button--grid" type="button" onClick={clearInbox}>
          <span className="material-symbols-outlined">close</span>
          <span>Clear memory</span>
        </button>
      </fieldset>

      <fieldset>
        <legend>Browser Data</legend>

        <details>
          <summary>
            <span className="material-symbols-outlined">help</span>
            <span>Clear Browser data</span>
          </summary>

          <div className="hint">
            <p>
              <span className="gold">
                LOGS OUT, <em>and then</em>
              </span>{" "}
              wipes:
            </p>
            <ul>
              <li>Your display name</li>
              <li>Any API keys you stored in the browser for this app</li>
              <li>Anything else you put in the browser with this app</li>
            </ul>
            <p>
              This action{" "}
              <span className="gold">DOES NOT delete your account</span> (if you
              have one), or any cloud data (if you have created any).
            </p>
          </div>
        </details>

        <button
          type="button"
          className={`button--grid ${authenticated ? "bg--error" : ""}`.trim()}
          onClick={clearAllData}
        >
          <span className="material-symbols-outlined">
            {authenticated ? "power_settings_new" : "close"}
          </span>
          <span>{authenticated ? "Log out" : "Clear Everything"}</span>
        </button>
      </fieldset>
    </form>
  );
}
