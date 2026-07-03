import api from './api';

export const auditLogService = {
  // Get paginated and filtered audit logs
  // params: { page, pageSize, startDate, endDate, search, actionType }
  getAll: (params) => api.get('/AuditLog', { params }),
};
