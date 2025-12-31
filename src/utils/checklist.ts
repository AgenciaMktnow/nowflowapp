
export const extractChecklistFromHtml = (htmlContent: string) => {
    if (!htmlContent) return { total: 0, completed: 0 };

    // Pattern to find standard list items or checked items
    // This is a basic approximation since tiptap/html structure varies
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    let total = 0;
    let completed = 0;

    // Look for task lists (ul[data-type="taskList"])
    const taskLists = doc.querySelectorAll('ul[data-type="taskList"] li');
    taskLists.forEach((li) => {
        total++;
        if (li.getAttribute('data-checked') === 'true') {
            completed++;
        }
    });

    return { total, completed };
};
