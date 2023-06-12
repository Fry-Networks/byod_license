import React from "react";
import {
  useWallet,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_PORT,
} from "@txnlab/use-wallet";
import algosdk from "algosdk";
import axios from "axios";

const algodClient = new algosdk.Algodv2(
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_PORT
);
const USDAmount = 20;
const FRYIndex = 924268058;

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



export default function Transact() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();

  const sendTransaction = async (
    from?: string
  ) => {
    if (!from) {
      throw new Error("Missing transaction params.");
    }
    const to = "ATPVJYGEGP5H6GCZ4T6CG4PK7LH5OMWXHLXZHDPGO7RO6T3EHWTF6UUY6E"
    console.log("Sending transaction from: ", from, " to: ", to);
    const params = await algodClient.getTransactionParams().do();
    let price = await fetchCryptoPrice();
    if (price) price = Math.floor((USDAmount / price));
    else return;
    const note = algosdk.encodeObj({ note: 'Payment from Pera Wallet' });
    const transaction = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from,
        to,
        assetIndex: FRYIndex,
        amount: price * 1000000,
        note: note,
        suggestedParams: params,
    });
    const encodedTransaction = algosdk.encodeUnsignedTransaction(transaction);

    const signedTransactions = await signTransactions([encodedTransaction]);

    const waitRoundsToConfirm = 4;

    const { id } = await sendTransactions(
      signedTransactions,
      waitRoundsToConfirm
    );

    console.log("Successfully sent transaction. Transaction ID: ", id);
  };

  const buttonStyle = {
    backgroundColor: 'yellow',
    border: 'none',
    color: 'black',
    padding: '15px 32px',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    cursor: 'pointer',
    borderRadius: '5px', // This will make the button round
  };

  if (!activeAddress) {
    return <p>Connect an account first.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <button
        onClick={() => sendTransaction(activeAddress)}
        style={buttonStyle}
      >
        Pay for the license (20 USD)
      </button>
    </div>
  );
}
