import React, { useEffect, useState } from 'react';
import { getUser } from '../classes/LicenseProcessor';

const Maintenance = () => {



    // You can use the fetched user data as needed in your component
    // For example, console.log(user);

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(28, 28, 28, 1)',
                color: 'white',
                fontSize: '24px',
            }}
        >
            We're currently undergoing maintenance. Please check back later.
        </div>
    );
}
export default Maintenance;
