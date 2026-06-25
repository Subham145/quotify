import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="w-full p-4 md:p-6">
        <TopHeader />
        <Outlet />
      </main>
    </div>
  );
}
