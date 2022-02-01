/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
const { API_URL, PRIVATE_KEY, API_RINKEBY_URL, RINKEBY_PRIVATE_KEY } = process.env;
module.exports = {
  solidity: "0.8.3",
  defaultNetwork: "hardhat",
  networks: {
     hardhat: {},
     // ropsten: {
     //    url: API_URL,
     //    accounts: [`0x${PRIVATE_KEY}`]
     // }
  },
  // defaultNetwork: "ganache",
  // networks: {
  //   ganache: {
  //     gasLimit: 6000000000,
  //     defaultBalanceEther: 10,
  //     url: "http://localhost:7545"
  //   },
  // },
//   defaultNetwork: "rinkeby",
//   networks: {
//      hardhat: {},
//      rinkeby: {
//         url: API_RINKEBY_URL,
//         accounts: [`${RINKEBY_PRIVATE_KEY}`]
//      }
//   },
};
