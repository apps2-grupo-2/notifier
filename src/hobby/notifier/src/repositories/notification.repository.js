class MySqlNotificationRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async validateApiKey(apiKey) {
    try {
      const [rows] = await this.pool.query(
        `
          SELECT owner
          FROM api_keys
          WHERE api_key_hash = ?
            AND is_active = 1
          LIMIT 1
        `,
        [apiKey]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message,
      };
    }
  }

  async getNotifications(queryFilters) {
    try {
      const sqlBase = `
        SELECT *
        FROM notifications
      `;

      const conditions = [];
      const values = [];

      if (queryFilters.sent_by) {
        conditions.push(`sent_by = ?`);
        values.push(queryFilters.sent_by);
      }

      if (queryFilters.email_type) {
        conditions.push(`email_type = ?`);
        values.push(queryFilters.email_type);
      }

      if (queryFilters.notification_type) {
        conditions.push(`notification_type = ?`);
        values.push(queryFilters.notification_type);
      }

      if (queryFilters.since) {
        conditions.push(`created_at >= ?`);
        values.push(queryFilters.since);
      }

      if (queryFilters.until) {
        conditions.push(`created_at <= ?`);
        values.push(queryFilters.until);
      }

      let sql = sqlBase;
      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }

      const { paginationConfig } = require('@notify/configs/pagination.config');
      const page = Number(queryFilters.page) || paginationConfig.defaultPage;
      const limit = Number(queryFilters.page_size) || paginationConfig.defaultPageSize;
      const offset = (page - 1) * limit;

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await this.pool.execute(sql, values);

      return {
        success: true,
        data: rows
      };

    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async count(queryFilters) {
    try {
      const sqlBase = `SELECT COUNT(*) as cnt FROM notifications`;
      const conditions = [];
      const values = [];

      if (queryFilters.sent_by) {
        conditions.push(`sent_by = ?`);
        values.push(queryFilters.sent_by);
      }

      if (queryFilters.email_type) {
        conditions.push(`email_type = ?`);
        values.push(queryFilters.email_type);
      }

      if (queryFilters.notification_type) {
        conditions.push(`notification_type = ?`);
        values.push(queryFilters.notification_type);
      }

      if (queryFilters.since) {
        conditions.push(`created_at >= ?`);
        values.push(queryFilters.since);
      }

      if (queryFilters.until) {
        conditions.push(`created_at <= ?`);
        values.push(queryFilters.until);
      }

      let sql = sqlBase;
      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }

      const [rows] = await this.pool.execute(sql, values);
      const cnt = rows[0] ? rows[0].cnt : 0;
      return { success: true, data: cnt };

    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

}

module.exports = { MySqlNotificationRepository };