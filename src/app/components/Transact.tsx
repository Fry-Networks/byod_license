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
import { confirmTransaction } from "../classes/TransactionProcessor";
const USDAmount = process.env.NODE_ENV === 'production' ? 52.50 : 0.0030;

const FRYIndex = 924268058;

interface MessagesState {
  messages: {
    algo: {
      message: string;
      color: string;
    },
    fry: {
      message: string;
      color: string;
    }
  };
  setTransactionMessages: React.Dispatch<React.SetStateAction<{
    algo: {
      message: string;
      color: string;
    },
    fry: {
      message: string;
      color: string;
    }
  }>>;
}


interface PaymentSuccessfulState {
  paymentSuccessful: UserData;
  setPaymentSuccessful: React.Dispatch<React.SetStateAction<UserData>>;
}

export const PaymentSuccessfulContext = React.createContext<PaymentSuccessfulState | undefined>(undefined);



export const MessagesContext = React.createContext<MessagesState | undefined>(undefined);


export default function Transact() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [email, setEmail] = useState('');
  const [valid, setValid] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [messages, setMessages] = useState({
    algo: {
      message: "",
      color: "#000"
    },
    fry: {
      message: "",
      color: "#000"
    }
  });

  const [paymentSuccessful, setPaymentSuccessful] = useState({} as UserData);

  const showSplitPaymentModal = () => {
    setModalIsOpen(true);
    if (!isUser(email)) createUser(email);
  };
  const closeModal = () => {
    setModalIsOpen(false);
  };
  const sendAlgoTransaction = async (
    from: string,
    email: string
  ) => {
    if (!from) {
      throw new Error("Missing transaction params.");
    }
    const to = "ATPVJYGEGP5H6GCZ4T6CG4PK7LH5OMWXHLXZHDPGO7RO6T3EHWTF6UUY6E"
    console.log("Sending transaction from: ", from, " to: ", to);

    const params = await algodClient.getTransactionParams().do();
    let price = await fetchCryptoPrice("algo");
    if (price) price = Math.floor((USDAmount / price));
    else return;
    const note = algosdk.encodeObj({ note: 'Payment from Pera Wallet' });
    const transaction = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from,
      to,
      amount: price * 1000000,
      note: note,
      suggestedParams: params,
    });
    const encodedTransaction = algosdk.encodeUnsignedTransaction(transaction);

    const signedTransactions = await signTransactions([encodedTransaction]);

    const waitRoundsToConfirm = 2;
    try {
      setMessages({
        ...messages,
        algo: {
          message: "Please wait for 2 rounds to confirm the transaction...",
          color: "#000"
        }
      })
      const { id } = await sendTransactions(
        signedTransactions,
        waitRoundsToConfirm
      );
      if (!id) {
        setMessages({
          ...messages,
          algo: {
            message: "Transaction failed!",
            color: "#e5424d"
          }
        })
        return;
      }
      const isTxValid = await confirmTransaction(id, "algo", email)

      if (isTxValid !== 0) {
        setMessages({
          ...messages,
          algo: {
            message: "Transaction didn't match! code: " + isTxValid,
            color: "#e5424d"
          }
        })
      } else {
        const data = paymentSuccessful;
        paymentSuccessful.algo = true;
        setPaymentSuccessful(data);
        setMessages({
          ...messages,
          algo: {
            message: "Successfully sent transaction! You can now make the second FRY payment.",
            color: "#72AE55"
          }
        })
      }

    } catch (error: any) {
      console.error(error);
      setMessages({
        ...messages,
        algo: {
          message: error.message || "Transaction failed!",
          color: "#e5424d"
        }
      })
    }
  };
  const sendFryTransaction = async (
    from: string,
    email: string
  ) => {
    if (!from) {
      throw new Error("Missing transaction params.");
    }
    //const to = "ATPVJYGEGP5H6GCZ4T6CG4PK7LH5OMWXHLXZHDPGO7RO6T3EHWTF6UUY6E"
    const burn = "MO3FUXGKGZRTVYOSCXR3FXMPZQCZHR2BGGT2B5SINVBA3W6YCZNO25GGLM"
    console.log("Sending transaction (burn) from: ", from, " to: ", burn);

    const params = await algodClient.getTransactionParams().do();
    let price = await fetchCryptoPrice("fry");
    if (price) price = Math.floor((USDAmount / price));
    else {
      setMessages({
        ...messages,
        fry: {
          message: "Transaction failed! (price)",
          color: "#e5424d"
        }
      })
    }
    const note = algosdk.encodeObj({ note: 'BYOD Payment' });
    const transaction = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from,
      to: burn,
      assetIndex: FRYIndex,
      amount: price * 1000000,
      note: note,
      suggestedParams: params,
    });
    const encodedTransaction = algosdk.encodeUnsignedTransaction(transaction);

    const signedTransactions = await signTransactions([encodedTransaction]);
    const waitRoundsToConfirm = 2;
    try {
      setMessages({
        ...messages,
        fry: {
          message: "Please wait for 2 rounds to confirm the transaction...",
          color: "#000"
        }
      })
      const { id } = await sendTransactions(
        signedTransactions,
        waitRoundsToConfirm
      );
      if (!id) {
        setMessages({
          ...messages,
          fry: {
            message: "Transaction failed!",
            color: "#e5424d"
          }
        })
        return;
      }
      const license = await createLicense(email, from, id);
      if (license?.includes("spoofed")) {
        setMessages({
          ...messages,
          fry: {
            message: "Transaction didn't match!",
            color: "#e5424d"
          }
        })
      } else if (license) {
        const data = paymentSuccessful;
        paymentSuccessful.fry = true;
        setPaymentSuccessful(data);
        setMessages({
          ...messages,
          fry: {
            message: "Transaction sent! You will receive an email with your license key shortly.",
            color: "#72AE55"
          }
        })
      } else {
        setMessages({
          ...messages,
          fry: {
            message: "Transaction failed!",
            color: "#e5424d"
          }
        })

        console.error("Transaction failed!");
      }

    } catch (error: any) {
      console.error(error);

      setMessages({
        ...messages,
        fry: {
          message: error.message || "Transaction failed!",
          color: "#e5424d"
        }
      })



    }
  };

  if (!activeAddress) {
    return <p>Connect an account first.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <PaymentSuccessfulContext.Provider value={{ paymentSuccessful, setPaymentSuccessful }}>
        <MessagesContext.Provider value={{ messages, setTransactionMessages: setMessages }}>

          <SplitPaymentModal
            modalIsOpen={modalIsOpen}
            closeModal={closeModal}
            activeAddress={activeAddress}
            email={email}
            sendAlgoTransaction={sendAlgoTransaction}
            sendFryTransaction={sendFryTransaction}
            valid={valid}
          />
          <EmailInput email={email} setEmail={setEmail} setValid={setValid} />
          <OpenButton valid={valid} showSplitPaymentModal={showSplitPaymentModal} />
        </MessagesContext.Provider>
      </PaymentSuccessfulContext.Provider>
    </div>
  );
}
