import { getOrderReport } from '../services/orderReportService.js';

export const fetchOrderReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to)
      return res.status(400).json({ error: 'From and To dates required' });

    const reportData = await getOrderReport(from, to);
    res.json(reportData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
