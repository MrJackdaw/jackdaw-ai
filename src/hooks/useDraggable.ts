import { DragEventHandler, HTMLAttributes, useMemo, useState } from "react";
import { noOp, suppressEvent } from "utils/general";

type DraggableProps<T> = {
  /** HTML attribute (passed to elem). Use `allowDrag` to enable/disable drag-drop */
  draggable?: HTMLAttributes<HTMLElement>["draggable"];
  /** Data to pass when dropped on target */
  dragData?: T;
  /** Enables drag state-change when true */
  allowDrag?: boolean;
  /** Callback when data is received from a drop */
  onDrop?: (d: T) => void;
};

type DragHandlers = Pick<
  HTMLAttributes<HTMLElement>,
  | "className"
  | "draggable"
  | "onDragStart"
  | "onDragEnd"
  | "onDragOver"
  | "onDrag"
  | "onDrop"
  | "onDragLeave"
  | "onDragEnter"
  | "onMouseEnter"
  | "onMouseLeave"
>;

const requireDraggable = (fn: DragEventHandler, props: DraggableProps<any>) => {
  if (!props.draggable) return noOp;
  return ["true", true, 1].includes(props.draggable) ? fn : noOp;
};

/** @Hook Grouped handlers for `HTMLElement` drag events. Touch events are NOT supported. */
export default function useDraggable<T = any>(props: DraggableProps<T> = {}) {
  const { draggable = "false", onDrop = noOp } = props;
  const [dragging, setDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);
  const startDraggable = () => props.allowDrag && setIsDraggable(true);
  const stopDraggable = () => props.allowDrag && setIsDraggable(false);
  const haltAndCancelDrop: DragEventHandler = (e) => {
    suppressEvent(e);
    setDropTarget(false);
  };
  // Start drag event
  const startDrag = requireDraggable((e) => {
    setDragging(true);
    e.nativeEvent.dataTransfer?.setData(
      "text/plain",
      JSON.stringify(props.dragData || {})
    );
  }, props);
  // Cleanup
  const endDrag = requireDraggable((e) => {
    haltAndCancelDrop(e);
    setDragging(false);
    e.nativeEvent.dataTransfer?.clearData("text/plain");
  }, props);
  // Handle drag event (ignored since DOM elements are not moved)
  const handleDrag = requireDraggable(noOp, props);
  const handleDrop = requireDraggable((e) => {
    haltAndCancelDrop(e);
    const ev = e.nativeEvent;
    if (!ev.dataTransfer) return;

    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      [...(ev.dataTransfer.items ?? [])].forEach((item) => {
        // If dropped items aren't files, reject them
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) return void onDrop(file as any);
        }
      });
    } else {
      // Use DataTransfer interface to access the file(s)
      [...(ev.dataTransfer.files ?? [])].forEach((file) => {
        if (file) return void onDrop(file as any);
      });
    }

    const dragData = ev.dataTransfer.getData("text/plain") || null;
    if (dragData) onDrop(JSON.parse(dragData));
  }, props);
  const cancelDrop = requireDraggable(haltAndCancelDrop, props);
  const prepDrop = requireDraggable((e: any) => {
    suppressEvent(e);
    setDropTarget(true);
  }, props);
  const draggableIcon = useMemo(() => {
    return isDraggable ? "drag_handle" : undefined;
  }, [isDraggable]);

  const draggableClass = draggable === "true" ? "draggable" : "";
  const draggingClass = dragging ? "dragging" : draggableClass;
  const componentProps: DragHandlers = {
    className: dropTarget ? "drop-target" : draggingClass,
    draggable,
    onDragStart: startDrag,
    onDragEnd: endDrag,
    onDragOver: prepDrop,
    onDrag: handleDrag,
    onDrop: handleDrop,
    onDragLeave: cancelDrop,
    onDragEnter: prepDrop,
    // hover moves
    onMouseEnter: startDraggable,
    onMouseLeave: stopDraggable
  };

  return { dragging, draggableIcon, ...componentProps };
}
