const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("Deployment", function () {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("Ticket", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
  });
  it("Contract should be assigned to the owner", async function () {
    expect(await hardhatTicket.owner()).to.equal(owner.address);
  });
  it("Contract should start with sales closed", async function () {
    expect(await hardhatTicket.saleIsActive()).to.equal(false);
  });
});

describe("Transactions", function () {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("Ticket", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await hardhatTicket.changeContractState();
    TicketPrice = await hardhatTicket.ticketPrice();
    // console.log(
    //   "Owner balance: ",
    //   await hardhatTicket.provider.getBalance(owner.address),
    // );
  });
  it("Mint a number of Tickets in one transaction from address one", async function () {
    await hardhatTicket.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });
    const numMinted = await hardhatTicket.totalSupply();
    assert(numMinted.eq(BigNumber.from(2)));
  });

  it("Start new Round", async function () {
    await hardhatTicket.connect(owner).startRound();
    const saleIsActive = await hardhatTicket.saleIsActive();
    assert(saleIsActive === true, "SaleIsActive is false");
    const prizeMoney = await hardhatTicket.prizeMoney();
    assert(prizeMoney.eq(BigNumber.from(0)), "Prize Money is bigger than 0");
    const totalSupply = await hardhatTicket.totalSupply();
    assert(totalSupply.eq(BigNumber.from(0)), "Total Supply bigger than 0");
    const ticketsInPlay = await hardhatTicket.getTicketsInPlaySize();
    assert(ticketsInPlay.eq(BigNumber.from(0)));
  });

  it("Set Ticket Price", async function () {
    await hardhatTicket.connect(owner).setTicketPrice(ethers.utils.parseEther("0.10"));
    const ticketPrice = await hardhatTicket.ticketPrice();
    assert(ticketPrice.eq(BigNumber.from(ethers.utils.parseEther("0.1"))))
  })
});

describe("Burn Process", function () {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("Ticket", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await hardhatTicket.changeContractState();
    TicketPrice = await hardhatTicket.ticketPrice();
    // console.log(
    //   "Owner balance: ",
    //   await hardhatTicket.provider.getBalance(owner.address),
    // );
    await hardhatTicket.connect(addr1).mintTicket(101, {
      from: addr1.address,
      value: ethers.utils.parseEther("8.08"),
    });
    await hardhatTicket.changeContractState();
  });

  it("Total supply must decrease and token should be burnt", async function () {
    await hardhatTicket.connect(owner).burn(2647917, 5111864, 50);
    const totalSup = await hardhatTicket.totalSupply();
    assert(totalSup.eq(BigNumber.from(51)));
  });

  it("A winner must be set and get the prize money", async function () {
    const beforeBalance = await addr1.getBalance();
    await hardhatTicket.connect(owner).burn(2647917, 5111864, 100);
    await hardhatTicket.transferToWinner();
    const afterBalance = await addr1.getBalance();
    const diff = afterBalance.sub(beforeBalance);
    assert(diff.eq(ethers.utils.parseEther("8.08")));
  });
});
