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
} from '../services';

const router: Router = express.Router();

router.get('/', async (req, res) => {
  console.log('Received GET request.');

  const dydxAccount = await dydxGetAccount();
  const perpAccount = await perpGetAccount();

  if (!dydxAccount && !perpAccount) {
    res.send('Error on getting account data');
  } else {
    const message =
      'dYdX Account Ready: ' +
      dydxAccount +
      '\n  Perpetual Protocol Account Ready: ' +
      perpAccount;
    res.send(message);
  }
});

router.post('/', async (req, res) => {
  console.log('Received Tradingview strategy alert:', req.body);

  const alerts = req.body.alerts; // Assuming an array of alerts in the request body

  if (alerts && Array.isArray(alerts) && alerts.length > 0) {
    // Iterate over each alert in the array
    for (const alert of alerts) {
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
  } else {
    // Original code to process a single alert
    const validated = await validateAlert(req.body);
    if (!validated) {
      res.send('Error. Alert message is not valid');
      return;
    }

    let orderResult;
    switch (req.body.exchange) {
      case 'perpetual': {
        const orderParams = await perpBuildOrderParams(req.body);
        if (!orderParams) return;
        orderResult = await perpCreateOrder(orderParams);
        await perpExportOrder(
          req.body.strategy,
          orderResult,
          req.body.price,
          req.body.market
        );
        break;
      }
      default: {
        const orderParams = await dydxBuildOrderParams(req.body);
        if (!orderParams) return;
        orderResult = await dydxCreateOrder(orderParams);
        if (!orderResult) return;
        await dydxExportOrder(
          req.body.strategy,
          orderResult.order,
          req.body.price
        );
      }
    }

    // Additional processing for the single alert if needed
    // checkAfterPosition(req.body);
  }

  res.send('OK');
});

router.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('My first Sentry error!');
});

export default router;
