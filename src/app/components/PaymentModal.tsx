import React, { useContext, useEffect, useState } from "react";
import Modal from 'react-modal';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from "./CheckoutForm";
import { getUserData, UserData } from '../classes/LicenseProcessor';
import PaymentButton from './PaymentButton';
import Cross from "../assets/cross";
import Check from "../assets/check";
import { SplitPaymentModalProps } from '../types';
import { CSSTransition } from 'react-transition-group';
import { PaymentSuccessfulContext, TransactionMessageContext } from "./Transact";
require('dotenv').config();





const PaymentMethod = ({ title, isPaid }: { title: string, isPaid: boolean }) => (
    <div style={flexContainerStyle}>
        <h3 style={titleStyle}>{title}</h3>
        {isPaid ? <Check width={50} height={50} /> : <Cross width={50} height={50} />}
    </div>
);
interface AnimatedElementsProps {
    children: React.ReactNode;
    inProp: boolean;
}

const AnimatedElements: React.FC<AnimatedElementsProps> = ({ inProp, children }) => (
    <CSSTransition in={!inProp} timeout={300} classNames="card" unmountOnExit>
        {children}
    </CSSTransition>
);

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const SplitPaymentModal = ({ modalIsOpen, closeModal, activeAddress, email, sendTransaction, valid, transactionMessage }: SplitPaymentModalProps) => {
    const context = useContext(PaymentSuccessfulContext);
    const messageContext = useContext(TransactionMessageContext);
    if (!context) {
        throw new Error("ChildComponent must be used within a PaymentSuccessfulProvider");
    }
    if (!messageContext) {
        throw new Error("ChildComponent must be used within a TransactionMessageProvider");
    }

    const { paymentSuccessful, setPaymentSuccessful } = context;
    const { setTransactionMessage } = messageContext;
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (valid) {
            const fetchUser = async () => {
                const result = await getUserData(email);
                setPaymentSuccessful(result);
                setTimeout(() => setIsLoading(false), 1000); // Set loading to false after 1 second
            };

            fetchUser();
        }
    }, [email]);

    return (
        <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            style={modalStyles}
            contentLabel="Split Payment Modal"
        >
            <h1 style={headerStyle}>Payment</h1>
            <p style={{ textAlign: 'center' }}>
                You will have to pay 52,50$ USD using Stripe and 52,50$ USD (in $FRY) using your wallet.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', alignItems: 'stretch', position: 'relative' }}> {/* Added position: relative here */}
                <div style={{ flex: 1, paddingRight: '10px' }}>
                    <PaymentMethod title="Stripe Payment" isPaid={paymentSuccessful.stripe} />
                    <div style={{ marginTop: '10px' }}>
                        <AnimatedElements inProp={paymentSuccessful.stripe}>
                            <Elements stripe={stripePromise}>
                                <CheckoutForm email={email} payment={{
                                    data: paymentSuccessful,
                                    setData: setPaymentSuccessful
                                }} />
                            </Elements>
                        </AnimatedElements>
                    </div>
                </div>

                <div style={{ position: 'absolute', left: '50%', borderLeft: '4px solid #CCCCCC', height: '100%', borderRadius: '10%' }} /> {/* Adjust this div */}
                <div style={{ flex: 1, paddingLeft: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <PaymentMethod title="Wallet Payment" isPaid={paymentSuccessful.fry} />
                    <p style={{ marginTop: '10px', marginBottom: '10px', textAlign: 'center', color: transactionMessage.color }}>{transactionMessage.message}</p>
                    {isLoading ? <p>Loading...</p> : <PaymentButton valid={paymentSuccessful.stripe} sendTransaction={sendTransaction} from={activeAddress} email={email} isPaid={paymentSuccessful.fry} />}


                </div>

            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button onClick={
                    () => {
                        closeModal();
                        setTransactionMessage({
                            message: "",
                            color: "#000"   
                        });
                        
                    }
                } style={buttonStyle}>Close</button>
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
