const { expect, assert } = require("chai");
const chai = require("chai");
const { BigNumber } = require("ethers");
const { ethers, network } = require("hardhat");
var Table = require("cli-table");
const TICKET = 0;
// instantiate
var table = new Table({
  head: ["Mint No", "Gas Estimation", "ETH Price"],
  colWidths: [10, 20, 12],
});

var table2 = new Table({
  head: ["Burn No", "Gas Estimation", "ETH Price (100/gwei)"],
  colWidths: [10, 20, 12],
});

// describe("Deployment", function () {
//   beforeEach(async function () {
//     // Get the ContractFactory and Signers here.
//     [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
//     Ticket = await ethers.getContractFactory("TicketV3", owner);

//     // To deploy our contract, we just have to call Token.deploy() and await
//     // for it to be deployed(), which happens once its transaction has been
//     // mined.
//     contract = await Ticket.deploy();
//     await network.provider.send("evm_increaseTime", [3 * 24 * 3600]);
//   });
//   it("Contract should be assigned to the owner", async function () {
//     expect(await contract.owner()).to.equal(owner.address);
//   });
//   it("Contract should start with sales closed", async function () {
//     //We get the index of the Stage enum and not its value
//     expect(await contract.getCurrentStage()).to.equal(0);
//   });
//   it("Only owner can call 'Only Owner' functions", async function () {
//     await chai.expect(contract.run(1000, 2123));
//   });
// });

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
  it("Check if user can mint", async () => {
    let gas;
    let wei;
    gas = await contract.connect(addr1).estimateGas.mintTicket(1, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.08"),
    });
    wei = gas.toNumber() * 100 * 1000000000;
    table.push([1, gas.toNumber(), ethers.utils.formatEther(wei.toString())]);
    gas = await contract.connect(addr1).estimateGas.mintTicket(10, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.8"),
    });
    wei = gas.toNumber() * 100 * 1000000000;
    table.push([10, gas.toNumber(), ethers.utils.formatEther(wei.toString())]);
    gas = await contract.connect(addr1).estimateGas.mintTicket(100, {
      from: addr1.address,
      value: ethers.utils.parseEther("8"),
    });
    wei = gas.toNumber() * 100 * 1000000000;
    table.push([100, gas.toNumber(), ethers.utils.formatEther(wei.toString())]);
    gas = await contract.connect(addr1).estimateGas.mintTicket(1000, {
      from: addr1.address,
      value: ethers.utils.parseEther("80"),
    });
    wei = gas.toNumber() * 100 * 1000000000;
    table.push([
      1000,
      gas.toNumber(),
      ethers.utils.formatEther(wei.toString()),
    ]);
    gas = await contract.connect(addr1).estimateGas.mintTicket(1250, {
      from: addr1.address,
      value: ethers.utils.parseEther("100"),
    });
    wei = gas.toNumber() * 100 * 1000000000;
    table.push([
      1250,
      gas.toNumber(),
      ethers.utils.formatEther(wei.toString()),
    ]);
    console.log(table.toString());
    const balance = await contract.balanceOf(addr1.address, TICKET);
    assert(balance.eq(BigNumber.from(0)));
  });
});

