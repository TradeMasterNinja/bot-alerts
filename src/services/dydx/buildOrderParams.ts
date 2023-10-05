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

export const dydxBuildOrderParams = async (alertMessage: AlertObject) => {
    const [db, rootData] = getStrategiesDB();

    // set expiration datetime. must be more than 1 minute from the current datetime
    const currentDate: Date = new Date();
    const futureDate: Date =
        alertMessage.type === 'market'
            ? new Date(currentDate.getTime() + 2 * 60 * 1000) // 2 minutes in milliseconds
            : new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds

    const dateStr: string = futureDate.toJSON();

    const connector = await DYDXConnector.build();

    const market = Market[alertMessage.market as keyof typeof Market];
    const marketsData = await connector.client.public.getMarkets(market);

    const orderSide =
        alertMessage.order == 'buy' ? OrderSide.BUY : OrderSide.SELL;

    const latestPrice = parseFloat(marketsData.markets[market].oraclePrice);
    console.log('latestPrice', latestPrice);

    let orderSize: number;
    if (alertMessage.sizeByLeverage) {
        const account = await connector.client.private.getAccount(
            process.env.ETH_ADDRESS
        );
        const equity = Number(account.account.equity);
        orderSize = (equity * Number(alertMessage.sizeByLeverage)) / latestPrice;
    } else if (alertMessage.sizeUsd) {
        orderSize = Number(alertMessage.sizeUsd) / latestPrice;
    } else if (
        alertMessage.reverse &&
        rootData[alertMessage.strategy].isFirstOrder == 'false'
    ) {
        orderSize = alertMessage.size * 2;
    } else {
        orderSize = alertMessage.size;
    }

    let orderType: OrderType;
    let price1: string;
    const trailingpercent =
        alertMessage.trailingPercent !== undefined
            ? alertMessage.trailingPercent
            : null;

    if (alertMessage.type === 'market') {
        orderType = OrderType.MARKET;
        price1 = latestPrice.toFixed(getDecimalPointLength(latestPrice)).toString();
    } else if (alertMessage.type === 'take profit') {
        orderType = OrderType.TAKE_PROFIT;
        price1 = Number(alertMessage.enterPrice)
            .toFixed(getDecimalPointLength(latestPrice))
            .toString();
    } else if (alertMessage.type === 'limit') {
        orderType = OrderType.LIMIT;
        price1 = Number(alertMessage.enterPrice)
            .toFixed(getDecimalPointLength(latestPrice))
            .toString();
    } else if (alertMessage.type === 'trailing stop') {
        orderType = OrderType.TRAILING_STOP;
        price1 = Number(alertMessage.enterPrice)
            .toFixed(getDecimalPointLength(latestPrice))
            .toString();
        //if (alertMessage.order == 'buy')
        //{
        //const trailingAmount = latestPrice * ((alertMessage.trailingPercent) / 100);
        //price1 = (latestPrice + trailingAmount).toFixed(getDecimalPointLength(latestPrice)).toString();}
        /*else {
                const trailingAmount = latestPrice * (-(alertMessage.trailingPercent / 100));
                price = (latestPrice + trailingAmount).toFixed(getDecimalPointLength(latestPrice)).toString();
            }*/
    } else {
        orderType = OrderType.MARKET;
        price1 = latestPrice.toFixed(getDecimalPointLength(latestPrice)).toString();
    }

    const stepSize = parseFloat(marketsData.markets[market].stepSize);
    const stepDecimal = getDecimalPointLength(stepSize);
    const orderSizeStr = Number(orderSize).toFixed(stepDecimal);
    const price2 = parseFloat(price1);
    const tickSize = parseFloat(marketsData.markets[market].tickSize);
    const roundedPrice = Math.round(price2 / tickSize) * tickSize;

    const price3 = roundedPrice.toFixed(getDecimalPointLength(tickSize)).toString();

    const slippagePercentage = 0.05;
    if (alertMessage.type == 'market') {
        const minPrice =
            orderSide == OrderSide.BUY
                ? roundedPrice * (1 + slippagePercentage)
                : roundedPrice * (1 - slippagePercentage);

        const decimal = getDecimalPointLength(tickSize);
        const price3 = minPrice.toFixed(decimal);
    }

    let time1 = null;
    if (orderType == OrderType.LIMIT) {
        time1 = TimeInForce.GTT;
    } else if (orderType == OrderType.MARKET) {
        time1 = TimeInForce.FOK;
    } else {
        time1 = TimeInForce.IOC;
    }

    let reduceonly = false;
    if (orderType == OrderType.MARKET) {
        reduceonly = false;
    } else {
        reduceonly = alertMessage.reduceOnly;
    }

    const orderParams: dydxOrderParams = {
        market: market,
        side: orderSide,
        timeInForce: time1,
        postOnly: false,
        size: orderSizeStr,
        price: price3,
        limitFee: config.get('Dydx.User.limitFee'),
        expiration: dateStr,
        type: orderType,
        reduceOnly: reduceonly,
    };
    if (trailingpercent !== null) {
         // Check if orderSide is "sell" and convert trailingpercent to a negative value
        orderParams.trailingPercent = orderSide === OrderSide.SELL ? -trailingpercent : trailingpercent;
        orderParams.triggerPrice = price3;
    }
    if (trailingpercent == null && orderType == OrderType.TAKE_PROFIT) {
        orderParams.triggerPrice = price3;
    }

    console.log('orderParams for dydx', orderParams);
    return orderParams;
};
