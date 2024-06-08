import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TabbedInterface from "components/TabbedInterface";
import GeneralSettingsForm from "components/Forms/Form.GeneralSettings";
import useUser from "hooks/useUser";
import { suppressEvent, toSnakeCase } from "utils/general";
import { clearModal } from "state/modal";
import FullscreenLoader from "components/FullscreenLoader";
import usePreserveRouteHistory from "hooks/usePreserveRouteHistory";
import AssistantSettingsForm from "components/Forms/Form.AssistantSettings";
import ManageVectorStorageFields from "components/Fieldsets/Fields.ManageVectorStorage";
import "./Route.Settings.scss";
import StripePricingTable from "components/StripePricingTable";
import LoginView from "components/View.Login";

/** User Settings Route */
const SettingsRoute = () => {
  const { settingsView } = useParams<{ settingsView: string }>();
  const { authenticated, initialized } = useUser([
    "authenticated",
    "initialized"
  ]);
  const tabs = useMemo(() => {
    return [
      { label: "General Settings", icon: "security" },
      { label: "Assistant Settings", icon: "psychology" },
      { label: "Online Settings", icon: "wifi" },
      { label: "Manage Subscriptions", icon: "credit_card" }
    ];
  }, [authenticated]);
  const activeTab = useMemo(() => {
    if (!settingsView) return 0;
    return tabs.findIndex(({ label }) => toSnakeCase(label) === settingsView);
  }, [settingsView]);
  const nav = useNavigate();
  const updateURL = (tab: number) => {
    const urls = tabs.map(({ label }) => `/settings/${toSnakeCase(label)}`);
    const url = urls[tab] || urls[0];
    nav(url, { replace: true, preventScrollReset: true });
    clearModal();
  };

  usePreserveRouteHistory();

  useEffect(() => {
    if (!settingsView) updateURL(0);
  }, [settingsView]);

  return (
    <section className="route route--settings">
      <header>
        <h1 className="h4">My Settings</h1>
      </header>

      {initialized ? (
        <TabbedInterface
          key={activeTab}
          activeTab={activeTab}
          onChange={updateURL}
          tabs={tabs}
        >
          <GeneralSettingsForm />

          <AssistantSettingsForm />

          <form onSubmit={suppressEvent}>
            <ManageVectorStorageFields saveImmediately />
          </form>

          {authenticated ? <StripePricingTable /> : <LoginView />}
        </TabbedInterface>
      ) : (
        <FullscreenLoader msg="Just a moment..." />
      )}
    </section>
  );
};

export default SettingsRoute;
