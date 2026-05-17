class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }

    async queueNotification(req, res, next) {
        try {
            const data = req.body;
            const apiKey = req.headers['x-api-key'];
            const notification = await this.notificationService.queueNotification(apiKey, data);

            res.status(202).json(notification);
        } catch (error) {
            next(error);
        }   
    }

    async getNotification (req,res,next) {
        try{
            const query = req.query;
            const notifications = await this.notificationService.getNotification(query);
            res.status(200).json(notifications);
        } catch (error) {
            next (error);
        }

    }

}

module.exports = { NotificationController };