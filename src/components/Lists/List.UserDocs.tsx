import { cloudDataFetch } from "data/requests.shared";
import { useEffect, useState } from "react";
import ListView from "./ListView";
import UserDocumentListItem from "./ListItem.UserDocs";

type Props = { projectId: number };
type DocMetadata = { data: { document_name: string; project_id: number }[] };
let init = false;

const UserDocumentsList = ({ projectId }: Props) => {
  const [docs, setDocs] = useState<DocMetadata["data"]>([]);
  const fetchDocs = async () => {
    if (init) return;
    init = true;
    const opts = { projectId };
    const action = "user-projects:list-documents";
    const { data } = await cloudDataFetch<DocMetadata>(action, opts);
    setDocs(data);
  };

  useEffect(() => {
    if (projectId) fetchDocs();
  }, []);

  return (
    <ListView
      className="centered"
      data-medium
      data={docs}
      dummyFirstItem={
        <p className="hint">
          A list of unique documents you have embedded in the active project.
        </p>
      }
      itemText={(d) => <UserDocumentListItem name={d.document_name} />}
    />
  );
};

export default UserDocumentsList;
