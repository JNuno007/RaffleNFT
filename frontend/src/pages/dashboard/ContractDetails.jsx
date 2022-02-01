import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import randomNumber from 'random-number-csprng';
import { abi, address } from '../../contract/contract';

export default function ContractDetails(props) {
  const [currentAddress, setAddress] = useState(null);
  const [name, setName] = useState('');
  const [prizeMoney, setPrizeMoney] = useState(0);
  const [mintPrice, setMintPrice] = useState(0);
  const [contract, setContract] = useState(null);
  const [contractState, setContractState] = useState(null);
  const [totalSupply, setTotalSupply] = useState(0);
  const [ticketsBurn, setTicketsBurn] = useState(0);
  const [mintNumber, setMintNumber] = useState(1);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [tokenURI, setTokenURI] = useState('ipfs://');
  const [txMessage, setTxMessage] = useState('');
  // eslint-disable-next-line react/prop-types
  const { account, provider } = props;

  const getNumber = async () => {
    const number = await randomNumber(100000, 9999999);
    return number;
  };

  const updateContractInfo = async () => {
    // eslint-disable-next-line react/prop-types
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
    setTxMessage(`Your transaction ${tx.hash} is to be confirmed... Please wait.`);
    const receipt = await tx.wait();
    console.log(receipt);
    setTxMessage(`Your transaction ${receipt.hash} is confirmed!`);
    updateContractInfo();
  };

  const changeState = async () => {
    const tx = await contract.changeContractState();
    console.log(tx);
    setTxMessage(`Your transaction ${tx.hash} is to be confirmed... Please wait.`);
    const receipt = await tx.wait();
    console.log(receipt);
    setTxMessage(`Your transaction ${receipt.hash} is confirmed!`);
    updateContractInfo();
  };

  const getTickets = async () => {
    const tickets = await contract.balanceOf(account);
    console.log(tickets);
  };

  const burnTickets = async () => {
    const nonce = await getNumber();
    const salt = await getNumber();
    const tx = await contract.burn(nonce, salt, ticketsBurn);
    setTxMessage(`Your transaction ${tx.hash} is to be confirmed... Please wait.`);
    const receipt = await tx.wait();
    console.log(receipt);
    setTxMessage(`Your transaction ${receipt.transactionHash} is confirmed!`);
    updateContractInfo();
  };

  const payToWinner = async () => {
    const tx = await contract.transferToWinner();
    setTxMessage(`Your transaction ${tx.hash} is to be confirmed... Please wait.`);
    const receipt = await tx.wait();
    console.log(receipt);
    setTxMessage(`Your transaction ${receipt.transactionHash} is confirmed!`);
    updateContractInfo();
  };

  const startRound = async () => {
    const tx = await contract.startRound();
    setTxMessage(`Your transaction ${tx.hash} is to be confirmed... Please wait.`);
    const receipt = await tx.wait();
    console.log(receipt);
    setTxMessage(`Your transaction ${receipt.transactionHash} is confirmed!`);
    updateContractInfo();
  };

  const pushTicketPrice = async () => {
    const tx = await contract.setTicketPrice(ethers.utils.parseEther(ticketPrice));
    setTxMessage(`Your transaction ${tx.hash} is to be confirmed... Please wait.`);
    const receipt = await tx.wait();
    console.log(receipt);
    setTxMessage(`Your transaction ${receipt.transactionHash} is confirmed!`);
    updateContractInfo();
  };

  const setMetadata = async () => {
    const tx = await contract.setMetaData(tokenURI);
    setTxMessage(`Your transaction ${tx.hash} is to be confirmed... Please wait.`);
    const receipt = await tx.wait();
    console.log(receipt);
    setTxMessage(`Your transaction ${receipt.transactionHash} is confirmed!`);
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
        Sale is open:
        {' '}
        {`${contractState}`}
      </p>
      <input type="number" min={1} onChange={(e) => setMintNumber(e.target.value)} />
      <button type="button" onClick={mint}>Mint</button>
      <br />
      <h4>{txMessage}</h4>
      <button type="button" onClick={updateContractInfo}>Refresh Contract Info</button>
      <br />
      <h4>Owner section</h4>
      <button type="button" onClick={changeState}>Change Contract State</button>
      <button type="button" onClick={getTickets}>Get Your Tickets</button>
      <p>
        <input placeholder="tickets to burn" value={ticketsBurn} onChange={(e) => setTicketsBurn(e.target.value)} />
        <button type="button" onClick={burnTickets}>Burn Round</button>
      </p>
      <p>
        <input placeholder="Set Ticket Price" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} />
        <button type="button" onClick={pushTicketPrice}>Change Ticket Price</button>
      </p>
      <p>
        <input placeholder="Set Ticket Metadata" value={tokenURI} onChange={(e) => setTokenURI(e.target.value)} />
        <button type="button" onClick={setMetadata}>Change Ticket Metadata</button>
      </p>
      <p>
        <button type="button" onClick={payToWinner}>Transfer to Winner</button>
        <button type="button" onClick={startRound}>Start Round</button>
      </p>
    </>
  );
}
