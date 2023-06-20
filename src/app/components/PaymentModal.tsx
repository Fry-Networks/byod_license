import React, { useEffect, useState } from "react";
import Modal from 'react-modal';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from "./CheckoutForm";
import { getUser, User } from '../classes/LicenseProcessor';
import PaymentButton from './PaymentButton';
import Cross from "../assets/cross";
import Check from "../assets/check";
import { SplitPaymentModalProps } from '../types';

require('dotenv').config();

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);
Modal.setAppElement('#home');

const PaymentMethod = ({ title, isPaid }: { title: string, isPaid: boolean }) => (
  <div style={flexContainerStyle}>
    <h3 style={titleStyle}>{title}</h3>
    {isPaid ? <Check width={50} height={50} /> : <Cross width={50} height={50} />}
  </div>
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
      <h1 style={headerStyle}>Payment</h1>
      <p>
        You will have to pay 52,50$ USD using Stripe and 52,50$ USD (in $FRY) using your wallet.
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
        <div style={{ flex: 1, paddingRight: '10px' }}>
          <PaymentMethod title="Stripe Payment" isPaid={stripePaid} />

          <Elements stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        </div>

        <div style={{ borderLeft: '4px solid #CCCCCC', height: '100%', minHeight: '150px', borderRadius: '15%', marginTop: '10px' }} />

        <div style={{ flex: 1, paddingLeft: '10px' }}>
          <PaymentMethod title="Wallet Payment" isPaid={fryPaid} />
          <PaymentButton valid={valid} showSplitPaymentModal={showSplitPaymentModal} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <button onClick={closeModal} style={buttonStyle}>Close</button>
      </div>
    </Modal>
  );
};

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '20px',
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

const headerStyle = { textAlign: 'center', fontSize: '20px', fontWeight: 'bold' } as const;
const flexContainerStyle = { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' } as const;
const titleStyle = { marginRight: '10px' } as const;

export default SplitPaymentModal;
