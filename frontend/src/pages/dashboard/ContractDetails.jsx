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
  const [totalSupply, setTotalSupply] = useState(0);
  const [mintNumber, setMintNumber] = useState(1);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [tokenURI, setTokenURI] = useState('ipfs://');
  const [winnerTokenURI, setWinnerTokenURI] = useState('ipfs://');
  const [txMessage, setTxMessage] = useState('');
  const [currentState, setcurrentState] = useState('');
  const [timeStamp, setTimeStamp] = useState('');
  const [timeInterval, setTimeInterval] = useState(0);
  // eslint-disable-next-line react/prop-types
  const { account, provider } = props;

  const getNumber = async () => {
    const number = await randomNumber(100000, 9999999);
    return number;
  };

  const getCurrentState = async (contr) => {
    const state = await contr.getCurrentStage();
    switch (state) {
      case 0: return 'MINT';
      case 1: return 'BURN';
      case 2: return 'END';
      default: return 'N/A';
    }
  };

  const getRunDate = async (ctrc) => {
    const stamp = (ethers.utils.formatUnits(await ctrc.timeInterval(), 0) * 1000)
     + (ethers.utils.formatUnits(await ctrc.currentBlockStamp(), 0) * 1000);
    return new Date(stamp).toUTCString();
  };

  const updateContractInfo = async () => {
    // eslint-disable-next-line react/prop-types
    const ctrc = new ethers.Contract(address, abi.abi, await provider.getSigner());
    setContract(ctrc);
    setName(await ctrc.name());
    setMintPrice(await ctrc.ticketPrice());
    setPrizeMoney(await ctrc.prizeMoney());
    setTotalSupply(await ctrc.totalSupply());
    setAddress(await ctrc.address);
    setcurrentState(await getCurrentState(ctrc));
    setTimeStamp(await getRunDate(ctrc));
    console.log(await ctrc.winnerMetaData());
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

  const getTickets = async () => {
    const tickets = await contract.balanceOf(account);
    console.log(tickets);
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

  const setWinnerMetadata = async () => {
    const tx = await contract.setWinnerMetaData(winnerTokenURI);
    setTxMessage(`Your transaction ${tx.hash} is to be confirmed... Please wait.`);
    const receipt = await tx.wait();
    console.log(receipt);
    setTxMessage(`Your transaction ${receipt.transactionHash} is confirmed!`);
    updateContractInfo();
  };

  const run = async () => {
    try {
      const tx = await contract.run(await getNumber(), await getNumber(), { gasLimit: 25000000 });
      setTxMessage(`Your transaction ${tx.hash} is to be confirmed... Please wait.`);
      const receipt = await tx.wait();
      console.log(receipt);
      setTxMessage(`Your transaction ${receipt.transactionHash} is confirmed!`);
      updateContractInfo();
    } catch (err) {
      setTxMessage('It is not time to run yet');
    }
  };

  const setTInterval = async () => {
    const tx = await contract.setTimeInterval(timeInterval);
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
        Contract address:
        {' '}
        {currentState}
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
        Run can be executed after:
        {' '}
        {timeStamp}
      </p>
      <input type="number" min={1} onChange={(e) => setMintNumber(e.target.value)} />
      <button type="button" onClick={mint}>Mint</button>
      <br />
      <h4>{txMessage}</h4>
      <button type="button" onClick={updateContractInfo}>Refresh Contract Info</button>
      <br />
      <h4>Owner section</h4>
      <button type="button" onClick={getTickets}>Get Your Tickets</button>
      <p>
        <input placeholder="Set Ticket Price" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} />
        <button type="button" onClick={pushTicketPrice}>Change Ticket Price</button>
      </p>
      <p>
        <input placeholder="Set Ticket Metadata" value={tokenURI} onChange={(e) => setTokenURI(e.target.value)} />
        <button type="button" onClick={setMetadata}>Change Ticket Metadata</button>
      </p>
      <p>
        <input placeholder="Set Winner Ticket Metadata" value={winnerTokenURI} onChange={(e) => setWinnerTokenURI(e.target.value)} />
        <button type="button" onClick={setWinnerMetadata}>Change Winner Ticket Metadata</button>
      </p>
      <p>
        <input placeholder="Set Time Interval" value={timeInterval} onChange={(e) => setTimeInterval(e.target.value)} />
        <button type="button" onClick={setTInterval}>Change Time Interval (times stamp)</button>
      </p>
      <p>
        <button type="button" onClick={run}>Run</button>
      </p>
      <p>
        <button type="button" onClick={startRound}>Start Round</button>
      </p>
    </>
  );
}
