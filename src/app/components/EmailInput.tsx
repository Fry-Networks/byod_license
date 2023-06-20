import React from 'react';

const EmailInput = ({ email, setEmail, setValid }: { email: string, setEmail: Function, setValid: Function }) => (
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

const emailInputStyle = {
  color: 'black',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '5px',
};

export default EmailInput;
