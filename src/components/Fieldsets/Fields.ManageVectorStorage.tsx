import { useMemo } from "react";
import useUser from "hooks/useUser";
import Slider from "../Forms/Slider";
import { toggleOnlineVectorStore } from "state/settings-store";
import useSettings from "hooks/useSettings";

type MVSFProps = { disabled?: boolean; saveImmediately?: boolean };

export default function ManageVectorStorageFields(props: MVSFProps) {
  const { authenticated, initialized } = useUser([
    "authenticated",
    "initialized"
  ]);
  const { enableCloudStorage } = useSettings(["enableCloudStorage"]);
  const [sliderHint, addendum] = useMemo(() => {
    return enableCloudStorage
      ? [
          "your active Project in a cloud database",
          [
            "Access is restricted to you and anyone you allow.",
            "You also have access to more hosted Language Models through our API."
          ].join(" ")
        ]
      : [
          "your device memory",
          "(Note that performance may degrade with larger files.)"
        ];
  }, [enableCloudStorage]);
  const onSelectionChange = () => toggleOnlineVectorStore(); /* updates worker*/
  const disabled = useMemo(
    () => props.disabled || !initialized || !authenticated,
    [initialized, authenticated]
  );

  const $label = (
    <span>
      Store Documents online (
      <b className={enableCloudStorage ? "gold" : undefined}>
        {enableCloudStorage ? "enabled" : "disabled"}
      </b>
      )
    </span>
  );

  return (
    <fieldset className="fields--vector-storage">
      <legend>Cloud Data</legend>

      <Slider
        disabled={disabled}
        checked={enableCloudStorage}
        onChange={onSelectionChange}
        label={$label}
        hint={!authenticated && "(Create account or log in to enable)"}
      />

      <details>
        <summary>
          <span className="material-symbols-outlined">help</span>
          <span>What is this?</span>
        </summary>
        <div className="hint">
          <p>
            <span className="gold">
              This determines what online features you can access.
            </span>{" "}
            Currently, when you upload a document,{" "}
            <span className="gold">
              it is broken up and saved to {sliderHint}
            </span>
            . {addendum}
          </p>
          <p>
            <b>Note:</b>{" "}
            <span className="gold">
              you can still chat with online providers like OpenAI using your
              private API key.
            </span>
          </p>
          {!authenticated && (
            <p>
              <em className="grey">
                (Create an account to access cloud features.)
              </em>
            </p>
          )}
        </div>
      </details>
    </fieldset>
  );
}
