/**
 * Message type utilities for chat system
 */

export const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    SYSTEM: 'system',
    LOCATION: 'location',
    JOB_UPDATE: 'job_update'
};

export const MESSAGE_TYPE_CONFIG = {
    [MESSAGE_TYPES.TEXT]: {
        label: 'Text Message',
        icon: '💬',
        color: 'blue',
        requiresContent: true,
        requiresMetadata: false
    },
    [MESSAGE_TYPES.IMAGE]: {
        label: 'Image',
        icon: '🖼️',
        color: 'green',
        requiresContent: false,
        requiresMetadata: true,
        metadataFields: ['fileName', 'fileSize', 'fileUrl']
    },
    [MESSAGE_TYPES.FILE]: {
        label: 'File',
        icon: '📎',
        color: 'purple',
        requiresContent: false,
        requiresMetadata: true,
        metadataFields: ['fileName', 'fileSize', 'fileUrl', 'fileType']
    },
    [MESSAGE_TYPES.SYSTEM]: {
        label: 'System Message',
        icon: '⚙️',
        color: 'gray',
        requiresContent: true,
        requiresMetadata: false
    },
    [MESSAGE_TYPES.LOCATION]: {
        label: 'Location',
        icon: '📍',
        color: 'red',
        requiresContent: false,
        requiresMetadata: true,
        metadataFields: ['latitude', 'longitude', 'address']
    },
    [MESSAGE_TYPES.JOB_UPDATE]: {
        label: 'Job Update',
        icon: '📋',
        color: 'orange',
        requiresContent: true,
        requiresMetadata: true,
        metadataFields: ['updateType', 'previousValue', 'newValue']
    }
};

/**
 * Validate message data based on type
 * @param {string} messageType - The message type
 * @param {string} content - The message content
 * @param {Object} metadata - The message metadata
 * @returns {Object} Validation result
 */
export const validateMessage = (messageType, content, metadata = {}) => {
    const config = MESSAGE_TYPE_CONFIG[messageType];
    
    if (!config) {
        return {
            valid: false,
            error: 'Invalid message type'
        };
    }

    // Check if content is required
    if (config.requiresContent && (!content || content.trim().length === 0)) {
        return {
            valid: false,
            error: `${config.label} requires content`
        };
    }

    // Check if metadata is required
    if (config.requiresMetadata) {
        if (!metadata || Object.keys(metadata).length === 0) {
            return {
                valid: false,
                error: `${config.label} requires metadata`
            };
        }

        // Check required metadata fields
        if (config.metadataFields) {
            const missingFields = config.metadataFields.filter(field => !metadata[field]);
            if (missingFields.length > 0) {
                return {
                    valid: false,
                    error: `${config.label} is missing required metadata: ${missingFields.join(', ')}`
                };
            }
        }
    }

    return {
        valid: true,
        error: null
    };
};

/**
 * Format message content for display
 * @param {Object} message - The message object
 * @returns {string} Formatted content
 */
export const formatMessageContent = (message) => {
    const { messageType, content, metadata } = message;
    const config = MESSAGE_TYPE_CONFIG[messageType];

    switch (messageType) {
        case MESSAGE_TYPES.TEXT:
        case MESSAGE_TYPES.SYSTEM:
            return content;

        case MESSAGE_TYPES.IMAGE:
            return `📷 ${metadata?.fileName || 'Image'}`;

        case MESSAGE_TYPES.FILE:
            return `📎 ${metadata?.fileName || 'File'}`;

        case MESSAGE_TYPES.LOCATION:
            return `📍 ${metadata?.address || 'Location shared'}`;

        case MESSAGE_TYPES.JOB_UPDATE:
            return `📋 ${content}`;

        default:
            return content;
    }
};

/**
 * Get message type configuration
 * @param {string} messageType - The message type
 * @returns {Object} Message type configuration
 */
export const getMessageTypeConfig = (messageType) => {
    return MESSAGE_TYPE_CONFIG[messageType] || MESSAGE_TYPE_CONFIG[MESSAGE_TYPES.TEXT];
};
