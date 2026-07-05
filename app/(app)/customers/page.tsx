export const dynamic = "force-dynamic";

import TopBar from "@/components/TopBar";
export default function Page() {
  return (
    <>
      <TopBar title="Customers" subtitle="SUBCustomers" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-3">Coming Soon</p>
          <p className="text-slate-500 text-sm">This feature is planned for a future phase</p>
        </div>
      </main>
    </>
  );
}
