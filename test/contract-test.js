const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("Deployment", function () {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Raffle = await ethers.getContractFactory("Raffle", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatRaffle = await Raffle.deploy();
  });
  it("Contract should be assigned to the owner", async function () {
    expect(await hardhatRaffle.owner()).to.equal(owner.address);
  });
  it("Contract should start with sales closed", async function () {
    expect(await hardhatRaffle.saleIsActive()).to.equal(false);
  });
});

describe("Transactions", function () {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Raffle = await ethers.getContractFactory("Raffle", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatRaffle = await Raffle.deploy();
    await hardhatRaffle.changeContractState();
    rafflePrice = await hardhatRaffle.rafflePrice();
    // console.log(
    //   "Owner balance: ",
    //   await hardhatRaffle.provider.getBalance(owner.address),
    // );
  });
  it("Mint a number of raffles in one transaction from address one", async function () {
    await hardhatRaffle.connect(addr1).mintRaffle("test", 2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });
    const numMinted = await hardhatRaffle.totalSupply();
    assert(numMinted.eq(BigNumber.from(2)));
  });
});


describe("Burn Process", function () {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Raffle = await ethers.getContractFactory("Raffle", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatRaffle = await Raffle.deploy();
    await hardhatRaffle.changeContractState();
    rafflePrice = await hardhatRaffle.rafflePrice();
    // console.log(
    //   "Owner balance: ",
    //   await hardhatRaffle.provider.getBalance(owner.address),
    // );
    await hardhatRaffle.connect(addr1).mintRaffle("test", 101, {
      from: addr1.address,
      value: ethers.utils.parseEther("8.08"),
    });
    await hardhatRaffle.changeContractState();
  });
  
  it("Total supply must decrease and token should be burnt", async function () {
    await hardhatRaffle.connect(owner).burn("test", 50);
    const totalSup = await hardhatRaffle.totalSupply();
    assert(totalSup.eq(BigNumber.from(51)));
  });
});