import { getInventoryReport } from '../services/inventoryReportService.js';

export const fetchInventoryReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to)
      return res
        .status(400)
        .json({ message: 'From and To dates are required' });

    const report = await getInventoryReport(from, to);
    res.json(report);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: 'Failed to generate report', error: err.message });
  }
};
