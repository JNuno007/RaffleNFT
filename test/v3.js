const { expect, assert } = require("chai");
const chai = require("chai");
const { BigNumber } = require("ethers");
const { ethers, network } = require("hardhat");
const TICKET = 0;

describe("Deployment", function () {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV3", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    contract = await Ticket.deploy();
    await network.provider.send("evm_increaseTime", [3 * 24 * 3600]);
  });
  it("Contract should be assigned to the owner", async function () {
    expect(await contract.owner()).to.equal(owner.address);
  });
  it("Contract should start with sales closed", async function () {
    //We get the index of the Stage enum and not its value
    expect(await contract.getCurrentStage()).to.equal(0);
  });
  it("Only owner can call 'Only Owner' functions", async function () {
    await chai.expect(contract.run(1000, 2123));
  });
});

describe("Mint Phase", () => {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV3", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    contract = await Ticket.deploy();
  });
  it("Validates that contract deploys in mint phase", async () => {
    expect(await contract.getCurrentStage()).eq(0);
  });
  it("Check if user can mint", async () => {
    await contract.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });
    const balance = await contract.balanceOf(addr1.address, TICKET);
    assert(balance.eq(BigNumber.from(2)));
  });
  it("Validates if user pays the correct ammount", async () => {
    await contract.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.18"),
    });
    const balance = await contract.balanceOf(addr1.address, TICKET);
    assert(balance.eq(BigNumber.from(2)));
  });
  it("Validate if tokensInGame receives the tokenId", async () => {
    await contract.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });
    await contract.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });
    const tokenId = await contract.tokensInGame(addr1.address);
    assert(tokenId.eq(BigNumber.from(1)));
  });
  it("Validate if players in game receives the right quantity in first insertion", async () => {
    await contract.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });

    const player = await contract.playersInGame(1);
    assert(player["quantity"].eq(BigNumber.from(2)));
  });
  it("Validate if players in game receives the right quantity in aditional insertion", async () => {
    await contract.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });
    await contract.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });

    const player = await contract.playersInGame(1);
    assert(player["quantity"].eq(BigNumber.from(4)));
  });
  it("Validate if prizeMoney adds", async () => {
    await contract.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });
    await contract.connect(addr1).mintTicket(2, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.16"),
    });
    const prizeMoney = await contract.prizeMoney();
    assert(prizeMoney.eq(ethers.utils.parseEther("0.32")));
  });
});

describe("Burn Phase", () => {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV3", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await hardhatTicket.connect(addr1).mintTicket(3, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.24"),
    });
    await hardhatTicket.connect(addr2).mintTicket(10, {
      from: addr2.address,
      value: ethers.utils.parseEther("0.80"),
    });
    balanceAddr1 = await hardhatTicket
      .connect(addr1)
      .balanceOf(addr1.address, TICKET);
    balanceAddr2 = await hardhatTicket
      .connect(addr2)
      .balanceOf(addr2.address, TICKET);

    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await hardhatTicket.connect(owner).run(10000, 99999);
  });

  it("Check Burn phase State", async () => {
    expect(await hardhatTicket.getCurrentStage()).eq(1);
  });

  it("Check current balance prior burn phase of address one", async () => {
    assert(balanceAddr1.eq(BigNumber.from(3)));
  });

  it("Check current balance prior burn phase of address two", async () => {
    assert(balanceAddr2.eq(BigNumber.from(10)));
  });

  it("Check balance after burn phase of address one", async () => {
    const balance = await hardhatTicket.balanceOf(addr1.address, TICKET);
    assert(balance.lte(BigNumber.from(3)));
  });

  it("Check balance after burn phase of address two", async () => {
    const balance = await hardhatTicket.balanceOf(addr2.address, TICKET);
    assert(balance.lte(BigNumber.from(10)));
  });

  it("Check if supply is 10", async () => {
    const supply = await hardhatTicket.totalSupply();
    assert(supply.eq(BigNumber.from(10)));
  });
});

