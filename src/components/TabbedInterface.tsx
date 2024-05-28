import { ComponentPropsWithRef, useRef, useState } from "react";
import { noOp } from "utils/general";
import "./TabbedInterface.scss";

export type UITab = { label: string; iconClass?: string; icon: string };
type TabbedInterfaceProps = {
  tabs: UITab[];
  activeTab?: number;
  onChange?: { (i: number): void };
} & Omit<ComponentPropsWithRef<"div">, "onChange">;
type TabProps = {
  tabs: UITab[];
  activeTab?: number;
  onTabSelect?: (index: number) => void;
};

const TabMenu = (opts: TabProps) => {
  const { tabs, activeTab = 0, onTabSelect = noOp } = opts;
  const c = (i: number) => `tab grid ${i === activeTab ? "active" : ""}`.trim();
  return (
    <menu className="tabbed-interface__tabs grid hide-scrollbar" role="menu">
      {tabs.map((tab, index) => (
        <span
          key={index}
          className={c(index)}
          role="menuitem"
          onClick={() => onTabSelect(index)}
        >
          <span className={`icon material-symbols-outlined ${tab.iconClass}`}>
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </span>
      ))}
    </menu>
  );
};

/** @Component A container that renders a group of navigation tabs above it. */
const TabbedInterface = (props: TabbedInterfaceProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    activeTab: active = 0,
    children,
    tabs,
    onChange = noOp,
    className,
    ...rest
  } = props;
  const [activeTab, setActiveTab] = useState(active);
  const truthyChildren = Array.isArray(children)
    ? children.filter(Boolean)
    : [children];
  let cName = "tabbed-interface tabbed-interface__container";
  cName = `${cName} ${className || ""}`.trim();
  const fallback = (
    <div className="wide card">
      <em>No items to display</em>
    </div>
  );
  const scrollIntoView = () => {
    if (!ref.current) return;
    const top = ref.current.getBoundingClientRect().top;
    if (top > 0) return;
    // scroll into view only if the element is not visible
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className={cName} {...rest} ref={ref}>
      {tabs.length > 0 && (
        <TabMenu
          tabs={tabs}
          activeTab={activeTab}
          onTabSelect={(t) => {
            scrollIntoView();
            setActiveTab(t);
            onChange(t);
          }}
        />
      )}
      <section className="tabbed-interface__content">
        {truthyChildren[activeTab] || fallback}
      </section>
    </section>
  );
};

export default TabbedInterface;
