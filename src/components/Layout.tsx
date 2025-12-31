import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="flex h-screen w-full bg-background-dark text-white font-display overflow-hidden print:h-auto print:overflow-visible">
            <div className="print:hidden h-full flex-shrink-0">
                <Sidebar />
            </div>
            <main className="flex-1 flex flex-col h-full overflow-hidden relative print:overflow-visible print:h-auto">
                <Outlet />
            </main>
        </div>
    );
}
