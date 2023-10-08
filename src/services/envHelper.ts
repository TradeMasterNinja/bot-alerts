// 1) LOGIN TO DYDX WITH TRADING AND REMEMBER ME ENABLED
// 2) PASTE THIS JAVASCRIPT INTO BROWSER CONSOLE AND PRESS ENTER TO AUTO BUILD EVERYTHING NEEDED FOR .env FILE
// 3) COPY THE OUTPUT THAT IS PRINTED TO THE CONSOLE
// 4) USE COPIED DATA IN THE .env FILE

// Retrieve the JSON string from local storage
const starkKeysJSON = localStorage.getItem('STARK_KEY_PAIRS');
const apiKeysJSON = localStorage.getItem('API_KEY_PAIRS');

// Parse the JSON string into a JavaScript object
const starkKeysObject = JSON.parse(starkKeysJSON || '{}');
const apiKeysObject = JSON.parse(apiKeysJSON || '{}');

// Get the wallet address key
const addressKey = Object.keys(starkKeysObject)[0];

// build .env
const env = `
# Required variables for dydx
ETH_ADDRESS=${addressKey}
STARK_PUBLIC_KEY=${starkKeysObject[addressKey]?.publicKey || ''}
STARK_PRIVATE_KEY=${starkKeysObject[addressKey]?.privateKey || ''}
API_KEY=${apiKeysObject[addressKey]?.key || ''}
API_PASSPHRASE=${apiKeysObject[addressKey]?.passphrase || ''}
API_SECRET=${apiKeysObject[addressKey]?.secret || ''}

# Required variables for perpetual protocol
PERPETUAL_PRIVATE_KEY=

# Optional variables
TRADINGVIEW_PASSPHRASE=
SENTRY_DNS=`;

// PRINT RESULTS TO COPY
console.log(env);
