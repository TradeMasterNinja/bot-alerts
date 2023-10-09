import express, { Router } from 'express';
import {
  dydxCreateOrder,
  dydxGetAccount,
  dydxBuildOrderParams,
  dydxExportOrder,
  validateAlert,
  checkAfterPosition,
  perpCreateOrder,
  perpBuildOrderParams,
  perpGetAccount,
  perpExportOrder,
  resetDatabase,
} from '../services';

const router: Router = express.Router();

router.get('/', async (req, res) => {
  console.log('Received GET request.');

  const dydxAccountData = await dydxGetAccount();
  const perpAccountData = await perpGetAccount();

  if (!dydxAccountData.success && !perpAccountData.success) {
    res.send('Error on getting account data');
  } else {
    const dydxAccountMessage = dydxAccountData.success
      ? 'dYdX Account Ready'
      : 'dYdX Account Not Ready';

    const perpAccountMessage = perpAccountData.success
      ? 'Perpetual Protocol Account Ready'
      : 'Perpetual Protocol Account Not Ready';

    const message =
      dydxAccountMessage + '\n' + perpAccountMessage;

    res.send(message);
  }
});


router.post('/', async (req, res) => {
  console.log('Received Tradingview strategy alert:', req.body);

  const alerts = Array.isArray(req.body) ? req.body : [req.body]; // Always pass an array of alerts

  if (!alerts || alerts.length === 0) {
    res.send('Error. No valid alerts found');
    return;
  }

   // Iterate over each alert in the array
  for (const alert of alerts) {   
    // Call the function to check if the database should be reset
    await resetDatabase(alert) 
    const data = await checkAfterPosition(alert);
    console.log('Position Data:', data);
    
    if (alert.reduceOnly) {
      if (data[alert.strategy] && data[alert.strategy]['position'] !== undefined) {
          alert.size = Math.abs(data[alert.strategy]['position']); 
          // Check if sizeByLeverage and sizeUsd exist, and delete them if they do
          if (alert['sizeByLeverage']) {
            delete alert['sizeByLeverage'];
          }
          if (alert['sizeUsd']) {
            delete alert['sizeUsd'];
          }
        } else {
          console.error('Data for alert strategy or position is missing or undefined.');
        }
    }

    const validated = await validateAlert(alert);
    if (!validated) {
      res.send('Error. Alert message is not valid');
      return;
    }

    let orderResult;
    switch (alert.exchange) {
      case 'perpetual': {
        const orderParams = await perpBuildOrderParams(alert);
        if (!orderParams) return;
        orderResult = await perpCreateOrder(orderParams);
        await perpExportOrder(
          alert.strategy,
          orderResult,
          alert.price,
          alert.market
        );
        break;
      }
      default: {
        const orderParams = await dydxBuildOrderParams(alert);
        if (!orderParams) return;
        orderResult = await dydxCreateOrder(orderParams);
        if (!orderResult) return;
        await dydxExportOrder(
          alert.strategy,
          orderResult.order,
          alert.price
        );
      }
    }

    // Additional processing for each alert if needed
    // checkAfterPosition(alert);
  }

  res.send('OK');
});

router.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('My first Sentry error!');
});

export default router;
