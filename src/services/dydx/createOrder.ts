import DYDXConnector from './client';
import { OrderResponseObject, ApiOrder, OrderType } from '@dydxprotocol/v3-client';
import { dydxOrderParams } from '../../types';
import { _sleep } from '../../helper';
import { TimeInForce } from '@dydxprotocol/v3-client';

export const dydxCreateOrder = async (orderParams: dydxOrderParams) => {
  let count = 0;
  const maxTries = 3;

  while (count <= maxTries) {
    try {
      const connector = await DYDXConnector.build();
      
      const convertedOrderParams: Omit<ApiOrder, 'clientId' | 'signature'> = {
        ...orderParams,
        type: orderParams.type as OrderType,
        //trailingPercent: orderParams.trailingPercent !== undefined ? orderParams.trailingPercent : null as string | null,
        timeInForce: orderParams.timeInForce as TimeInForce,
        
      };

      const orderResult: { order: OrderResponseObject } =
        await connector.client.private.createOrder(
          convertedOrderParams,
          connector.positionID
        );

      console.log(
        new Date() + ' placed order market:',
        orderParams.market,
        'side:',
        orderParams.side,
        'price:',
        orderParams.price,
        'size:',
        orderParams.size
      );

      return orderResult;
    } catch (error) {
      count++;
      if (count === maxTries) {
        console.error(error);
      }
      await _sleep(5000);
    }
  }
};