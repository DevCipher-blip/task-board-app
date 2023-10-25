import { useState } from "react";
import Modal from "react-modal";
import { LANES } from "../Pages/lanes";

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;

/**
 * Create or edit form. `card` is null when creating. `onSubmit` returns a
 * promise; the dialog stays open with the typed input if it rejects.
 */
export const CardDialog = ({ isOpen, card, onSubmit, onClose }) => {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [status, setStatus] = useState(card?.status ?? "todo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const heading = card ? "Edit card" : "New card";

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({ title: title.trim(), description, status });
    } catch (submitError) {
      setError(submitError.message || "The card could not be saved.");
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel={heading}
      className="dialog"
      overlayClassName="dialog-backdrop"
    >
      <form onSubmit={submit} noValidate>
        <h2 className="dialog-title">{heading}</h2>
        <label htmlFor="card-title">Title</label>
        <input
          id="card-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          required
          autoFocus
        />
        <label htmlFor="card-description">Description</label>
        <textarea
          id="card-description"
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
        />
        {!card && (
          <>
            <label htmlFor="card-status">Lane</label>
            <select id="card-status" value={status} onChange={(event) => setStatus(event.target.value)}>
              {LANES.map((lane) => (
                <option key={lane.id} value={lane.id}>
                  {lane.title}
                </option>
              ))}
            </select>
          </>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button button-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button" disabled={!title.trim() || saving}>
            {saving ? "Saving…" : card ? "Save changes" : "Add card"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
