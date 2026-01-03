import SearchBar from './SearchBar';
import UserActions from './UserActions';

interface HeaderProps {
    title: string;
    rightElement?: React.ReactNode;
    className?: string;
}

export default function Header({
    title,
    rightElement,
    className = ''
}: HeaderProps) {
    return (
        <header className={`flex items-center justify-between border-b border-white/5 px-8 py-4 bg-background-dark/95 backdrop-blur z-20 h-[72px] sticky top-0 ${className}`}>
            <div className="flex items-center gap-4 text-white">
                {/* Header Title */}
                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            </div>

            <div className="flex items-center gap-6">
                {rightElement && (
                    <div className="flex items-center">
                        {rightElement}
                    </div>
                )}
                {/* Global Search - Always visible */}
                <SearchBar />
                <UserActions />
            </div>
        </header>
    );
}
