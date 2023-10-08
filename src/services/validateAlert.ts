import { AlertObject } from '../types';
import { Market } from '@dydxprotocol/v3-client';
import DYDXConnector from './dydx/client';
import { getStrategiesDB } from '../helper';


validateAlert = async (
  alertMessage: AlertObject,
  account: any // Use any for dydxAccount
): Promise<boolean> => {
  // Log the alert message at the beginning
  console.log('Alert message:', alertMessage);
  console.log('account',account);

  // check correct alert JSON format
  if (!Object.keys(alertMessage).length) {
    console.error('Tradingview alert is not JSON format.');
    return false;
  }

  // Log the passphrase
  console.log('Passphrase:', alertMessage.passphrase);
  console.log('env phrase',process.env.TRADINGVIEW_PASSPHRASE);

  // check passphrase
  if (process.env.TRADINGVIEW_PASSPHRASE && !alertMessage.passphrase) {
    console.error('Passphrase is not set on alert message.');
    return false;
  }
  if (
    alertMessage.passphrase &&
    alertMessage.passphrase != process.env.TRADINGVIEW_PASSPHRASE
  ) {
    console.error('Passphrase from tradingview alert does not match to config');
    return false;
  }

  // Log the exchange
  console.log('Exchange:', alertMessage.exchange);

  // check exchange
  if (alertMessage.exchange) {
    const validExchanges = ['dydx', 'perpetual'];
    if (!validExchanges.includes(alertMessage.exchange)) {
      console.error('Exchange name must be dydx or perpetual');
      return false;
    }
  }

  // Log the strategy name
  console.log('Strategy:', alertMessage.strategy);

  // check strategy name
  if (!alertMessage.strategy) {
    console.error('Strategy field of tradingview alert must not be empty');
    return false;
  }

  // Log the order side
  console.log('Order Side:', alertMessage.order);

  // check orderSide
  if (alertMessage.order != 'buy' && alertMessage.order != 'sell') {
    console.error(
      'Side field of tradingview alert is not correct. Must be buy or sell'
    );
    return false;
  }

  // Log the position
  console.log('Position:', alertMessage.position);

  //check position
  if (
    alertMessage.position != 'long' &&
    alertMessage.position != 'short' &&
    alertMessage.position != 'flat'
  ) {
    console.error('Position field of tradingview alert is not correct.');
    return false;
  }

  // Log the reverse
  console.log('Reverse:', alertMessage.reverse);

  //check reverse
  if (typeof alertMessage.reverse != 'boolean') {
    console.error(
      'Reverse field of tradingview alert is not correct. Must be true or false.'
    );
    return false;
  }

  // ...
  // Continue with the rest of your checks and logging as needed

  return true;
};
