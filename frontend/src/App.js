/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import Dashboard from './pages/dashboard/Dashboard';

export default function App() {
  const isMetaMaskInstalled = () => Boolean(window.ethereum && window.ethereum.isMetaMask);

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {isMetaMaskInstalled() ? (
        <div><Dashboard /></div>
      ) : (
        <div>Install Metamask</div>
      )}
    </>
  );
}
