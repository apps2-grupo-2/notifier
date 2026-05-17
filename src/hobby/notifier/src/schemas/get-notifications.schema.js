const { z } = require('zod');

const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const getNotificationSchema = z
  .object({
    sent_by: z.coerce.number().int().positive().optional(),
    email_type: z.string().optional(),
    notification_type: z.enum(['webhook', 'email']).optional(),
    page: z.coerce.number().int().positive().optional(),
    page_size: z.coerce.number().int().positive().optional(),
    since: z.string().regex(dateTimeRegex).optional(),
    until: z.string().regex(dateTimeRegex).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.since || !data.until) return;

    const since = new Date(data.since.replace(' ', 'T'));
    const until = new Date(data.until.replace(' ', 'T'));

    if (since >= until) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'since must be before until',
        path: ['since'],
      });
    }

    const maxDate = new Date(since);
    maxDate.setMonth(maxDate.getMonth() + 1);

    if (until > maxDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'difference cannot exceed 1 month',
        path: ['until'],
      });
    }
  });

module.exports = {getNotificationSchema};