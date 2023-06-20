import React, { useContext, useState } from 'react';
import { TransactionMessageContext } from './Transact';
const PaymentButton = ({ valid,  sendTransaction, from, email }: { valid: boolean,  sendTransaction: (from: string, email: string) => Promise<void>, from: string, email: string }) => {
  // Introduce a loading state
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(TransactionMessageContext);

  if (!context) {
    throw new Error("ChildComponent must be used within a TransactionMessageProvider");
  }

  const { transactionMessage, setTransactionMessage } = context;
  // Update the sendTransaction function to handle the loading state
  const handleTransaction = async (from: string, email: string) => {
    setIsLoading(true);
    try {
    await sendTransaction(from, email);
    } catch (error: any) {
      console.log(error.message);
      setTransactionMessage(error.message);
      setIsLoading(false);
    }
    setIsLoading(false);
  }

  return (
    <button
      onClick={() => handleTransaction(from, email)}
      style={{
        ...buttonStyle,
        backgroundColor: valid && !isLoading ? 'yellow' : 'grey',
        cursor: valid && !isLoading ? 'pointer' : 'default',
      }}
      disabled={!valid || isLoading}
    >
      {isLoading ? 'Processing...' : 'Pay for the license (52,50$ USD)'}
    </button>
  );
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

export default PaymentButton;
