import React from 'react';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: "#303238",
            fontSize: "16px",
            fontFamily: "sans-serif",
            fontSmoothing: "antialiased",
            "::placeholder": {
                color: "#CFD7DF"
            }
        },
        invalid: {
            color: "#e5424d",
            ":focus": {
                color: "#303238"
            }
        }
    }
};

function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event: any) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }
        const cardElement = elements.getElement(CardNumberElement);


        if (!cardElement) {
            // Handle the case where cardElement is null
            console.log('Card Element not found');
            return;
        }

        const payload = await stripe.createToken(cardElement);

        console.log('[PaymentMethod]', payload);
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Card number
                <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
            </label>
            <label>
                Expiration date
                <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
            </label>
            <label>
                CVC
                <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
            </label>
            <button type="submit" disabled={!stripe}>
                Pay
            </button>
        </form>
    );
}

export default CheckoutForm;
