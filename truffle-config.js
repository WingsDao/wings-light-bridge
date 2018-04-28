const HDWalletProvider = require("truffle-hdwallet-provider")
const fs = require("fs")

const mnemonic = "12 seed words"

module.exports = {
  contracts_build_folder: './build',
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    mainnet: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://mainnet.infura.io/<API-TOKEN>")
      },
      network_id: 1,
      gasPrice: 4000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 10
    }
  }
}
