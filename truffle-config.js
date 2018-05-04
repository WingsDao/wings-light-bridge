const HDWalletProvider = require("truffle-hdwallet-provider-privkey")
const fs = require("fs")
const { privateToAddress } = require("ethereumjs-util")

const rawPrivateKey = ""

const account = {
  address: "0x" + privateToAddress("0x" + rawPrivateKey).toString("hex"),
  privateKey: new Buffer(rawPrivateKey, "hex")
}

const PROVIDER = "http://localhost:8545"
const API_TOKEN = ""

module.exports = {
  contracts_build_folder: './build',
  networks: {
    development: {
      provider: () => {
        return new HDWalletProvider(account.privateKey, PROVIDER + API_TOKEN)
      },
      network_id: '*'
    },
    mainnet: {
      provider: () => {
        return new HDWalletProvider(account.privateKey, PROVIDER + API_TOKEN)
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
  },
  account: account,
  PROVIDER: PROVIDER
}
