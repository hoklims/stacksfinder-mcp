/**
 * Get the current device ID.
 */
export declare function getDeviceId(): string;
/**
 * Check if demo was used today.
 */
export declare function wasDemoUsedToday(): boolean;
/**
 * Record demo usage.
 */
export declare function recordDemoUsage(): void;
/**
 * Get demo usage stats.
 */
export declare function getDemoUsageStats(): {
    usedToday: boolean;
    totalUsage: number;
    deviceId: string;
};
//# sourceMappingURL=device-id.d.ts.map