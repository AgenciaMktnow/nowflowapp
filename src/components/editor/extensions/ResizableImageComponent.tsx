import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import React, { useRef, useState } from 'react';

export const ResizableImageComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
    const [resizing, setResizing] = useState(false);

    // Refs for drag state (prevents re-renders)
    const dragStartRef = useRef({ x: 0, width: 0 });
    const imageRef = useRef<HTMLImageElement>(null);

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!imageRef.current) return;

        const { width } = imageRef.current.getBoundingClientRect();

        setResizing(true);
        // Store initial state
        dragStartRef.current = {
            x: e.clientX,
            width: width
        };

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!imageRef.current) return;

            const dx = moveEvent.clientX - dragStartRef.current.x;
            const newWidth = Math.max(100, Math.min(dragStartRef.current.width + dx, 2000));

            // Direct DOM manipulation for smooth 60fps performance
            // We bypass React state updates during the drag to prevent lag
            imageRef.current.style.width = `${newWidth}px`;
        };

        const onMouseUp = () => {
            setResizing(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // Commit the final width to Tiptap attributes
            if (imageRef.current) {
                const finalWidth = parseInt(imageRef.current.style.width, 10);
                if (!isNaN(finalWidth)) {
                    updateAttributes({ width: finalWidth });
                }
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <NodeViewWrapper className="image-component relative inline-block leading-none" style={{ display: 'inline-block' }}>
            <img
                ref={imageRef}
                src={node.attrs.src}
                alt={node.attrs.alt}
                title={node.attrs.title}
                width={node.attrs.width}
                className={`${selected || resizing ? 'ProseMirror-selectednode' : ''}`}
                style={{
                    // Use attribute width if set, otherwise auto
                    width: node.attrs.width ? `${node.attrs.width}px` : 'auto',
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain', // Prevent distortion
                    transition: 'none',   // Ensure no CSS transition causes lag
                    pointerEvents: resizing ? 'none' : 'auto' // Prevent ghost dragging
                }}
            />

            {(selected || resizing) && (
                <>
                    {/* Corner Handles - Simplified to trigger generic width resize */}
                    <div
                        className="image-resizer image-resizer-se"
                        style={{
                            position: 'absolute',
                            bottom: -6,
                            right: -6,
                            cursor: 'ew-resize',
                            zIndex: 50
                        }}
                        onMouseDown={onMouseDown}
                    />
                    <div
                        className="image-resizer image-resizer-sw"
                        style={{
                            position: 'absolute',
                            bottom: -6,
                            left: -6,
                            cursor: 'ew-resize',
                            zIndex: 50
                        }}
                        onMouseDown={onMouseDown}
                    />
                    <div
                        className="image-resizer image-resizer-nw"
                        style={{
                            position: 'absolute',
                            top: -6,
                            left: -6,
                            cursor: 'ew-resize',
                            zIndex: 50
                        }}
                        onMouseDown={onMouseDown}
                    />
                    <div
                        className="image-resizer image-resizer-ne"
                        style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            cursor: 'ew-resize',
                            zIndex: 50
                        }}
                        onMouseDown={onMouseDown}
                    />
                </>
            )}
        </NodeViewWrapper>
    );
};
