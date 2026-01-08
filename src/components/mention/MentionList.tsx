
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [users, setUsers] = useState<any[]>([]);

    const selectItem = (index: number) => {
        const item = props.items[index];

        if (item) {
            props.command({ id: item.id, label: item.full_name || item.email });
        }
    };

    const upHandler = () => {
        setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    return (
        <div className="bg-surface-card border border-border-main rounded-lg shadow-xl overflow-hidden min-w-[200px] p-1 z-[9999]">
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <button
                        key={index}
                        className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors
                ${index === selectedIndex ? 'bg-primary/20 text-white' : 'text-text-muted hover:bg-surface-highlight hover:text-text-main'}
            `}
                        onClick={() => selectItem(index)}
                    >
                        {item.avatar_url ? (
                            <img src={item.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                                {(item.full_name || item.email || '?')[0].toUpperCase()}
                            </div>
                        )}
                        <span className="truncate">{item.full_name || item.email}</span>
                    </button>
                ))
            ) : (
                <div className="px-3 py-2 text-sm text-text-muted">Nenhum usuário encontrado</div>
            )}
        </div>
    );
});
