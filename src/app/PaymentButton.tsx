'use client';
import React, { useEffect, useState } from 'react';
import {PeraWalletConnect} from "@perawallet/connect";
import axios from 'axios';
import { Buffer } from 'buffer';
import {  getTransaction, sendTransaction } from './PaymentProcessor';
import algosdk from 'algosdk';

const peraWallet = new PeraWalletConnect();

function PaymentButton() {
  const [accountAddress, setAccountAddress] = useState('');
  const isConnectedToPeraWallet = accountAddress !== 'null';

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);

      if (accounts.length) {
        setAccountAddress(accounts[0]);
      }
    });
  }, []);

  function handleConnectWalletClick() {

    console.log("connect wallet clicked");
    peraWallet
      .connect()
      .then((newAccounts) => {
        peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);
        setAccountAddress(newAccounts[0]);
      })
  }

  function handleDisconnectWalletClick() {
    peraWallet.disconnect();
    setAccountAddress('null');
  }

  async function handlePayment(accountAddress: string) {

    const txn = await getTransaction(accountAddress);
    if(!txn) return;
    //decode the base64 txn to an object
    const decodedTxn = algosdk.decodeUnsignedTransaction(txn); 
    const singleTxnGroups= [
        {
            txn: decodedTxn,
            signers: [accountAddress],
        }
    ];
    const signedTxn = await peraWallet.signTransaction([singleTxnGroups]);
    const base64SignedTxnArray = signedTxn.map(txn => Buffer.from(txn).toString('base64'));



    const sent = await sendTransaction(base64SignedTxnArray);
    if(!sent) return;
    alert("Payment Successful!");
    console.log(sent);
    
  }

  return (
    <div>
      <button 
        style={{
            backgroundColor: 'yellow',
            color: 'black',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            height: '50px',
            width: '200px',
            cursor: 'pointer',
            margin: 'auto',
            justifyContent: 'center',
        }}
        onClick={isConnectedToPeraWallet ? () => handlePayment(accountAddress) : handleConnectWalletClick}

      >
        {isConnectedToPeraWallet ? "Pay with Pera" : "Connect to Pera Wallet"}
      </button>
    </div>
  );
};

export default PaymentButton;
