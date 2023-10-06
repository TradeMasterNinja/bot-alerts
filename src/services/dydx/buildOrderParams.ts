import DYDXConnector from './client';
import {
    OrderSide,
    Market,
    OrderType,
    TimeInForce,
} from '@dydxprotocol/v3-client';
import config = require('config');
import { AlertObject, dydxOrderParams } from '../../types';
import 'dotenv/config';
import { getDecimalPointLength, getStrategiesDB } from '../../helper';

export const dydxBuildOrderParams = async (alertMessage: AlertObject): Promise<dydxOrderParams> => {
    const db = getStrategiesDB()[0];
    console.log('db:', db);
    const rootData = getStrategiesDB()[1];
    // view strategies in console and find info to use for stops and tp orders
    console.log('rootData:', rootData);


    const currentDate: Date = new Date();
    const futureDate: Date =
        alertMessage.type === 'market'
            ? new Date(currentDate.getTime() + 2 * 60 * 1000) // 2 minutes in milliseconds
            : new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds

    const dateStr: string = futureDate.toJSON();

    const connector = await DYDXConnector.build();

    const market = Market[alertMessage.market as keyof typeof Market];
    const marketsData = await connector.client.public.getMarkets(market);

    const orderSide: OrderSide =
        alertMessage.order == 'buy' ? OrderSide.BUY : OrderSide.SELL;

    const latestPrice = parseFloat(marketsData.markets[market].oraclePrice);
    console.log('latestPrice', latestPrice);

    const orderSize: number =
        alertMessage.sizeByLeverage
            ? (Number((await connector.client.private.getAccount(process.env.ETH_ADDRESS)).account.equity) * Number(alertMessage.sizeByLeverage)) / latestPrice
            : alertMessage.sizeUsd
            ? Number(alertMessage.sizeUsd) / latestPrice
            : alertMessage.reverse && rootData[alertMessage.strategy].isFirstOrder === 'false'
            ? alertMessage.size * 2
            : alertMessage.size;

    const stepSize = parseFloat(marketsData.markets[market].stepSize);
    const stepDecimal = getDecimalPointLength(stepSize);
    const orderSizeStr: string = orderSize.toFixed(stepDecimal); // Convert orderSize to a string

    const { orderType, price1 }: { orderType: OrderType, price1: string } =
        alertMessage.type === 'market'
            ? { orderType: OrderType.MARKET, price1: latestPrice.toFixed(getDecimalPointLength(latestPrice)) }
            : alertMessage.type === 'take profit'
            ? { orderType: OrderType.TAKE_PROFIT, price1: Number(alertMessage.enterPrice).toFixed(getDecimalPointLength(latestPrice)) }
            : alertMessage.type === 'limit'
            ? { orderType: OrderType.LIMIT, price1: Number(alertMessage.enterPrice).toFixed(getDecimalPointLength(latestPrice)) }
            : alertMessage.type === 'trailing stop'
            ? { orderType: OrderType.TRAILING_STOP, price1: latestPrice.toFixed(getDecimalPointLength(latestPrice)) }
            : { orderType: OrderType.MARKET, price1: latestPrice.toFixed(getDecimalPointLength(latestPrice)) };

    let price2: number;
    // update price here for trailing stop calculation
    const trailingpercent: number | null = alertMessage.trailingPercent !== undefined ? parseFloat(alertMessage.trailingPercent) : null;
    if (alertMessage.type === 'trailing stop' && trailingpercent !== null) {
        const buffer: number = trailingpercent+0.5; // added 0.5% buffer to prevent trigger price error
        const trailingAmount: number = parseFloat(price1) * (buffer / 100);
        price2 = orderSide === OrderSide.SELL
            ? parseFloat(price1) - trailingAmount
            : parseFloat(price1) + trailingAmount;
    } else {
        price2 = parseFloat(price1);
    }

    const tickSize = parseFloat(marketsData.markets[market].tickSize);
    const roundedPrice = Math.round(price2 / tickSize) * tickSize;

    const price3 = roundedPrice.toFixed(getDecimalPointLength(tickSize));

    const slippagePercentage = 0.05;
    const minPrice =
        alertMessage.type === 'market'
            ? orderSide === OrderSide.BUY
                ? roundedPrice * (1 + slippagePercentage)
                : roundedPrice * (1 - slippagePercentage)
            : parseFloat(price3);

    const decimal = getDecimalPointLength(tickSize);
    const price4 = minPrice.toFixed(decimal)

    const time1 =
        orderType === OrderType.LIMIT
            ? TimeInForce.GTT
            : orderType === OrderType.MARKET
            ? TimeInForce.FOK
            : TimeInForce.IOC;

    const reduceonly: boolean =
        orderType === OrderType.MARKET ? false : alertMessage.reduceOnly || false;

    const orderParams: dydxOrderParams = {
        market: market,
        side: orderSide,
        timeInForce: time1,
        postOnly: false,
        size: orderSizeStr,
        price: price4,
        limitFee: config.get('Dydx.User.limitFee'),
        expiration: dateStr,
        type: orderType,
        reduceOnly: reduceonly,
    };
    
    if (trailingpercent !== null) {
        orderParams.trailingPercent = (orderSide === OrderSide.SELL ? -trailingpercent : trailingpercent).toString();
        const trailingAmount: number = parseFloat(price1) * (trailingpercent / 100);
        price2 = orderSide === OrderSide.SELL
            ? parseFloat(price1) - trailingAmount
            : parseFloat(price1) + trailingAmount;
    } else if (trailingpercent === null && orderType === OrderType.TAKE_PROFIT) {
        orderParams.triggerPrice = price4;
    }

    console.log('orderParams for dydx', orderParams);
    return orderParams;
};
