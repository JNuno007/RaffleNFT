import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import AccountDetails from './AccountDetails';
import ContractDetails from './ContractDetails';

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [network, setNetwork] = useState('');

  const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');

  const getAccount = async () => {
    const [adr] = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    setAccount(adr);
    setNetwork(provider.network.name);
    setIsConnected(true);
  };

  const setEventListeners = () => {
    // The "any" network will allow spontaneous network changes
    provider.on('network', (newNetwork, oldNetwork) => {
      // When a Provider makes its initial connection, it emits a "network"
      // event with a null oldNetwork along with the newNetwork. So, if the
      // oldNetwork exists, it represents a changing network
      if (oldNetwork) {
        setAccount(null);
        window.location.reload();
      }
    });

    window.ethereum.on('accountsChanged', async (accounts) => {
      if (accounts[0]) {
        setAccount(accounts[0]);
        setIsConnected(true);
      } else {
        setAccount(null);
        setIsConnected(false);
      }
    });

    window.ethereum.on('disconnect', () => {
      setIsConnected(false);
      setAccount(null);
    });
  };

  useEffect(() => {
    setEventListeners();
  }, []);

  return (
    <div>
      <h2>Check that your Metamask account is set to Rinkeby Network!</h2>
      {!account && (
        <button onClick={getAccount} type="button">
          Connect Wallet
        </button>
      )}
      {!isConnected ? <h4>No wallet connected</h4> : (
        <>
          <AccountDetails account={account} network={network} />
          <ContractDetails account={account} provider={provider} />
        </>
      )}
    </div>
  );
}
