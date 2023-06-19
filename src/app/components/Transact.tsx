import React, { useEffect, useState } from "react";
import Modal from 'react-modal';
import {
  useWallet,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_PORT,
} from "@txnlab/use-wallet";
import algosdk from "algosdk";
import { sendMail, createLicense, syncLicensesGSheet, fetchCryptoPrice, setLicense, getUser, User } from '../classes/LicenseProcessor';
import Cross from "../assets/cross";
import Check from "../assets/check";
Modal.setAppElement('#home');
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
      <SplitPaymentModal modalIsOpen={modalIsOpen} closeModal={closeModal} activeAddress={activeAddress} email={email} sendTransaction={sendTransaction} valid={valid} showSplitPaymentModal={showSplitPaymentModal} />
      <EmailInput email={email} setEmail={setEmail} setValid={setValid} />
      <OpenButton valid={valid} showSplitPaymentModal={showSplitPaymentModal} />
    </div>
  );
}

const PaymentButton = ({ valid, showSplitPaymentModal }: PaymentButtonProps) => (
  <button
    // onClick={() => sendTransaction(activeAddress, email)}
    onClick={() => showSplitPaymentModal()}
    style={{
      ...buttonStyle,
      backgroundColor: valid ? 'yellow' : 'grey',
    }}
    disabled={!valid}
  >
    Pay for the license (20 USD)
  </button>
);

const OpenButton = ({ valid, showSplitPaymentModal }: PaymentButtonProps) => (
  <button
    // onClick={() => sendTransaction(activeAddress, email)}
    onClick={() => showSplitPaymentModal()}
    style={{
      ...buttonStyle,
      backgroundColor: valid ? 'yellow' : 'grey',
    }}
    disabled={!valid}
  >
    Pay for the license (20 USD)
  </button>
);

const SplitPaymentModal = ({ modalIsOpen, closeModal, activeAddress, email, sendTransaction, valid, showSplitPaymentModal }: SplitPaymentModalProps) => {
  const [user, setUser] = useState({} as User);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await getUser(email);
      setUser(result);
    };

    fetchUser();
  }, [email]);

  const stripePaid = user.stripe;
  const fryPaid = user.fry;
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={modalStyles}
      contentLabel="Split Payment Modal"
    >
      <h1 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>Payment</h1>
      <p>
        You will have to pay 10USD using Stripe and 10USD (in $FRY) using your wallet.
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
        <div style={{ flex: 1, paddingRight: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{marginRight:'10px'}}>Stripe Payment</h3>
            {stripePaid ? <Check width={50} height={50} /> : <Cross width={50} height={50} /> }
          </div>
        </div>
  
        <div style={{ borderLeft: '4px solid #CCCCCC', height: '100%', minHeight: '150px', borderRadius: '15%', marginTop: '10px' }} />
  
        <div style={{ flex: 1, paddingLeft: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{marginRight:'10px'}}>Wallet Payment</h3>
            {fryPaid ? <Check width={50} height={50} /> : <Cross width={50} height={50} /> }
          </div>
          <PaymentButton valid={valid} showSplitPaymentModal={showSplitPaymentModal} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <button onClick={closeModal} style={buttonStyle}>Close</button>
      </div>
    </Modal>
  );
  
  

  
};


const EmailInput = ({ email, setEmail, setValid }: EmailProps) => (
  <input
    type="email"
    value={email}
    autoComplete="off"
    data-lpignore="true"
    data-form-type="other"
    onChange={e => {

      setEmail(e.target.value);

      setValid(/\S+@\S+\.\S+/g.test(e.target.value));
    }}
    placeholder="Enter your email"
    style={emailInputStyle}
  />
);

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '20px', // Rounded corners
    color: 'black',
    transition: 'opacity 0.4s'
  },
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
  borderRadius: '5px',
};

const emailInputStyle = {
  color: 'black',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '5px',
};


interface EmailProps {
  email: string;
  setEmail: (email: string) => void;
  setValid: (valid: boolean) => void;
}

interface PaymentButtonProps {
  valid: boolean;
  showSplitPaymentModal: () => void;
}

interface SplitPaymentModalProps {
  modalIsOpen: boolean;
  closeModal: () => void;
  activeAddress: string;
  email: string;
  sendTransaction: (from: string, email: string) => void;
  valid: boolean;
  showSplitPaymentModal: () => void;
}