'use client';
import Footer from './footer';
import Payment from './payment';
import Navbar from './components/Navbar'
import { useEffect } from 'react';
import Modal from 'react-modal';
import { getUser } from './classes/LicenseProcessor';

const maintenance = true; // Set this to true or false as needed

export default function Home() {
  useEffect(() => {
    Modal.setAppElement('#home');
  }, []);

  // If in maintenance mode, display a simple maintenance message
  if (maintenance) {
    getUser('s35400@hotmail.fr');
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
        }}
        id='home'
      >
        Maintenance
      </div>
    );
  }

  // Regular content
  return (
    <main
      style={{
        width: '100vw',
        color: 'black',
        background: 'rgba(28, 28, 28, 1)',
        position: 'relative'
      }}
      id='home'
    >
      <Navbar></Navbar>

      <div style={{ zIndex: '3', position: 'absolute', top: '200px', left: '20px' }}>
        <h1 className='text-4xl text-left text-white align-middle'>
          BYOD License
        </h1>
      </div>
      <Payment />
      <Footer />
    </main>
  );
}
