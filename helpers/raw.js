const EthereumTx = require('ethereumjs-tx')
const EthereumABI = require('ethereumjs-abi')
const BigNumber = require('bignumber.js')
const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

module.exports.transferManager = async (from, to, recipient) => {

  let data = '0x' + EthereumABI.simpleEncode("transferManager(address)", recipient).toString('hex')

  let nonce = await web3.eth.getTransactionCount(from)
  let gasPrice = web3.eth.gasPrice
  gasPrice = '0x' + new BigNumber(gasPrice).toString(16)

  nonce = '0x' + new BigNumber(nonce).toString(16)

  const txParams = {
    nonce,
    gasLimit: 1000000,
    gasPrice,
    to,
    value: 0,
    data
  }

  return new EthereumTx(txParams)
}
