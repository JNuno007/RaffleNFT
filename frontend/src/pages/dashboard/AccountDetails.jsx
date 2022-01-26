import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';

export default function AccountDetails(props) {
  const [balance, setBalance] = useState(0);
  // eslint-disable-next-line react/prop-types
  const { account } = props;

  const getBalance = async (acc) => {
    const accBalance = await window.ethereum.request({ method: 'eth_getBalance', params: [acc, 'latest'] });
    setBalance(Number(ethers.utils.formatEther(accBalance)).toFixed(4));
  };

  useEffect(async () => {
    // get Balance
    if (account) {
      getBalance(account);
    }
  }, [account]);

  return (
    <div>
      <span>
        <strong>Address:</strong>
        {' '}
        <span>{account}</span>
      </span>
      <br />
      <br />
      <span>
        <strong>Balance:</strong>
        {' '}
        <span>
          {balance}
          {' '}
          ETH
        </span>
      </span>
    </div>
  );
}
