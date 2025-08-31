// truffle-config.js
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",  // Ganache Docker
      port: 8545,
      network_id: "*",    // Match any network
      gas: 6000000,       // Explicit gas limit
      gasPrice: 20000000000 // 20 gwei
    },
  },

  mocha: {
    // timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.8.21", // same as your contract
    },
  },
};
