import { ComponentPropsWithRef } from "react";
import "./ListViewItem.scss";

type ContainerProps = ComponentPropsWithRef<"div">;

/** Three-column grid container */
const ListViewItem = (props: ContainerProps) => {
  const { className = "", ...rest } = props;
  const classList = [className, "list-item", "list-item--grid"]
    .join(" ")
    .trim();
  return <section className={classList} {...rest} />;
};

export default ListViewItem;

/** Slightly-bold item title */
export const ListViewItemTitle = (props: ContainerProps) => {
  const { className = "", ...rest } = props;
  const classList = ["list-item__title", className].join(" ").trim();
  return <div className={classList} {...rest} />;
};

/** Item Description section (middle column) */
export const ListViewItemContent = (props: ContainerProps) => {
  const { className = "", ...rest } = props;
  const classList = ["list-item__content", className].join(" ").trim();
  return <div className={classList} {...rest} />;
};