describe("Burn tickets", () => {
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketV3", owner);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    contract = await Ticket.deploy();
  });
  it("Burn 1 ticket", async () => {
    await contract.connect(addr1).mintTicket(1, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.8"),
    });
    await contract.connect(addr2).mintTicket(1, {
      from: addr2.address,
      value: ethers.utils.parseEther("0.8"),
    });
    await contract.connect(addr3).mintTicket(1, {
      from: addr3.address,
      value: ethers.utils.parseEther("0.8"),
    });
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    let gas;
    let wei;
    gas = await contract.connect(owner).estimateGas.run(10000, 99999);
    wei = gas.toNumber() * 100 * 1000000000;
    table2.push([1, gas.toNumber(), ethers.utils.formatEther(wei.toString())]);
    const balance = await contract.balanceOf(addr1.address, TICKET);
    assert(balance.eq(BigNumber.from(1)));
  });
  it("Burn 10 tickets", async () => {
    await contract.connect(addr1).mintTicket(5, {
      from: addr1.address,
      value: ethers.utils.parseEther("0.4"),
    });
    await contract.connect(addr2).mintTicket(5, {
      from: addr2.address,
      value: ethers.utils.parseEther("0.4"),
    });
    await contract.connect(addr3).mintTicket(5, {
      from: addr3.address,
      value: ethers.utils.parseEther("0.4"),
    });
    await contract.connect(addr4).mintTicket(5, {
        from: addr4.address,
        value: ethers.utils.parseEther("0.4"),
      });
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    let gas;
    let wei;
    gas = await contract.connect(owner).estimateGas.run(10000, 99999);
    wei = gas.toNumber() * 100 * 1000000000;
    table2.push([10, gas.toNumber(), ethers.utils.formatEther(wei.toString())]);
    const balance = await contract.balanceOf(addr1.address, TICKET);
    assert(balance.gte(BigNumber.from(0)));
  });
  it("Burn 100 tickets", async () => {
    await contract.connect(addr1).mintTicket(50, {
      from: addr1.address,
      value: ethers.utils.parseEther("4"),
    });
    await contract.connect(addr2).mintTicket(50, {
      from: addr2.address,
      value: ethers.utils.parseEther("4"),
    });
    await contract.connect(addr3).mintTicket(50, {
      from: addr3.address,
      value: ethers.utils.parseEther("4"),
    });
    await contract.connect(addr4).mintTicket(50, {
        from: addr4.address,
        value: ethers.utils.parseEther("4"),
      });
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    let gas;
    let wei;
    gas = await contract.connect(owner).estimateGas.run(10000, 99999);
    wei = gas.toNumber() * 100 * 1000000000;
    table2.push([100, gas.toNumber(), ethers.utils.formatEther(wei.toString())]);
    const balance = await contract.balanceOf(addr1.address, TICKET);
    assert(balance.gte(BigNumber.from(0)));
  });
  it("Burn 200 tickets", async () => {
    await contract.connect(addr1).mintTicket(100, {
      from: addr1.address,
      value: ethers.utils.parseEther("8"),
    });
    await contract.connect(addr2).mintTicket(100, {
      from: addr2.address,
      value: ethers.utils.parseEther("8"),
    });
    await contract.connect(addr3).mintTicket(100, {
      from: addr3.address,
      value: ethers.utils.parseEther("8"),
    });
    await contract.connect(addr4).mintTicket(100, {
        from: addr4.address,
        value: ethers.utils.parseEther("8"),
      });
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    let gas;
    let wei;
    gas = await contract.connect(owner).estimateGas.run(10000, 99999);
    wei = gas.toNumber() * 100 * 1000000000;
    table2.push([200, gas.toNumber(), ethers.utils.formatEther(wei.toString())]);
    const balance = await contract.balanceOf(addr1.address, TICKET);
    assert(balance.gte(BigNumber.from(0)));
  });
  it("Burn 400 tickets", async () => {
    await contract.connect(addr1).mintTicket(200, {
      from: addr1.address,
      value: ethers.utils.parseEther("16"),
    });
    await contract.connect(addr2).mintTicket(200, {
      from: addr2.address,
      value: ethers.utils.parseEther("16"),
    });
    await contract.connect(addr3).mintTicket(200, {
      from: addr3.address,
      value: ethers.utils.parseEther("16"),
    });
    await contract.connect(addr4).mintTicket(200, {
        from: addr4.address,
        value: ethers.utils.parseEther("16"),
      });
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    let gas;
    let wei;
    gas = await contract.connect(owner).estimateGas.run(10000, 99999);
    wei = gas.toNumber() * 100 * 1000000000;
    table2.push([400, gas.toNumber(), ethers.utils.formatEther(wei.toString())]);
    const balance = await contract.balanceOf(addr1.address, TICKET);
    assert(balance.gte(BigNumber.from(0)));
  });
  it("Burn 800 tickets", async () => {
    await contract.connect(addr1).mintTicket(400, {
      from: addr1.address,
      value: ethers.utils.parseEther("32"),
    });
    await contract.connect(addr2).mintTicket(400, {
      from: addr2.address,
      value: ethers.utils.parseEther("32"),
    });
    await contract.connect(addr3).mintTicket(400, {
      from: addr3.address,
      value: ethers.utils.parseEther("32"),
    });
    await contract.connect(addr4).mintTicket(400, {
        from: addr4.address,
        value: ethers.utils.parseEther("32"),
      });
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    let gas;
    let wei;
    gas = await contract.connect(owner).estimateGas.run(10000, 99999);
    wei = gas.toNumber() * 100 * 1000000000;
    table2.push([800, gas.toNumber(), ethers.utils.formatEther(wei.toString())]);
    const balance = await contract.balanceOf(addr1.address, TICKET);
    console.log(table2.toString());
    assert(balance.gte(BigNumber.from(0)));
  });
});
