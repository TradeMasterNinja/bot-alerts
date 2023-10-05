import {

	OrderSide,
	OrderType,
	TimeInForce,
	Market
} from '@dydxprotocol/v3-client';
import { PositionSide } from '@perp/sdk-curie';

export type AlertObject = {
	market: string;
	order: string;
	size: number;
	sizeUsd?: number;
	reverse?: boolean;
	strategy: string;
	type: string;
	enterPrice?: number; 
	trailingPercent?: string | null;
	passphrase?: string;
	position: string;
	exchange: string;
	sizeByLeverage?: number;
	reduceOnly?: boolean;
  };

export type dydxOrderParams {
  market: Market;
  side: OrderSide;
  type: OrderType;
  size: string;
  price: string;
  //clientId: string;
  timeInForce?: TimeInForce.FOK | TimeInForce.IOC | null | TimeInForce.GTT;
  postOnly: boolean;
  limitFee: string;
  expiration: string;
  //cancelId?: string;
  reduceOnly?: boolean;
  triggerPrice?: string;
  trailingPercent?: string;
}

export type perpOrderParams = {
	tickerSymbol: string;
	side: PositionSide;
	amountInput: number;
	isAmountInputBase: boolean;
	referralCode: string;
};
