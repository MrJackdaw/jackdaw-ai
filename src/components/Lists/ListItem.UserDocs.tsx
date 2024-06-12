import ListViewItem, {
  ListViewItemContent,
  ListViewItemTitle
} from "./ListViewItem";

const UserDocumentListItem = ({ name }: { name: string }) => {
  return (
    <ListViewItem>
      <span className="list-item__icon-column material-symbols-outlined">
        text_snippet
      </span>
      <ListViewItemContent>
        <ListViewItemTitle>{name}</ListViewItemTitle>
      </ListViewItemContent>
    </ListViewItem>
  );
};

export default UserDocumentListItem;
