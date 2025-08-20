// cron/dailyInventoryCron.js
import cron from 'node-cron';
import { recordDailyInventory } from '../services/inventoryRecordService.js';

const dailyInventoryCron = () => {
  cron.schedule('59 23 * * *', async () => {
    console.log(
      `[${new Date().toISOString()}] Running daily inventory record...`
    );
    try {
      const result = await recordDailyInventory();
      console.log(
        `[${new Date().toISOString()}] ${result.message}. Total records: ${
          result.count
        }`
      );
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Failed to record daily inventory:`,
        error.message
      );
    }
  });
};

export default dailyInventoryCron;
