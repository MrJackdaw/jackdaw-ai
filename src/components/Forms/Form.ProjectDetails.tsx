import { useState } from "react";
import { cloudDataFetch } from "data/requests.shared";
import { cacheProject, deleteCachedProject } from "indexedDB";
import { ProjectsStore } from "state/user-projects";
import useFormHandler from "hooks/useFormHandler";
import { UserProject, stringToNumber } from "utils/general";
import { LS_USE_CLOUD_STORE } from "utils/strings";
import { updateAsError } from "state/notifications";
import { refreshProjectsCache } from "data/requests.projects";
import { clearModal } from "state/modal";
import "./Form.ProjectDetails.scss";

type ProjectFormData = { name: string; description: string; id?: number };
const resetForm = (): ProjectFormData => {
  const { editingProject } = ProjectsStore.getState();
  const $form: ProjectFormData = { name: "New Project", description: "" };
  if (editingProject) {
    $form.name = editingProject.project_name;
    $form.description = editingProject.description;
    if (editingProject.id) $form.id = editingProject.id;
  }

  return $form;
};

/** @Form Create a new Project for grouping documents */
const ProjectDetailsForm = () => {
  const [creating, setCreating] = useState(false);
  const { onSubmit, onUpdate } = useFormHandler(resetForm(), {
    async onSubmit(formData) {
      if (creating || !formData.name) return;
      setCreating(true);

      // cache data for displaying in UI
      const done = () => {
        refreshProjectsCache();
        setCreating(false);
        clearModal();
      };
      const { name, description, id } = formData;
      const tempKey = `__DRAFT__${stringToNumber(name)}`;
      cacheProject(tempKey, {
        id,
        project_name: name,
        description,
        __cacheKey: tempKey
      });

      // save-to-server if cloud-data is enabled
      if (!localStorage.getItem(LS_USE_CLOUD_STORE)) {
        return done();
      }

      type Insert = { data: UserProject; error?: string };
      const action = "user-projects:insert";
      await cloudDataFetch<Insert>(action, { id, name, description })
        .then(({ error }) => {
          if (error) return void updateAsError(error);
          return deleteCachedProject(tempKey);
        })
        .finally(done);
    }
  });

  return (
    <form className="form--project-details" onSubmit={onSubmit}>
      <label>
        <span className="label">Project Name</span>
        <input
          name="project-name"
          onChange={({ target }) => onUpdate({ name: target.value.trim() })}
          placeholder="Project name"
          maxLength={255}
        />
      </label>

      <label>
        <span className="label">Description</span>
        <input
          name="project-desc"
          onChange={({ target }) =>
            onUpdate({ description: target.value.trim() })
          }
          placeholder="(Optional) Short description"
          maxLength={255}
        />
      </label>

      <details>
        <summary>
          <span className="material-symbols-outlined">help</span>
          <span>What is this?</span>
        </summary>

        <div className="hint">
          <span className="gold">
            A Project is a way to group your private documents.
          </span>{" "}
          You can use them to curate knowledge-bases for your Virtual Assistant.{" "}
          <span className="gold">
            You can share a project (or some of its documents) with other
            platform users.
          </span>
        </div>
      </details>

      <hr />

      <button disabled={creating} className="centered button--grid">
        <span className="material-symbols-outlined">save</span>
        <span>Create Project</span>
      </button>

      {creating && (
        <p className="hint centered center spinner--before">Processing...</p>
      )}
      <input type="submit" hidden />
    </form>
  );
};

export default ProjectDetailsForm;
