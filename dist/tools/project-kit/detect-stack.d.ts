/**
 * Stack Detection Module
 *
 * Detects technologies from project files using pattern matching.
 * Each detection rule parses a specific file type and returns detected technologies.
 */
import type { DetectionRule, DetectedStack } from './types.js';
export declare const DETECTION_RULES: DetectionRule[];
/**
 * Detect technologies from project files.
 */
export declare function detectStackFromFiles(workspaceRoot: string): Promise<{
    stack: DetectedStack;
    filesAnalyzed: string[];
}>;
//# sourceMappingURL=detect-stack.d.ts.map