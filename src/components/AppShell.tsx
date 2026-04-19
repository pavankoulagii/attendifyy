import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppShell() {
  return (
    <div className="min-h-screen mx-auto max-w-md relative pb-28">
      <Outlet />
      <BottomNav />
    </div>
  );
}
