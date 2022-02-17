/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require('hardhat-contract-sizer');
require("hardhat-gas-reporter");
const { API_URL, PRIVATE_KEY, API_RINKEBY_URL, RINKEBY_PRIVATE_KEY } = process.env;
module.exports = {
  //solidity: "0.8.4",
  defaultNetwork: "hardhat",
  networks: {
     hardhat: {},
     // ropsten: {
     //    url: API_URL,
     //    accounts: [`0x${PRIVATE_KEY}`]
     // }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  gasReporter: {
    currency: 'ETH',
    gasPrice: 100,
    coinmarketcap: '64350f82-a55f-4889-871e-0e2d249ab5f7'
  },
  mocha: {
    timeout: 80000
  }
  // defaultNetwork: "ganache",
  // networks: {
  //   ganache: {
  //     gasLimit: 6000000000,
  //     defaultBalanceEther: 10,
  //     url: "http://localhost:7545"
  //   },
  // },
  // defaultNetwork: "rinkeby",
  // networks: {
  //    hardhat: {},
  //    rinkeby: {
  //       url: API_RINKEBY_URL,
  //       accounts: [`${RINKEBY_PRIVATE_KEY}`]
  //    }
  // },
};
