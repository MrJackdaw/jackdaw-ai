import { cloudDataFetch } from "data/requests.shared";
import { useEffect, useState } from "react";
import ListView from "./ListView";

type Props = { projectId: number };
type DocMetadata = { data: { document_name: string; project_id: number }[] };
let fetching = false;

const UserDocumentsList = ({ projectId }: Props) => {
  const [docs, setDocs] = useState<DocMetadata["data"]>([]);
  const fetchDocs = async () => {
    fetching = true;
    const opts = { projectId };
    const action = "user-projects:list-documents";
    const { data } = await cloudDataFetch<DocMetadata>(action, opts);
    fetching = false;
    setDocs(data);
  };

  useEffect(() => {
    if (fetching) return;
    if (projectId) fetchDocs();
  }, []);

  return <ListView data={docs} itemText={(d) => <p>{d.document_name}</p>} />;
};

export default UserDocumentsList;
