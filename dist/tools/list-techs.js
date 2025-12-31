import { z } from 'zod';
import { CATEGORIES, DATA_VERSION, getTechnologiesByCategory, getTechnologiesGroupedByCategory } from '../data/index.js';
/**
 * Input schema for list_technologies tool.
 */
export const ListTechsInputSchema = z.object({
    category: z
        .enum(CATEGORIES)
        .optional()
        .describe('Filter by category. Omit to list all technologies.')
});
/**
 * Tool definition for MCP registration.
 */
export const listTechsToolDefinition = {
    name: 'list_technologies',
    description: 'Lists all available technology IDs for use with other tools. Essential for discovering valid technology identifiers.',
    inputSchema: {
        type: 'object',
        properties: {
            category: {
                type: 'string',
                enum: CATEGORIES,
                description: 'Filter by category (optional)'
            }
        }
    }
};
/**
 * Format technologies for a single category.
 */
function formatCategory(category, techs) {
    if (techs.length === 0)
        return '';
    const lines = techs.map((t) => `- ${t.id} (${t.name})`);
    return `## ${category}\n${lines.join('\n')}`;
}
/**
 * Execute list_technologies tool.
 */
export function executeListTechs(input) {
    const { category } = input;
    if (category) {
        // Filter by specific category
        const techs = getTechnologiesByCategory(category);
        const formatted = formatCategory(category, techs.map((t) => ({ id: t.id, name: t.name })));
        return `Available technologies in "${category}" (${techs.length} total):

${formatted}

Data version: ${DATA_VERSION}`;
    }
    // List all technologies grouped by category
    const grouped = getTechnologiesGroupedByCategory();
    const sections = [];
    let total = 0;
    for (const cat of CATEGORIES) {
        const techs = grouped[cat];
        if (techs.length > 0) {
            sections.push(formatCategory(cat, techs.map((t) => ({ id: t.id, name: t.name }))));
            total += techs.length;
        }
    }
    return `Available technologies (${total} total):

${sections.join('\n\n')}

Data version: ${DATA_VERSION}`;
}
//# sourceMappingURL=list-techs.js.map