'use server';
import algosdk from 'algosdk';
import axios from 'axios';

const receiverWallet = 'ATPVJYGEGP5H6GCZ4T6CG4PK7LH5OMWXHLXZHDPGO7RO6T3EHWTF6UUY6E';
const USDAmount = 20;
const FRYIndex = 924268058;

// Initialize Algorand node connection parameters
const token = "REDACTED_ROTATE_ME";
const server = "https://mainnet-algorand.api.purestake.io/ps2";
const tokenToSend = {
    'X-API-Key': token
}

const algodClient = new algosdk.Algodv2(tokenToSend, server, '443');
const capKey = "REDACTED_ROTATE_ME"
const FRYCapID = 24874;
async function fetchCryptoPrice() {
    try {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest', {
            params: {
                id: FRYCapID,
                convert: 'USD'
            },
            headers: {
                'X-CMC_PRO_API_KEY': capKey
            }
        });
        const price = response.data.data[FRYCapID].quote.USD.price;
        return price;
    } catch (error) {
        console.error(error);
    }
}

export async function getTransaction(address: string) {
    let price = await fetchCryptoPrice();
    if (price) price = Math.floor((USDAmount / price));
    else return;
    console.log(price);
    const params = await algodClient.getTransactionParams().do();
    const note = algosdk.encodeObj({ note: 'Payment from Pera Wallet' });
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: address,
        to: receiverWallet,
        assetIndex: FRYIndex,
        amount: price * 1000000,
        note: note,
        suggestedParams: params,
    });
    //encode the txn as base64
    const encoded = algosdk.encodeUnsignedTransaction(txn);
    return encoded;
}
export async function sendTransaction(base64SignedTxnArray: string[]) {
    try {
        const signedTxn = base64SignedTxnArray.map(base64 => new Uint8Array(Buffer.from(base64, 'base64')));
        const tx = await algodClient.sendRawTransaction(signedTxn).do();
        return tx;
    } catch (error) {
        console.error(error);
    }
}