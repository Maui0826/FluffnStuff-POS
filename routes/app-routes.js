import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { protect, checkIfLoggedIn } from '../middlewares/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

router.route('/').get(checkIfLoggedIn, async (req, res, next) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

router.route('/resetPassword').get(async (req, res, next) => {
  if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
    res.sendFile(join(__dirname, '..', 'public', 'reset-password.html'));
  } else if (req.currentUser.role === 'inventory') {
    res.sendFile(
      join(__dirname, '..', 'public', 'reset-password-checker.html')
    );
  } else if (req.currentUser.role === 'cashier') {
    res.sendFile(
      join(__dirname, '..', 'public', 'reset-password-cashier.html')
    );
  }
});

router // Admin, Staff Visitor
  .route('/dashboard')
  .get(protect, async (req, res, next) => {
    if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
      res.sendFile(join(__dirname, '..', 'public', 'adminPage.html'));
    } else if (req.currentUser.role === 'inventory') {
      res.sendFile(join(__dirname, '..', 'public', 'checkerPage.html'));
    } else if (req.currentUser.role === 'cashier') {
      res.sendFile(join(__dirname, '..', 'public', 'cashierPage.html'));
    }
  });

router // Admin
  .route('/manage-users')
  .get(protect, async (req, res, next) => {
    if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
      res.sendFile(join(__dirname, '..', 'public', 'adminManageUsers.html'));
    }
  });

router // Admin
  .route('/reports')
  .get(protect, async (req, res, next) => {
    if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
      res.sendFile(join(__dirname, '..', 'public', 'salesReport.html'));
    }
  });

router // Admin Staff Visitor
  .route('/point-of-sale')
  .get(protect, async (req, res, next) => {
    if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
      res.sendFile(join(__dirname, '..', 'public', 'adminPOS.html'));
    } else if (req.currentUser.role === 'cashier') {
      res.sendFile(join(__dirname, '..', 'public', 'cashierPage.html'));
    }
  });

router.route('/inventory').get(protect, async (req, res, next) => {
  if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
    res.sendFile(join(__dirname, '..', 'public', 'adminInventory.html'));
  } else if (req.currentUser.role === 'inventory') {
    res.sendFile(join(__dirname, '..', 'public', 'checkerPage.html'));
  }
});

router.route('/logout').get(async (req, res, next) => {
  res.sendFile(join(__dirname, '..', 'public', 'logout.html'));
});

router.route('/supplies').get(protect, async (req, res, next) => {
  if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
    res.sendFile(join(__dirname, '..', 'public', 'adminManageOrders.html'));
  } else if (req.currentUser.role === 'inventory') {
    res.sendFile(join(__dirname, '..', 'public', 'checkerOrder.html'));
  }
});

router.route('/category').get(protect, async (req, res, next) => {
  if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
    res.sendFile(join(__dirname, '..', 'public', 'adminManageCategory.html'));
  } else if (req.currentUser.role === 'inventory') {
    res.sendFile(join(__dirname, '..', 'public', 'checkerCategory.html'));
  }
});

router.route('/user-actions').get(protect, async (req, res, next) => {
  if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
    res.sendFile(join(__dirname, '..', 'public', 'adminLogs.html'));
  }
});

router // status
  .route('/status')
  .get(async (req, res, next) => {
    res.clearCookie('authToken');

    res.sendFile(join(__dirname, '..', 'public', 'status.html'));
  });

router.route('/transactions').get(protect, async (req, res, next) => {
  if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
    res.sendFile(join(__dirname, '..', 'public', 'adminTransaction.html'));
  } else if (req.currentUser.role === 'cashier') {
    res.sendFile(join(__dirname, '..', 'public', 'cashierTransaction.html'));
  }
});

router.route('/refunds').get(protect, async (req, res, next) => {
  if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
    res.sendFile(join(__dirname, '..', 'public', 'refund.html'));
  } else if (req.currentUser.role === 'cashier') {
    res.sendFile(join(__dirname, '..', 'public', 'cashierRefundPage.html'));
  }
});

router.route('/refunds/refund-login').get(protect, async (req, res, next) => {
  if (req.currentUser.role === 'cashier') {
    res.sendFile(join(__dirname, '..', 'public', 'cashierRefund.html'));
  }
});

router.route('/reports/sales').get(protect, async (req, res, next) => {
  if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
    res.sendFile(join(__dirname, '..', 'public', 'salesReport.html'));
  }
});

router.route('/reports/inventory').get(protect, async (req, res, next) => {
  if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
    res.sendFile(join(__dirname, '..', 'public', 'inventoryReport.html'));
  }
});

router.route('/reports/order').get(protect, async (req, res, next) => {
  if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
    res.sendFile(join(__dirname, '..', 'public', 'orderReport.html'));
  }
});

router // status
  .route('/profile')
  .get(protect, async (req, res, next) => {
    if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
      res.sendFile(join(__dirname, '..', 'public', 'profile.html'));
    } else if (req.currentUser.role === 'inventory') {
      res.sendFile(join(__dirname, '..', 'public', 'checkerProfile.html'));
    } else if (req.currentUser.role === 'cashier') {
      res.sendFile(join(__dirname, '..', 'public', 'cashierProfile.html'));
    }
  });

router // status
  .route('/emailUpdate')
  .get(async (req, res, next) => {
    res.sendFile(join(__dirname, '..', 'public', 'email-update.html'));
  });

router // status
  .route('/login/about-us')
  .get(async (req, res, next) => {
    res.sendFile(join(__dirname, '..', 'public', 'about-login.html'));
  });

router // status
  .route('/about-us')
  .get(protect, async (req, res, next) => {
    if (req.currentUser.role === 'admin' || req.currentUser.role === 'owner') {
      res.sendFile(join(__dirname, '..', 'public', 'about-admin.html'));
    } else if (req.currentUser.role === 'inventory') {
      res.sendFile(join(__dirname, '..', 'public', 'about-checker.html'));
    } else if (req.currentUser.role === 'cashier') {
      res.sendFile(join(__dirname, '..', 'public', 'about-cashier.html'));
    }
  });

router // status
  .route('/features')
  .get(async (req, res, next) => {
    res.sendFile(join(__dirname, '..', 'public', 'features.html'));
  });

router // status
  .route('/terms')
  .get(async (req, res, next) => {
    res.sendFile(join(__dirname, '..', 'public', 'terms-public.html'));
  });

export default router;
