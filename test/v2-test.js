const { expect, assert } = require("chai");
const chai = require("chai");
const { BigNumber } = require("ethers");
const { ethers, network } = require("hardhat");
const sinon = require("sinon-chai");

chai.use(sinon);

describe("Deployment", function () {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV2", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await network.provider.send("evm_increaseTime", [3 * 24 * 3600]);
  });
  it("Contract should be assigned to the owner", async function () {
    expect(await hardhatTicket.owner()).to.equal(owner.address);
  });
  it("Contract should start with sales closed", async function () {
    //We get the index of the Stage enum and not its value
    expect(await hardhatTicket.getCurrentStage()).to.equal(0);
  });
  it("Only owner can call 'Only Owner' functions", async function () {
    await chai.expect(hardhatTicket.run(1000, 2123));
  });
});

describe("Mint Phase", () => {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV2", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
  });
  it("Validates that contract deploys in mint phase", async () => {
    expect(await hardhatTicket.getCurrentStage()).eq(0);
  });
  it("Check if user can mint", async () => {
    await hardhatTicket.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });
    const balance = await hardhatTicket.balanceOf(addr1.address)
    assert(balance.eq(BigNumber.from(2)));
  });
  it("Validates if user pays the correct ammount", async () => {
    await hardhatTicket.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.18"),
    });
    const balance = await hardhatTicket.balanceOf(addr1.address)
    assert(balance.eq(BigNumber.from(2)));
  })
});

describe("Burn Phase", () => {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV2", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await hardhatTicket.connect(addr1).mintTicket(3, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.24"),
    });
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await hardhatTicket.run(10000, 99999);
  });

  it("Check Burn phase State", async () => {
    expect(await hardhatTicket.getCurrentStage()).eq(1);
  })

  it("Check if supply dropped", async () => {
    const totalSupply = await hardhatTicket.totalSupply();
    assert(totalSupply.eq(BigNumber.from(2)));
  })
  if("Check if prize pool changed", async () => {
    const prizeMoney = await hardhatTicket.prizeMoney();
    assert(prizeMoney.eq(BigNumber.from(0.24)));
  });
})

describe("Odd Numbers on Burn Phase", () => {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV2", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await hardhatTicket.connect(addr1).mintTicket(21, {
      from: addr1.address,
      value: ethers.utils.parseEther("1.68"),
    });
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await hardhatTicket.run(10000, 99999);
  });

  it("Check if supply dropped to even and correct number", async () => {
    const totalSupply = await hardhatTicket.totalSupply();
    assert(totalSupply.eq(BigNumber.from(10)));
  })
})

describe("End Phase", async () => {
  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV2", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await hardhatTicket.connect(addr1).mintTicket(3, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.24"),
    });
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await hardhatTicket.run(10000, 99999);
  })
  it("Check if we ended the round", async () => {
    await network.provider.send("evm_increaseTime", [3 * 24 * 3600]);
    await hardhatTicket.run(10000, 99999);
    expect(await hardhatTicket.getCurrentStage()).eq(2);
  })
  it("Check if winner address received the prize", async () => {
    const beforeBalance = await addr1.getBalance();
    await network.provider.send("evm_increaseTime", [3 * 24 * 3600]);
    await hardhatTicket.run(10000, 99999);
    const afterBalance = await addr1.getBalance();
    const diff = afterBalance.sub(beforeBalance);
    assert(diff.eq(ethers.utils.parseEther("0.24")));
  })
  it("Check if winner got the new winner URI ticket", async () => {
    await hardhatTicket.setWinnerMetaData("test");
    await network.provider.send("evm_increaseTime", [3 * 24 * 3600]);
    await hardhatTicket.run(10000, 99999);
    const winner = await hardhatTicket.ticketsInPlay(0);
    const winnerURI = await hardhatTicket.winnerTokenURI(winner);
    expect(winnerURI).eq("test");
  })
})

describe("Functions", function () {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV2", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
  });
  it("Default interval must be 100 days", async function () {
    const intervalTime = await hardhatTicket.timeInterval();
    assert(intervalTime.eq(BigNumber.from(2 * 24 * 3600)));
  });
  it("Owner can change interval", async function () {
    await hardhatTicket.setTimeInterval(1 * 24 * 3600);
    const intervalTime = await hardhatTicket.timeInterval();
    assert(intervalTime.eq(BigNumber.from(1 * 24 * 3600)));
  });
  it("Owner can change common metadata", async function () {
    await hardhatTicket.setMetaData("teste");
    const metadata = await hardhatTicket.commonMetaData();
    expect(metadata).eq("teste");
  });
});
