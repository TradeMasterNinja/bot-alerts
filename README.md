```bash
// Retrieve the JSON string from local storage
var starkKeysJSON = localStorage.getItem('STARK_KEY_PAIRS');
var apiKeysJSON = localStorage.getItem('API_KEY_PAIRS');

// Parse the JSON string into a JavaScript object
var starkKeysObject = JSON.parse(starkKeysJSON);
var apiKeysObject = JSON.parse(apiKeysJSON);

// Get the wallet address key
var addressKey = Object.keys(starkKeysObject)[0];

// build .env
var env = `
# Required variables for dydx
ETH_ADDRESS=${addressKey}
STARK_PUBLIC_KEY=${starkKeysObject[addressKey].publicKey}
STARK_PRIVATE_KEY=${starkKeysObject[addressKey].privateKey}
API_KEY=${apiKeysObject[addressKey].key}
API_PASSPHRASE=${apiKeysObject[addressKey].passphrase}
API_SECRET=${apiKeysObject[addressKey].secret}

# Required variables for perpetual protocol
PERPETUAL_PRIVATE_KEY=

# Optional variables
TRADINGVIEW_PASSPHRASE=
SENTRY_DNS=`

// PRINT RESULTS TO COPY
console.log(env);
```
