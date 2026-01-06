import { ReactNodeViewRenderer } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import { ResizableImageComponent } from './ResizableImageComponent';

export const ResizableImageExtension = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                renderHTML: attributes => {
                    if (!attributes.width) {
                        return {};
                    }
                    return {
                        width: attributes.width,
                        style: `width: ${attributes.width}px; max-width: 100%; height: auto;`,
                    };
                },
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageComponent);
    },
});
