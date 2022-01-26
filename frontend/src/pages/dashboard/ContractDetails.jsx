import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { abi, address } from '../../contract/contract';

export default function ContractDetails(props) {
  const [currentAddress, setAddress] = useState(null);
  const [name, setName] = useState('');
  const [prizeMoney, setPrizeMoney] = useState(0);
  const [mintPrice, setMintPrice] = useState(0);
  const [count, setCount] = useState(0);
  const [contract, setContract] = useState(null);
  const [contractState, setContractState] = useState(null);
  const [totalSupply, setTotalSupply] = useState(0);
  const [nonce, setNonce] = useState('');
  const [ticketsBurn, setTicketsBurn] = useState(0);
  const [mintNumber, setMintNumber] = useState(1);
  // eslint-disable-next-line react/prop-types
  const { account, provider } = props;

  const updateContractInfo = async () => {
    const ctrc = new ethers.Contract(address, abi.abi, await provider.getSigner());
    setContract(ctrc);
    setName(await ctrc.name());
    setMintPrice(await ctrc.ticketPrice());
    setPrizeMoney(await ctrc.prizeMoney());
    setContractState(await ctrc.saleIsActive());
    setTotalSupply(await ctrc.totalSupply());
    setAddress(await ctrc.address);
  };

  const mint = async () => {
    const tx = await contract.mintTicket(mintNumber, {
      value: ethers.utils.parseEther(String(ethers.utils.formatEther(mintPrice) * mintNumber)),
    });
    console.log(tx);
    const receipt = await tx.wait();
    console.log(receipt);
    updateContractInfo();
  };

  const changeState = async () => {
    const tx = await contract.changeContractState();
    console.log(tx);
    const receipt = await tx.wait();
    console.log(receipt);
    updateContractInfo();
  };

  const getTickets = async () => {
    const tickets = await contract.balanceOf(account);
    console.log(tickets);
  };

  const burnTickets = async () => {
    const tx = await contract.burn(nonce, ticketsBurn);
    const receipt = await tx.wait();
    console.log(receipt);
    updateContractInfo();
  };

  const payToWinner = async () => {
    const tx = await contract.transferToWinner();
    const receipt = await tx.wait();
    console.log(receipt);
    updateContractInfo();
  };

  const startRound = async () => {
    const tx = await contract.startRound();
    const receipt = await tx.wait();
    console.log(receipt);
    updateContractInfo();
  };

  useEffect(() => {
    // connect to contract
    updateContractInfo();
  }, [account]);

  return (
    <>
      <h3>Contract</h3>
      <p>
        Name:
        {' '}
        {name}
      </p>
      <p>
        Contract address:
        {' '}
        {currentAddress}
      </p>
      <p>
        Mint Price:
        {' '}
        {ethers.utils.formatEther(mintPrice)}
        {' '}
        ETH
      </p>
      <p>
        Prize Pool:
        {' '}
        {ethers.utils.formatEther(prizeMoney)}
        {' '}
        ETH
      </p>
      <p>
        Total Supply:
        {' '}
        {ethers.utils.formatUnits(totalSupply, 0)}
      </p>
      <p>
        Contract State:
        {' '}
        {`${contractState}`}
      </p>
      <input type="number" min={1} onChange={(e) => setMintNumber(e.target.value)} />
      <button type="button" onClick={mint}>Mint</button>
      <button type="button" onClick={changeState}>Chance Contract State</button>
      <button type="button" onClick={getTickets}>Get Your Tickets</button>
      <p>
        <input placeholder="nonce" value={nonce} onChange={(e) => setNonce(e.target.value)} />
        <input placeholder="tickets to burn" value={ticketsBurn} onChange={(e) => setTicketsBurn(e.target.value)} />
        <button type="button" onClick={burnTickets}>Burn Round</button>
      </p>
      <p>
        <button type="button" onClick={payToWinner}>Transfer to Winner</button>
        <button type="button" onClick={startRound}>Start Round</button>
      </p>
    </>
  );
}
