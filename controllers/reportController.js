import { getSalesReportService } from '../services/reportService.js';

export const getSalesReportController = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ error: 'fromDate and toDate are required' });
    }

    const report = await getSalesReportService(fromDate, toDate);

    res.status(200).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
};
