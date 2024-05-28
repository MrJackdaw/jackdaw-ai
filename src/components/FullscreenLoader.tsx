import { ReactNode } from "react";
import "./FullscreenLoader.scss";

type FLProps = {
  msg?: ReactNode;
  fullscreen?: boolean;
};

/** @Component Fullscreen loader component */
const FullscreenLoader = (props: FLProps) => {
  const { msg = "Please wait while the app loads...", fullscreen = false } =
    props;
  return (
    <section className="fullscreen-loader" data-fullscreen={fullscreen}>
      <div className="flex spinner--before content">{msg}</div>
    </section>
  );
};

export default FullscreenLoader;
