export interface EmailProps {
    email: string;
    setEmail: (email: string) => void;
    setValid: (valid: boolean) => void;
}

export interface PaymentButtonProps {
    valid: boolean;
    showSplitPaymentModal: () => void;
}

export interface SplitPaymentModalProps {
    modalIsOpen: boolean;
    closeModal: () => void;
    activeAddress: string;
    email: string;
    sendAlgoTransaction: (from: string, email: string) => Promise<void>;
    sendFryTransaction: (from: string, email: string) => Promise<void>;
    valid: boolean;
    
}