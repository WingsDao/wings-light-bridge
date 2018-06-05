const { privateToAddress } = require("ethereumjs-util")

const rawPrivateKey = ""

const account = {
  address: "0x" + privateToAddress("0x" + rawPrivateKey).toString("hex"),
  privateKey: new Buffer.from(rawPrivateKey, "hex")
}

const web3Provider = "http://localhost:8545"

module.exports = {
  account: account,
  web3Provider: web3Provider
}
