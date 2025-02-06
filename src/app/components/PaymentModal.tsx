"use client";
import React, { useContext, useEffect, useState } from "react";
import Modal from "react-modal";
import {
  repayLicense,
  getUserData,
  createUser,
  isUser,
  setUser,
} from "../classes/LicenseProcessor";
import AlgoPaymentButton from "./AlgoPaymentButton";
import FryPaymentButton from "./FryPaymentButton";
import Cross from "../assets/cross";
import Check from "../assets/check";
import { SplitPaymentModalProps } from "../types";
import { CSSTransition } from "react-transition-group";
import { MessagesContext, PaymentSuccessfulContext } from "./Transact";
require("dotenv").config();

const PaymentMethod = ({
  title,
  isPaid,
}: {
  title: string;
  isPaid: boolean;
}) => (
  <div style={flexContainerStyle}>
    <h3 style={titleStyle}>{title}</h3>
    {isPaid ? (
      <Check width={50} height={50} />
    ) : (
      <Cross width={50} height={50} />
    )}
  </div>
);
interface AnimatedElementsProps {
  children: React.ReactNode;
  inProp: boolean;
}

const AnimatedElements: React.FC<AnimatedElementsProps> = ({
  inProp,
  children,
}) => (
  <CSSTransition in={!inProp} timeout={300} classNames="card" unmountOnExit>
    {children}
  </CSSTransition>
);

const SplitPaymentModal = ({
  modalIsOpen,
  closeModal,
  activeAddress,
  email,
  sendAlgoTransaction,
  sendFryTransaction,
  valid,
}: SplitPaymentModalProps) => {
  const context = useContext(PaymentSuccessfulContext);
  const messagesContext = useContext(MessagesContext);
  if (!context) {
    throw new Error(
      "ChildComponent must be used within a PaymentSuccessfulProvider"
    );
  }
  if (!messagesContext) {
    throw new Error(
      "ChildComponent must be used within a TransactionMessageProvider"
    );
  }

  const { paymentSuccessful, setPaymentSuccessful } = context;
  const [paymentPrice, setPaymentPrice] = useState(105);
  const { messages, setTransactionMessages } = messagesContext;
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentPrice = async () => {
    const response = await fetch(
      `/api/price?projectName=${encodeURIComponent("BYOD")}`
    );
    const data = await response.json();

    if (data.success) {
      setPaymentPrice(data.data);
    }
  };

  useEffect(() => {
    if (valid && modalIsOpen) {
      fetchPaymentPrice();
      const fetchUser = async () => {
        if (!(await isUser(email))) {
          const user = await createUser(email);
          setUser(user);
        }
        const result = await getUserData(email);
        setPaymentSuccessful(result);
        setTimeout(() => setIsLoading(false), 1000); // Set loading to false after 1 second
      };

      fetchUser().catch((err) => {
        console.log(err);
      });
    }
  }, [email, modalIsOpen]);

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={modalStyles}
      contentLabel="Split Payment Modal"
    >
      <h1 style={headerStyle}>Payment</h1>
      <p style={{ textAlign: "center" }}>
        {`You will have to pay ${paymentPrice}$ USD (in $FRY) using your wallet. If you see an
        error, please contact us right away, and don't try to pay again.`}
        <br />
        <strong style={{ color: "red", fontSize: "20px" }}>
          It is HIGHLY recommended to browse this website using a computer, as
          mobile devices are known to have issues with the transaction system
          we're using (the responsible team is working on it)
        </strong>
      </p>
      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <PaymentMethod title="Algo Payment" isPaid={paymentSuccessful.algo} />

          <p
            style={{
              marginTop: "10px",
              marginBottom: "10px",
              textAlign: "center",
              color: messages.algo.color,
              boxSizing: "border-box",
            }}
          >
            {messages.algo.message}
          </p>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <AlgoPaymentButton
              sendTransaction={sendAlgoTransaction}
              from={activeAddress}
              email={email}
              isPaid={paymentSuccessful.algo}
            />
          )}
        </div> */}

        {/* <div style={{ width: "4px", backgroundColor: "red" }} /> */}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <PaymentMethod title="Fry Payment" isPaid={paymentSuccessful.fry} />
          <p
            style={{
              marginTop: "10px",
              marginBottom: "10px",
              textAlign: "center",
              color: messages.fry.color,
            }}
          >
            {messages.fry.message}
          </p>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <FryPaymentButton
              sendTransaction={sendFryTransaction}
              from={activeAddress}
              email={email}
              isPaid={paymentSuccessful.fry}
              enabled={true}
            />
          )}
        </div>
      </div>

      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
      >
        <button
          onClick={async () => {
            const payAgain = await repayLicense(email);
            if (payAgain) {
              setPaymentSuccessful({
                algo: true,
                fry: false,
              });

              setTransactionMessages({
                algo: {
                  message: "",
                  color: "#000",
                },
                fry: {
                  message: "",
                  color: "#000",
                },
              });
            } else {
              setTransactionMessages({
                algo: {
                  message: "",
                  color: "#000",
                },
                fry: {
                  message: "You can't pay for another license at the moment...",
                  color: "#FF0000",
                },
              });
            }
          }}
          style={{
            ...buttonStyle,
            backgroundColor: !paymentSuccessful.fry ? "#CCCCCC" : "yellow",
            display: !paymentSuccessful.fry ? "none" : "block",
          }}
          hidden={!paymentSuccessful.fry}
          disabled={!paymentSuccessful.fry}
        >
          Buy another license
        </button>

        <button
          onClick={() => {
            closeModal();
            setTransactionMessages({
              algo: {
                message: "",
                color: "#000",
              },
              fry: {
                message: "",
                color: "#000",
              },
            });
          }}
          style={buttonStyle}
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

const modalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    borderRadius: "20px",
    color: "black",
    transition: "opacity 0.4s",
  },
};

const buttonStyle = {
  backgroundColor: "yellow",
  border: "none",
  color: "black",
  padding: "15px 32px",
  textDecoration: "none",
  display: "inline-block",
  fontSize: "16px",
  margin: "4px 2px",
  cursor: "pointer",
  borderRadius: "5px",
};

const headerStyle = {
  textAlign: "center",
  fontSize: "20px",
  fontWeight: "bold",
} as const;
const flexContainerStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
} as const;
const titleStyle = { marginRight: "10px" } as const;

export default SplitPaymentModal;
