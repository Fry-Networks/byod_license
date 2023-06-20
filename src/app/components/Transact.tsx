import React, { useState } from "react";
import {
  useWallet
} from "@txnlab/use-wallet";
import algosdk from "algosdk";
import {
  sendMail, createLicense, syncLicensesGSheet,
  fetchCryptoPrice, setLicense, getUser, User
} from '../classes/LicenseProcessor';
import SplitPaymentModal from './PaymentModal';
import algodClient from '../algodClient';
import EmailInput from './EmailInput';
import OpenButton from './OpenButton';
const USDAmount = 20;
const FRYIndex = 924268058;

export default function Transact() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [email, setEmail] = useState('');
  const [valid, setValid] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const showSplitPaymentModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

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

  if (!activeAddress) {
    return <p>Connect an account first.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <SplitPaymentModal 
        modalIsOpen={modalIsOpen} 
        closeModal={closeModal} 
        activeAddress={activeAddress} 
        email={email} 
        sendTransaction={sendTransaction} 
        valid={valid} 
        showSplitPaymentModal={showSplitPaymentModal} 
      />
      <EmailInput email={email} setEmail={setEmail} setValid={setValid} />
      <OpenButton valid={valid} showSplitPaymentModal={showSplitPaymentModal} />
    </div>
  );
}
