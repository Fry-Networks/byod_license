import Footer from './footer';
import Payment from './payment';
import Navbar from './components/Navbar'

export default function Home() {
  return (
    <main
      style={{
        width: '100vw',
        color: 'black',
        background: 'rgba(28, 28, 28, 1)',
        position: 'relative'
      }}
    >
      <Navbar></Navbar>

      <div style={{ zIndex: '3', position: 'absolute', top: '200px', left: '20px' }}> {/* Adjust the position as needed */}
        <h1
          className='text-4xl text-left text-white align-middle'
        >
          BYOD License
        </h1>
      </div>
      <Payment />
      <Footer />

    </main>
  );
}
