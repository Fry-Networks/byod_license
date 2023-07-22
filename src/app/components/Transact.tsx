import React, { useContext, useState } from "react";
import {
  useWallet
} from "@txnlab/use-wallet";
import algosdk from "algosdk";
import {
   createLicense,
  fetchCryptoPrice, createUser, isUser, UserData
} from '../classes/LicenseProcessor';
import SplitPaymentModal from './PaymentModal';
import algodClient from '../algodClient';
import EmailInput from './EmailInput';
import OpenButton from './OpenButton';
const USDAmount = process.env.NODE_ENV === 'production' ? 52.50 : 0.0030;
const FRYIndex = 924268058;

interface TransactionMessageState {
  transactionMessage: {
    message: string;
    color: string;
  };
  setTransactionMessage: React.Dispatch<React.SetStateAction<{
    message: string;
    color: string;
  }>>;
}

interface PaymentSuccessfulState {
  paymentSuccessful: UserData;
  setPaymentSuccessful: React.Dispatch<React.SetStateAction<UserData>>;
}

export const PaymentSuccessfulContext = React.createContext<PaymentSuccessfulState | undefined>(undefined);



export const TransactionMessageContext = React.createContext<TransactionMessageState | undefined>(undefined);


export default function Transact() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [email, setEmail] = useState('');
  const [valid, setValid] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [transactionMessage, setTransactionMessage] = useState({
    message: "",
    color: "#000"
  });

  const [paymentSuccessful, setPaymentSuccessful] = useState({} as UserData);

  const showSplitPaymentModal = () => {
    setModalIsOpen(true);
    if (!isUser(email)) createUser(email);
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

    const waitRoundsToConfirm = 2;
    try {
      setTransactionMessage({
        message: "Please wait for 2 rounds to confirm the transaction..."
        , color: "#000"
      });
      const { id } = await sendTransactions(
        signedTransactions,
        waitRoundsToConfirm
      );
      if(!id) {
        setTransactionMessage({
          message: "Transaction failed!",
          color: "#e5424d"
        })
        return;
      }
      const license = await createLicense(email, activeAddress!,id);
      if(license === 'spoofed transaction') {
        setTransactionMessage({
          message: "Transaction didn't match!",
          color: "#e5424d"
        })
      }else if (license) {
        const data = paymentSuccessful;
        paymentSuccessful.fry = true;
        setPaymentSuccessful(data);
        setTransactionMessage({
          message: "Transaction sent! You will receive an email with your license key shortly.",
          color: "#72AE55"
        })
      } else {
        setTransactionMessage({
          message: "Transaction failed!",
          color: "#e5424d"
        })
        console.error("Transaction failed!");
      }

    } catch (error: any) {
      console.error(error);
      setTransactionMessage({
        message: error.message || "Transaction failed!",
        color: "#e5424d"
      })
    }
  };

  if (!activeAddress) {
    return <p>Connect an account first.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <PaymentSuccessfulContext.Provider value={{ paymentSuccessful, setPaymentSuccessful }}>
        <TransactionMessageContext.Provider value={{ transactionMessage, setTransactionMessage }}>
          <SplitPaymentModal
            modalIsOpen={modalIsOpen}
            closeModal={closeModal}
            activeAddress={activeAddress}
            email={email}
            sendTransaction={sendTransaction}
            valid={valid}
            transactionMessage={transactionMessage}
          />
          <EmailInput email={email} setEmail={setEmail} setValid={setValid} />
          <OpenButton valid={valid} showSplitPaymentModal={showSplitPaymentModal} />
        </TransactionMessageContext.Provider>
      </PaymentSuccessfulContext.Provider>
    </div>
  );
}
