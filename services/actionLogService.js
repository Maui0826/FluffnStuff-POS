import Log from '../models/actionLogsModel.js';
import User from '../models/userModel.js';

const createActionLog = async data => {
  const logs = await Log.create({
    user: data.user,
    action: data.action,
    description: data.description,
  });

  return logs;
};

const getAllLogs = async (filters = {}) => {
  const {
    search = '',
    role = '',
    actions = [],
    startDate = null,
    endDate = null,
    page = 1,
    limit = 10,
  } = filters;

  const query = {};

  // Actions
  if (Array.isArray(actions) && actions.length > 0) {
    query.action = { $in: actions };
  }

  // Date range
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.timestamp.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.timestamp.$lte = end;
    }
  }

  // User filters
  const matchUser = {};
  if (search) {
    const regex = new RegExp(search, 'i');
    matchUser.$or = [
      { 'user.name.firstName': regex },
      { 'user.name.middleName': regex },
      { 'user.name.lastName': regex },
    ];
  }
  if (role) {
    matchUser['user.role'] = role;
  }

  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ];

  if (Object.keys(matchUser).length > 0) {
    pipeline.push({ $match: matchUser });
  }

  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await Log.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  pipeline.push({ $sort: { timestamp: -1 } });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  const logs = await Log.aggregate(pipeline);

  return { logs, total };
};

export default { createActionLog, getAllLogs };
