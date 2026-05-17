const { publishToQueue } = require('@notify/integrations/messaging/rabbit.publisher');
const { hmacApiKey } = require('@notify/utils/hmac-api-key.util');
const { InternalServerError } = require('@notify/errors/internal-server.error');
const { UnauthorizedError } = require('@notify/errors/unauthorized.error');
const { NotFoundError } = require('@notify/errors/not-found.error');
const { BadRequestError } = require('@notify/errors/bad-request.error');
const { paginationConfig } = require('@notify/configs/pagination.config');


class NotificationService {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    async queueNotification(apiKey, data) {
        const hashed = hmacApiKey(apiKey);
        const apiKeyValidation = await this.notificationRepository.validateApiKey(hashed);

        if (!apiKeyValidation.success) {
            throw new InternalServerError(`Database error during API key validation: ${apiKeyValidation.errorMessage}`);
        }

        if (!apiKeyValidation.data) {
            throw new UnauthorizedError('Invalid or inactive API key');
        }

        const queue = data.notify_by === 'email' ? 'notifications.email' : 'notifications.webhook';
        data.notification_sent_by = apiKeyValidation.data.owner;

        await publishToQueue(queue, data);

        return { message: 'Notification queued successfully' };
    }

    async getNotification (query) {
        const quantity = await this.notificationRepository.count(query);

        if (!quantity.success) {
            throw new InternalServerError(`Failed to get notifications: ${quantity.errorMessage}`);
        }

        const totalItems = quantity.data;
        if (totalItems === 0) {
            throw new NotFoundError(`No notifications found for the given criteria`);
        }

        const page = Number(query.page) || paginationConfig.defaultPage;
        const pageSize = Number(query.page_size) || paginationConfig.defaultPageSize;

        const totalPages = Math.ceil(totalItems / pageSize);
        if (page > totalPages) {
            throw new BadRequestError(`Page ${page} does not exist. Total pages: ${totalPages}`);
        }

        const result = await this.notificationRepository.getNotifications(query);

        if (!result.success) {
            throw new InternalServerError(`Failed to retrieve notifications: ${result.errorMessage}`);
        }

        return {
            notifications: result.data,
            pagination: {
                total_notifications: totalItems,
                total_pages: totalPages,
                notifications_per_page: pageSize
            }
        };
    }

}

module.exports = { NotificationService };