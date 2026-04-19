import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";

export default function AppShell() {
  return (
    <div className="min-h-screen mx-auto max-w-md relative pb-32 surface-bright">
      <TopBar />
      <Outlet />
      <BottomNav />
    </div>
  );
}
