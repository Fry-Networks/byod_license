import React from 'react';

const PaymentButton = ({ valid, showSplitPaymentModal }: { valid: boolean, showSplitPaymentModal: Function }) => (
  <button
    onClick={() => showSplitPaymentModal()}
    style={{
      ...buttonStyle,
      backgroundColor: valid ? 'yellow' : 'grey',
    }}
    disabled={!valid}
  >
    Pay for the license (105 USD)
  </button>
);

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
