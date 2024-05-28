import { FormEvent, useEffect, useState } from "react";
import { notificationChannel, noOp, suppressEvent } from "utils/general";
import { updateAsWarning, CHANNELS } from "state/notifications";
import { setDialogImage } from "state/modal";
import { LS_FORM_SAVE_KEY } from "utils/strings";

/** Standardized props for any form that uses this value */
export type FormProps<T = Record<string, any>> = {
  /** When true, page reloads will not retain any data */
  autosave?: boolean;
  /**
   * When true, handler will set an internal state that allows you to
   * show a password input field to the user before submitting the form.
   * Be sure to append the data from the input before you submit!
   */
  requirePasswordOnSubmit?: boolean;
  onSubmit?: (data: T, imageData?: File | null) => void;
  onChange?: (data: T) => void;
  onImageFile?: (data?: File | null) => void;
};

const CHANNEL = CHANNELS.WARNING + notificationChannel("GlobalFormHandler");

/**
 * @Hook Shared form data handler. Provides the following:
 * * Form data management
 * * Optional autosave behavior (linked to previewing images when editing form content)
 * * A `submit` handler for passing data to parent components
 * @param empty The initial form data
 * @param props Form event handlers
 * @param props.onSubmit Form submission handler
 * @param props.onChange Form change handler
 * @param props.disableAutosave When true, page reloads will not retain any data
 * @param props.requirePasswordOnSubmit When true, handler will set an internal state that allows you to
 * show a password input field to the user before submitting the form. Be sure to append the data from the input before you submit!
 * @returns Form data and event handlers
 */
export default function useFormHandler<T>(empty: T, props: FormProps<T>) {
  if (Array.isArray(empty))
    throw new Error("Initial form data must not be an array.");

  const { onSubmit = noOp, onChange = noOp, autosave = false } = props;
  const [data, setData] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordEntry, setEnterPassword] = useState(false);
  const [dumped, setDumped] = useState(
    Boolean(localStorage.getItem(LS_FORM_SAVE_KEY))
  );
  const [changed, setChanged] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imageData, setImgData] = useState<File | null>(null);

  // Form change handler; optionally syncs form data to local storage before notifying parent
  const onUpdate = (d: T | Partial<T>, initialLoad = false) => {
    const listUpdate = Array.isArray(d);
    let next: any = d;
    // Attempt to merge previous state with update if "state" is not an array
    if (!listUpdate && typeof d === "object") next = { ...data, ...d };
    const didChange =
      !initialLoad && JSON.stringify(next) !== JSON.stringify(data);
    // If the user enabled auto-save, sync the form data to local storage
    const willDump = didChange && autosave;
    if (willDump) localStorage.setItem(LS_FORM_SAVE_KEY, JSON.stringify(d));
    setChanged(didChange);
    setData(next);
    onChange(next);
  };

  // Tell the parent component to show a password input field
  const requirePassword = () =>
    props.requirePasswordOnSubmit ? setEnterPassword(true) : noOp();
  const cancelPasswordEntry = () => {
    if (!props.requirePasswordOnSubmit) return;
    if (submitting) setSubmitting(false);
    setEnterPassword(false);
  };

  // Reset form state to the current data
  const setNewFormState = () => {
    setChanged(false);
    setSubmitted(false);
    setSubmitting(false);
  };

  // Form submission handler
  const onImageFile = (e?: File | null) => {
    setChanged(true);
    setImgData(e || null);
    props.onImageFile?.(e);
  };

  const completeSubmit = () => {
    // copy the image data to the form data if the data is an object
    onSubmit(data, imageData);
    setSubmitted(true);
    setEnterPassword(false);
    return setSubmitting(false);
  };

  // Form submission handler
  const handleSubmit = (e?: FormEvent) => {
    if (e) suppressEvent(e);
    setSubmitting(true);
    if (props.requirePasswordOnSubmit) return requirePassword();
    completeSubmit();
  };

  // Form submission handler when password is required. This is a separate handler:
  // ensure the password has been appended as `authorization` to the form data before submitting.
  const handleSuperUserSubmit = (e?: FormEvent) => {
    if (e) suppressEvent(e);
    setSubmitting(true);
    return completeSubmit();
  };

  // Some forms allow image uploading or generation. Users want to preview their image before
  // committing to it. This handler allows them to do that and return to editing their form.
  const guardImageSelect = (url: string) => {
    // Warn the user if they haven't submitted the form yet
    const img = (data as any).image;
    if (!img) {
      const e =
        "Can't preview a local file from a modal! Please upload it first";
      return void updateAsWarning(e, CHANNEL);
    }

    if (props.autosave) {
      // warn if the user has unsaved form data
      localStorage.setItem(LS_FORM_SAVE_KEY, JSON.stringify(data));
      updateAsWarning("Unsaved changes have been stashed.", CHANNEL, false);
      setDumped(true);
    }
    setDialogImage(url);
  };

  useEffect(() => {
    // Notify with initial data IF there is no local storage dump detected.
    // Otherwise give the user a chance to reload the page and keep their changes.
    // That way, they can track down the relevant form and save it.
    if (dumped && localStorage.getItem(LS_FORM_SAVE_KEY) && props.autosave) {
      let e = "Unsaved data detected: if this isn't the right form,";
      e = `${e} please RELOAD the page to preserve the data until you can save it.`;
      updateAsWarning(e, CHANNEL + 9, false);
      setData(data);
      onChange(data);
    } else onUpdate(data, true);
  }, []);

  return {
    /** Form has changed since the user loaded it */
    changed,
    /** Form has been submitted */
    submitted,
    /** submission status */
    submitting,
    /** Form data */
    data,
    /** Data change handler */
    onUpdate,
    /** Form submission event handler */
    onSubmit: handleSubmit,
    /** Form submission event handler (when password-entry required) */
    onSuperUserSubmit: handleSuperUserSubmit,
    /** Dump form data to local storage before accidental exit */
    guardImageSelect,
    /** Image data */
    onImageFile,
    /** Specify that current data is new 'unchanged' state */
    setNewFormState,
    /** Toggle a state-boolean for showing a modal in a form */
    requirePassword,
    /** Toggle a state-boolean for showing a modal in a form */
    cancelPasswordEntry,
    /** A state-boolean for showing a modal in a form */
    showPasswordEntry
  };
}

export function warnDataOverride() {
  let warnOverride = "Detected unsaved data from a different form!";
  warnOverride += " The data will be lost if you edit this form.";
  updateAsWarning(warnOverride, CHANNEL);
}
