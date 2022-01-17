import React, {useEffect, useState} from 'react'
import Web3 from "web3";

export default function App() {
    const [account, setAccount] = useState("")
    useEffect(async () => {
        console.log("Given Provider,", Web3.givenProvider);
        const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
        console.log(web3);
        const accounts = await web3.eth.requestAccounts();
        setAccount(accounts[0]);
        console.log(accounts);
    }, [])
    return (
        <div>
          {account}  
        </div>
    )
}
