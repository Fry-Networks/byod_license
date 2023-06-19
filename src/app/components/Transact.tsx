import React, { useState } from "react";
import {
  useWallet,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_PORT,
} from "@txnlab/use-wallet";
import algosdk from "algosdk";
import { sendMail, createLicense, syncLicensesGSheet, fetchCryptoPrice, setLicense } from "../classes/LicenseProcessor"
const algodClient = new algosdk.Algodv2(
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_PORT
);
const USDAmount = 20;
const FRYIndex = 924268058;
export default function Transact() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [email, setEmail] = useState('');
  const [valid, setValid] = useState(false);
  const sendTransaction = async (
    from: string,
    email: string
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
    try {
      const { id } = await sendTransactions(
        signedTransactions,
        waitRoundsToConfirm
      );
      const license = await createLicense();
      setLicense(from, license);
      sendMail(email, license);
      syncLicensesGSheet();
      alert("Transaction sent! You will receive an email with your license key shortly.");
    } catch (error) {
      console.error(error);
      alert("Transaction failed!");
    }

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
      <input
        type="email"
        value={email}
        onChange={e => {
          setEmail(e.target.value);
          setValid(/\S+@\S+\.\S+/g.test(e.target.value));
        }}
        placeholder="Enter your email"
        style={{
          color: 'black',
          padding: '10px',
          marginBottom: '10px',
          borderRadius: '5px',
        }}
      />
      <button
        onClick={() => sendTransaction(activeAddress, email)}
        style={{
          ...buttonStyle,
          backgroundColor: valid ? 'yellow' : 'grey',
        }}
        disabled={!valid}
      >
        Pay for the license (20 USD)
      </button>
    </div>
  );
}