describe("Burn Phase - Winning Time", async () => {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV3", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await hardhatTicket.connect(addr1).mintTicket(1, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.08"),
    });
    await hardhatTicket.connect(addr2).mintTicket(1, {
      from: addr2.address,
      value: ethers.utils.parseEther("0.08"),
    });
    await hardhatTicket.connect(owner).setWinnerMetaData("common");
    await hardhatTicket.connect(owner).setWinnerMetaData("winner");
    balanceAddr1 = await hardhatTicket
      .connect(addr1)
      .balanceOf(addr1.address, TICKET);
    balanceAddr2 = await hardhatTicket
      .connect(addr2)
      .balanceOf(addr2.address, TICKET);
    walletAddr1 = await addr1.getBalance();
    walletAddr2 = await addr2.getBalance();
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await hardhatTicket.connect(owner).run(10000, 99999);
  });

  it("Check that supply is one ticket", async () => {
    const totalSupply = await hardhatTicket.totalSupply();
    assert(totalSupply.eq(BigNumber.from(1)));
  });

  it("Check if the winner received the prize money", async () => {
    const prizeMoney = await hardhatTicket.prizeMoney();
    const winningTicket = await hardhatTicket.ticketsInPlay(0);
    const player = await hardhatTicket.playersInGame(winningTicket.toNumber());
    let balance;
    if (player["addr"] === addr1.address) {
      const currentBalance = await addr1.getBalance();
      balance = currentBalance.sub(walletAddr1);
    } else {
      const currentBalance = await addr2.getBalance();
      balance = currentBalance.sub(walletAddr2);
    }
    assert(balance.eq(ethers.utils.parseEther("0.16")));
  });

  //Check if winner got the nft

  it("Check if winner got the winner nft", async () => {
    const winningTicket = await hardhatTicket.ticketsInPlay(0);
    const player = await hardhatTicket.playersInGame(winningTicket.toNumber());
    if (player["addr"] === addr1.address) {
      const winningTicketBalance = await hardhatTicket.balanceOf(
        addr1.address,
        1,
      );
      assert(winningTicketBalance.eq(BigNumber.from(1)));
    } else {
      const winningTicketBalance = await hardhatTicket.balanceOf(
        addr2.address,
        1,
      );
      assert(winningTicketBalance.eq(BigNumber.from(1)));
    }
  });

  it("Check winner token uri", async () => {
    const winnerURI = await hardhatTicket.prizeTokenURI(1);
    assert(winnerURI === "winner");
  });

  it("Check if addr1 have 0 tickets at winning phase - balanceOf", async () => {
    const bAddr1 = await hardhatTicket.balanceOf(addr1.address, TICKET);
    assert(bAddr1.eq(BigNumber.from(0)));
  });
  it("Check if addr2 have 0 tickets at winning phase - balanceOf", async () => {
    const bAddr2 = await hardhatTicket.balanceOf(addr2.address, TICKET);
    assert(bAddr2.eq(BigNumber.from(0)));
  });
  it("Check if addr1 have 0 tickets at winning phase - playersInGame", async () => {
    const player = await hardhatTicket.playersInGame(0);
    assert(player["quantity"].eq(BigNumber.from(0)));
  });
  it("Check if addr2 have 0 tickets at winning phase - playersInGame", async () => {
    const player = await hardhatTicket.playersInGame(1);
    assert(player["quantity"].eq(BigNumber.from(0)));
  });
  it("Check that stage is now END", async () => {
    const stage = await hardhatTicket.getCurrentStage();
    expect(stage).to.eq(2);
  });
});

describe("Transfering TICKETS", async () => {
  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV3", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await hardhatTicket.connect(addr1).mintTicket(10, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.8"),
    });
    await hardhatTicket.connect(addr2).mintTicket(1, {
      from: addr2.address,
      value: ethers.utils.parseEther("0.08"),
    });
  });
  it("Check if transfer changes addr1 quantity - balanceOf", async () => {
    await hardhatTicket
      .connect(addr1)
      .safeTransferFrom(addr1.address, addr2.address, TICKET, 1, "0x");
    const blc = await hardhatTicket.balanceOf(addr1.address, TICKET);
    assert(blc.eq(BigNumber.from(9)));
  });
  it("Check if transfer changes addr2 quantity - balanceOf", async () => {
    await hardhatTicket
      .connect(addr1)
      .safeTransferFrom(addr1.address, addr2.address, TICKET, 1, "0x");
    const blc = await hardhatTicket.balanceOf(addr2.address, TICKET);
    assert(blc.eq(BigNumber.from(2)));
  });
  it("Check if transfer changes addr1 quantity - playersInGame", async () => {
    await hardhatTicket
      .connect(addr1)
      .safeTransferFrom(addr1.address, addr2.address, TICKET, 1, "0x");
    const player = await hardhatTicket.playersInGame(1);
    assert(player["quantity"].eq(BigNumber.from(9)));
  });
  it("Check if transfer changes addr2 quantity - playersInGame", async () => {
    await hardhatTicket
      .connect(addr1)
      .safeTransferFrom(addr1.address, addr2.address, TICKET, 1, "0x");
    const player = await hardhatTicket.playersInGame(2);
    assert(player["quantity"].eq(BigNumber.from(2)));
  });
});

describe("Start Round", async () => {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV3", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatTicket = await Ticket.deploy();
    await hardhatTicket.connect(addr1).mintTicket(1, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.08"),
    });
    await hardhatTicket.connect(addr2).mintTicket(1, {
      from: addr2.address,
      value: ethers.utils.parseEther("0.08"),
    });
    await hardhatTicket.connect(owner).setWinnerMetaData("common");
    await hardhatTicket.connect(owner).setWinnerMetaData("winner");
    balanceAddr1 = await hardhatTicket
      .connect(addr1)
      .balanceOf(addr1.address, TICKET);
    balanceAddr2 = await hardhatTicket
      .connect(addr2)
      .balanceOf(addr2.address, TICKET);
    walletAddr1 = await addr1.getBalance();
    walletAddr2 = await addr2.getBalance();
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await hardhatTicket.connect(owner).run(10000, 99999);
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await hardhatTicket.connect(owner).startRound();
  });

  it("Check that stage is now MINT", async () => {
    const stage = await hardhatTicket.getCurrentStage();
    expect(stage).to.eq(0);
  });

  it("Check that total supply", async () => {
    const supply = await hardhatTicket.totalSupply();
    assert(supply.eq(BigNumber.from(0)));
  });

  it("Check ticketsInPlay is empty", async () => {
    const ticketsInPlay = await hardhatTicket.getTicketsInPlaySize();
    assert(ticketsInPlay.eq(BigNumber.from(0)));
  });

  it("Check that prizeMoney is zero", async () => {
    const prizeMoney = await hardhatTicket.prizeMoney();
    assert(prizeMoney.eq(BigNumber.from(0)));
  });
});
