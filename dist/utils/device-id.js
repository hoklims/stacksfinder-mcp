import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { debug, warn } from './logger.js';
/**
 * Get the path to the device data file.
 */
function getDeviceFilePath() {
    const configDir = join(homedir(), '.stacksfinder');
    return join(configDir, 'device.json');
}
/**
 * Ensure the config directory exists.
 */
function ensureConfigDir() {
    const configDir = join(homedir(), '.stacksfinder');
    if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
        debug('Created config directory', { path: configDir });
    }
}
/**
 * Load device data from file, or create new if doesn't exist.
 */
function loadDeviceData() {
    const filePath = getDeviceFilePath();
    if (existsSync(filePath)) {
        try {
            const raw = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(raw);
            debug('Loaded device data', { deviceId: data.deviceId.slice(0, 8) + '...' });
            return data;
        }
        catch (err) {
            warn('Failed to parse device data, creating new', err);
        }
    }
    // Create new device data
    ensureConfigDir();
    const newData = {
        deviceId: randomUUID(),
        createdAt: new Date().toISOString(),
        lastDemoUsedAt: null,
        demoUsageCount: 0
    };
    saveDeviceData(newData);
    debug('Created new device data', { deviceId: newData.deviceId.slice(0, 8) + '...' });
    return newData;
}
/**
 * Save device data to file.
 */
function saveDeviceData(data) {
    ensureConfigDir();
    const filePath = getDeviceFilePath();
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
/**
 * Get the current device ID.
 */
export function getDeviceId() {
    return loadDeviceData().deviceId;
}
/**
 * Check if demo was used today.
 */
export function wasDemoUsedToday() {
    const data = loadDeviceData();
    if (!data.lastDemoUsedAt) {
        return false;
    }
    const lastUsed = new Date(data.lastDemoUsedAt);
    const today = new Date();
    // Compare date only (ignore time)
    return (lastUsed.getUTCFullYear() === today.getUTCFullYear() &&
        lastUsed.getUTCMonth() === today.getUTCMonth() &&
        lastUsed.getUTCDate() === today.getUTCDate());
}
/**
 * Record demo usage.
 */
export function recordDemoUsage() {
    const data = loadDeviceData();
    data.lastDemoUsedAt = new Date().toISOString();
    data.demoUsageCount++;
    saveDeviceData(data);
    debug('Recorded demo usage', { count: data.demoUsageCount });
}
/**
 * Get demo usage stats.
 */
export function getDemoUsageStats() {
    const data = loadDeviceData();
    return {
        usedToday: wasDemoUsedToday(),
        totalUsage: data.demoUsageCount,
        deviceId: data.deviceId
    };
}
//# sourceMappingURL=device-id.js.map