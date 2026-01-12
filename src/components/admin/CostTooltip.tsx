import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface CostTooltipProps {
    totalCost: number;
    userCount: number;
    userCost: number;
    storageMB: number;
    storageCost: number;
}

export default function CostTooltip({ totalCost, userCount, userCost, storageMB, storageCost }: CostTooltipProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (isHovered && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top - 10,
                left: rect.right - 256 // 256px = w-64
            });
        }
    }, [isHovered]);

    return (
        <>
            <span
                ref={triggerRef}
                className="cursor-help"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                R$ {totalCost.toFixed(2)}
            </span>
            {isHovered && createPortal(
                <div
                    className="fixed w-64 pointer-events-none"
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        zIndex: 99999,
                        transform: 'translateY(-100%)'
                    }}
                >
                    <div className="bg-surface-panel border border-primary/30 rounded-xl p-3 shadow-2xl pointer-events-auto">
                        <div className="text-[10px] font-bold uppercase text-text-subtle tracking-wider mb-2">Decomposição de Custos</div>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Usuários ({userCount} × R$ 0,50)</span>
                                <span className="font-bold text-white">R$ {userCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Storage ({(storageMB / 1024).toFixed(2)}GB × R$ 0,50)</span>
                                <span className="font-bold text-white">R$ {storageCost.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-white/10 pt-1.5 mt-1.5 flex justify-between items-center">
                                <span className="text-primary font-bold">Total</span>
                                <span className="font-bold text-primary">R$ {totalCost.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
