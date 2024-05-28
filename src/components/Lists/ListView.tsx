import { ComponentPropsWithRef, Fragment, ReactNode } from "react";
import "./ListView.scss";

type ListViewSize = "sm" | "md" | "lg";
type StyledListProps = { row?: boolean; grid?: boolean };

export type ListViewProps<T> = {
  data: T[];
  /** Optional text to show when empty */
  placeholder?: any;
  /** Fixed-size list (scroll between first and last items) */
  size?: ListViewSize;
  /** Dummy first item (e.g. "add new item" button) */
  dummyFirstItem?: ReactNode;
  /** Dummy last item (e.g. "add new item" button) */
  dummyLastItem?: ReactNode;
  itemText: (d: T, i: number) => ReactNode;
  itemKey?: (d: T, i: number) => string | number;
} & StyledListProps &
  Omit<ComponentPropsWithRef<"div">, "placeholder">;

/**
 * @Component Generalized `ListView` renders a vertical/horizontal list (or grid) of items
 */
export default function ListView<T = any>(
  props: ListViewProps<T>
): JSX.Element {
  const {
    data,
    itemText,
    itemKey = (_d: T, i: number) => i,
    grid = false,
    placeholder,
    dummyFirstItem,
    dummyLastItem,
    row,
    className: cName,
    ...rest
  } = props;
  let className = `list-view ${cName || ""}`.trim();
  if (row) className = `${className} list-view--row`.trim();
  if (grid) {
    className = `${className} list-view--grid`.trim();
    if (data.length >= 3) className = `${className} list-view--center`.trim();
  }

  const children = data.map((item: any, i: number) => (
    <Fragment key={itemKey(item, i)}>{itemText(item, i)}</Fragment>
  ));

  return (
    <section className={className} role="list" {...rest}>
      {/* Dummy first item (e.g. "add new item" button) */}
      {dummyFirstItem && (
        <>
          {dummyFirstItem}
          {!grid && <hr />}
        </>
      )}

      {/* Placeholder for empty list (if supplied) */}
      {!data.length && placeholder && placeholder}

      {/* List items */}
      {data.length > 0 && children}

      {/* Dummy last item (e.g. "add new item" button) */}
      {dummyLastItem && (
        <>
          {!grid && <hr />}
          {dummyLastItem}
        </>
      )}
    </section>
  );
}
