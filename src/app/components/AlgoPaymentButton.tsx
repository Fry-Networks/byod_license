import React, { useContext, useState } from 'react';
import { MessagesContext } from './Transact';
const AlgoPaymentButton = ({ sendTransaction, from, email, isPaid }: { sendTransaction: (from: string, email: string) => Promise<void>, from: string, email: string, isPaid: boolean }) => {
  // Introduce a loading state
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(MessagesContext);

  if (!context) {
    throw new Error("ChildComponent must be used within a TransactionMessageProvider");
  }

  const { messages, setTransactionMessages } = context;
  // Update the sendTransaction function to handle the loading state
  const handleTransaction = async (from: string, email: string) => {
    setIsLoading(true);

    try {
      await sendTransaction(from, email);
    } catch (error: any) {
      console.log(error.message);
      setTransactionMessages({
        ...messages,
        algo: {
          message: error.message,
          color: "#f00"
        }
      });
      setIsLoading(false);
    }
    setIsLoading(false);
  }
  const condition = (isPaid || isLoading)

  if (!isPaid) {
    return (
      <button
        onClick={() => handleTransaction(from, email)}
        style={{
          ...buttonStyle,
          backgroundColor: !isPaid && !isLoading ? 'yellow' : 'grey',
          cursor: !isPaid && !isLoading ? 'pointer' : 'default',
          display: (isPaid) ? 'none' : 'inline-block'
        }}
        disabled={condition}
        hidden={isPaid}

      >
        {isLoading ? 'Processing...' : '$ALGO Payment (52,50$ USD)'}
      </button>
    );
  }
  else return null;
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

export default AlgoPaymentButton;
