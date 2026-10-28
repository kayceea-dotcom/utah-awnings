import Sidebar from "@/components/Sidebar";
import InstallerGuard from "@/components/InstallerGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <InstallerGuard />
      {/* Desktop: offset for fixed sidebar. Mobile: offset for fixed top bar */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60 pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
