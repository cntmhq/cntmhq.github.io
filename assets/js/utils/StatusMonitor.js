/**
 * GCP Status Monitor
 * Fetches incident data from GCP status page and maps it to glitch effect parameters
 * Polls at intelligent intervals: aggressive (1min) when incidents, relaxed (15min) when clear
 */
export class StatusMonitor {
    constructor(onStatusChange) {
        this.onStatusChange = onStatusChange;
        this.currentIncidents = [];
        this.pollingInterval = null;
        this.lastPolled = null;
        this.isActive = false;

        // Polling configuration
        this.POLLING_INTERVALS = {
            AGGRESSIVE: 60 * 1000,    // 1 min - when incidents detected
            NORMAL: 5 * 60 * 1000,    // 5 min - baseline
            RELAXED: 15 * 60 * 1000   // 15 min - no incidents detected
        };

        // Glitch parameter mapping configuration
        this.GLITCH_CONFIG = {
            baseIntensity: 0.09,      // Default glitch intensity from DEFAULT_CONFIG
            baseSpeed: 0.8,           // Default glitch speed
            baseBlockSize: 0.025,     // Default block size
            baseColorSep: 0.012,      // Default color separation

            // Per incident modifiers
            intensityPerIncident: 0.15,
            speedPerIncident: 0.3,
            blockSizePerIncident: 0.008,
            colorSepPerIncident: 0.004
        };

        // Cache for error recovery
        this.lastKnownGoodData = null;
    }

    /**
     * Start monitoring
     */
    async start() {
        if (this.isActive) return;
        this.isActive = true;

        // Initial poll
        await this.pollStatus();

        // Schedule next poll
        this._scheduleNextPoll();
    }

    /**
     * Stop monitoring
     */
    stop() {
        this.isActive = false;
        if (this.pollingInterval) {
            clearTimeout(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Fetch GCP incident data
     * @returns {Promise<Array>} Array of incident objects
     */
    async _fetchIncidents() {
        try {
            const response = await fetch('https://status.cloud.google.com/incidents.json');

            if (!response.ok) {
                throw new Error(`GCP status API returned ${response.status}`);
            }

            const data = await response.json();

            // Cache successful response
            this.lastKnownGoodData = data;
            this.lastPolled = Date.now();

            // Parse incidents array
            // The API returns: { incidents: [...] }
            const incidents = data.incidents || [];

            // Filter for active incidents (not resolved)
            const activeIncidents = incidents.filter(incident => {
                // Incidents can have status: investigating, identified, monitoring, resolved
                // We count investigating, identified, and monitoring as active
                return ['investigating', 'identified', 'monitoring'].includes(
                    incident.status?.toLowerCase()
                );
            });

            return activeIncidents;
        } catch (error) {
            console.warn('[StatusMonitor] Fetch error:', error.message);

            // If we have cached data, use it as fallback
            if (this.lastKnownGoodData) {
                console.log('[StatusMonitor] Using cached data');
                const incidents = this.lastKnownGoodData.incidents || [];
                return incidents.filter(incident => {
                    return ['investigating', 'identified', 'monitoring'].includes(
                        incident.status?.toLowerCase()
                    );
                });
            }

            return [];
        }
    }

    /**
     * Poll GCP status and update glitch parameters
     */
    async pollStatus() {
        try {
            const incidents = await this._fetchIncidents();
            this.currentIncidents = incidents;

            // Map incidents to glitch parameters
            const glitchParams = this._mapIncidentsToGlitch(incidents);

            // Notify callback
            if (this.onStatusChange) {
                this.onStatusChange(glitchParams, incidents);
            }

            return incidents;
        } catch (error) {
            console.error('[StatusMonitor] Poll failed:', error);
            return [];
        }
    }

    /**
     * Map number of incidents to glitch effect parameters
     * @param {Array} incidents - Array of incident objects
     * @returns {Object} Glitch parameters
     */
    _mapIncidentsToGlitch(incidents) {
        const count = incidents.length;

        // Scale parameters based on incident count
        // More incidents = more glitch effect
        return {
            intensity: Math.min(
                this.GLITCH_CONFIG.baseIntensity + (count * this.GLITCH_CONFIG.intensityPerIncident),
                1.0 // Cap at max 1.0
            ),
            speed: this.GLITCH_CONFIG.baseSpeed + (count * this.GLITCH_CONFIG.speedPerIncident),
            blockSize: Math.min(
                this.GLITCH_CONFIG.baseBlockSize + (count * this.GLITCH_CONFIG.blockSizePerIncident),
                0.15 // Cap at reasonable max
            ),
            colorSeparation: this.GLITCH_CONFIG.baseColorSep + (count * this.GLITCH_CONFIG.colorSepPerIncident),
            incidentCount: count
        };
    }

    /**
     * Schedule next poll based on incident status
     * @private
     */
    _scheduleNextPoll() {
        if (!this.isActive) return;

        // Choose interval based on incident count
        let interval;
        if (this.currentIncidents.length > 0) {
            // Active incidents: poll aggressively
            interval = this.POLLING_INTERVALS.AGGRESSIVE;
        } else if (this.lastPolled && Date.now() - this.lastPolled < 5 * 60 * 1000) {
            // Recently checked and clear: use normal interval
            interval = this.POLLING_INTERVALS.NORMAL;
        } else {
            // No recent data: use relaxed interval
            interval = this.POLLING_INTERVALS.RELAXED;
        }

        if (this.pollingInterval) {
            clearTimeout(this.pollingInterval);
        }

        this.pollingInterval = setTimeout(() => {
            this.pollStatus();
            this._scheduleNextPoll();
        }, interval);
    }

    /**
     * Get current incident count
     */
    getIncidentCount() {
        return this.currentIncidents.length;
    }

    /**
     * Get incident details for UI display
     */
    getIncidentDetails() {
        return this.currentIncidents.map(incident => ({
            name: incident.title || 'Unknown',
            status: incident.status || 'unknown',
            affectedServices: incident.affected_products || [],
            created: incident.created_at || null
        }));
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stop();
        this.onStatusChange = null;
    }
}
