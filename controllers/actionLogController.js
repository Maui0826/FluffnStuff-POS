import actionLogsModel from '../models/actionLogsModel.js';
import LogService from '../services/actionLogService.js';
import catchAsync from '../utils/catchAsync.js';

export const getAllLogs = catchAsync(async (req, res, next) => {
  const { search, role, actions, startDate, page = 1, limit = 10 } = req.query; // ✅ use query for pagination

  const filter = {
    search,
    role,
    actions: actions ? (Array.isArray(actions) ? actions : [actions]) : [],
    startDate,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const { logs, total } = await LogService.getAllLogs(filter);

  res.status(200).json({
    status: 'success',
    data: logs,
    total,
    page: filter.page,
    totalPages: Math.ceil(total / filter.limit),
  });
});

// ✅ Get all unique action types
export const getAllActionTypes = catchAsync(async (req, res, next) => {
  const actions = await actionLogsModel.distinct('action'); // gets unique values from "action" field

  res.status(200).json({
    status: 'success',
    data: actions,
  });
});
