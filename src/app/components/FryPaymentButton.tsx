import React, { useContext, useState } from 'react';
import { MessagesContext } from './Transact';
const FryPaymentButton = ({ sendTransaction, from, email, isPaid, enabled }: { sendTransaction: (from: string, email: string) => Promise<void>, from: string, email: string, isPaid: boolean, enabled: boolean }) => {
  // Introduce a loading state
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(MessagesContext);

  if (!context) {
    throw new Error("ChildComponent must be used within a TransactionMessageProvider");
  }

  const { messages, setTransactionMessages } = context;
  // Update the sendTransaction function to handle the loading state
  const handleTransaction = async (from: string, email: string) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await sendTransaction(from, email);
    } catch (error: any) {
      console.log(error.message);
      setTransactionMessages({
        ...messages,
        fry: {
          message: error.message,
          color: "#f00"
        }
      });
      setIsLoading(false);
    }
    setIsLoading(false);
  }
  const condition = (!enabled || isLoading)
  if (!isPaid) {
    return (
      <button
        onClick={async () => await handleTransaction(from, email)}
        style={{
          ...buttonStyle,
          backgroundColor: enabled && !isLoading ? 'yellow' : 'grey',
          cursor: enabled && !isLoading ? 'pointer' : 'default',
          display: (!enabled) ? 'none' : 'inline-block'
        }}
        disabled={condition && !isPaid}
        hidden={condition}

      >
        {isLoading ? 'Processing...' : '$FRY Payment (52,50$ USD)'}
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

export default FryPaymentButton;
