#!/usr/bin/env python3
import re

# Read the file
with open('src/pages/MyQueue.tsx', 'r') as f:
    content = f.read()

# Replace the status filter dropdown
status_pattern = r'<div className="relative" ref=\{statusFilterRef\}>.*?</div>\s*</div>\s*\n\s*{/\* Task Counter'
status_replacement = '''<Dropdown
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val as any)}
                                options={[
                                    { value: 'OPEN', label: 'Abertas' },
                                    { value: 'OPEN_MY_PART_DONE', label: 'Abertas (minha parte entregue)' },
                                    { value: 'DELIVERED', label: 'Entregues' }
                                ]}
                                minWidth="220px"
                            />
                        </div>

                        {/* Task Counter'''

content = re.sub(status_pattern, status_replacement, content, flags=re.DOTALL)

# Replace the sort dropdown
sort_pattern = r'<div className="relative" ref=\{sortDropdownRef\}>.*?</div>\s*</div>\s*</div>'
sort_replacement = '''<Dropdown
                                value={sortOrder}
                                onChange={(val) => setSortOrder(val as any)}
                                options={[
                                    { value: 'PRIORITY', label: 'Por prioridade' },
                                    { value: 'TITLE', label: 'Por título' },
                                    { value: 'CREATED_AT', label: 'Por data de criação' },
                                    { value: 'URGENCY', label: 'Por urgência' },
                                    { value: 'MANUAL', label: 'Manual (Drag & Drop)' }
                                ]}
                                minWidth="200px"
                                align="right"
                            />
                        </div>
                    </div>'''

content = re.sub(sort_pattern, sort_replacement, content, flags=re.DOTALL)

# Write back
with open('src/pages/MyQueue.tsx', 'w') as f:
    f.write(content)

print("Replaced dropdowns successfully!")
