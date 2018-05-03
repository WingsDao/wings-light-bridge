const HDWalletProvider = require("truffle-hdwallet-provider")
const fs = require("fs")

const mnemonic = "12 seed words"

const PROVIDER = ""
const PORT = ""
const API_TOKEN = ""

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
        return new HDWalletProvider(mnemonic, PROVIDER + PORT + API_TOKEN)
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
