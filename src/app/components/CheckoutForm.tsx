import React, { useState } from 'react';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { createPaymentIntent } from '../classes/Stripe'; // make sure to change this to your actual file location
import { createUser, getUser, setUser } from '../classes/LicenseProcessor';
const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: "#303238",
            fontSize: "16px",
            fontFamily: "sans-serif",
            fontSmoothing: "antialiased",
            "::placeholder": {
                color: "#bdb7b7"
            },
        },
        invalid: {
            color: "#e5424d",
            ":focus": {
                color: "#303238"
            }
        }
    }
};

function CheckoutForm({ email, payment }: {
    email: string, payment: {
        data: {
            stripe: boolean,
            fry: boolean
        },
        setData: Function
    }
}) {

const stripe = useStripe();
const elements = useElements();
const [error, setError] = useState<string|null>(null); // <-- Add this line
const [isLoading, setIsLoading] = useState(false);
const handleSubmit = async (event: any) => {
    event.preventDefault();

    if (!stripe || !elements) {
        return;
    }
    const cardElement = elements.getElement(CardNumberElement);

    if (!cardElement) {
        console.log('Card Element not found');
        return;
    }
    setIsLoading(true);
    const clientSecret = await createPaymentIntent(email); // createPaymentIntent should be created

    if(!clientSecret) {
        console.log('Error creating payment intent');
        setIsLoading(false);
        return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
            card: cardElement,
        },
    });

    if (error) {
        console.log(error.message);
        setError(error.message || 'An unknown error occured');
        return;
    }

    if (paymentIntent?.status === 'succeeded') {
        const data = payment.data;
        data.stripe = true;
        let user = await getUser(email);
        if (user) {
            user.stripe = true;
            await setUser(user);
        } else {
            user = await createUser(email);
            user.stripe = true;
            await setUser(user);
        }
        payment.setData((currentData: any) => ({ ...currentData, stripe: true }));
        console.log('[PaymentMethod]', paymentIntent);
    }
    setIsLoading(false);
};

return (
    <div style={{ backgroundColor: '#f0e6e6', borderRadius: '10px', padding: '10px', color: 'black' }}>
        <form onSubmit={handleSubmit}>
        {error && (
                <div style={{ color: 'red', marginBottom: '10px' }}>
                    {error}
                </div>
            )}
            <label>
                Card number
                <div style={{
                    border: '1px solid #000000',
                    borderRadius: '4px',
                    padding: '5px',
                    marginBottom: '15px'
                }}>
                    <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                </div>

            </label>
            <label>
                Expiration date
                <div style={{
                    border: '1px solid #000000',
                    borderRadius: '4px',
                    padding: '5px',
                    marginBottom: '15px'
                }}>
                    <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                </div>
            </label>
            <label>
                CVC
                <div style={{
                    border: '1px solid #000000',
                    borderRadius: '4px',
                    padding: '5px',
                    marginBottom: '15px'
                }}>
                    <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                </div>
            </label>
            <button
                type="submit"
                disabled={!stripe || isLoading}
                style={{
                    marginTop: '10px',
                    backgroundColor: isLoading ? 'lightgrey' : '#007bff',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (!stripe || isLoading) ? 'default' : 'pointer',
                }}
            >
                {isLoading ? 'Processing...' : 'Pay'}
            </button>
        </form>
    </div>
);
}

export default CheckoutForm;
