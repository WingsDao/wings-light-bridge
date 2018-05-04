const { PROVIDER } = require("../truffle")

const TX = require('ethereumjs-tx')
const ABI = require('ethereumjs-abi')
const BigNumber = require('bignumber.js')
const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER))


const prepareParams = async (from) => {
  let nonce = await web3.eth.getTransactionCount(from)
  let gasPrice = web3.eth.gasPrice
  gasPrice = '0x' + new BigNumber(gasPrice).toString(16)

  nonce = '0x' + new BigNumber(nonce).toString(16)

  return [nonce, gasPrice]
}

module.exports.transferManager = async (from, to, recipient) => {
  let data = '0x' + ABI.simpleEncode("transferManager(address)", recipient).toString('hex')

  let [nonce, gasPrice] = await prepareParams(from)

  const txParams = {
    nonce,
    gasLimit: 50000,
    gasPrice,
    to,
    value: 0,
    data
  }

  return new TX(txParams)
}

module.exports.createCustomCrowdsale = async (from, to) => {
  let data = '0x' + ABI.methodID('createCustomCrowdsale', []).toString('hex')

  let [nonce, gasPrice] = await prepareParams(from)

  const txParams = {
    nonce,
    gasLimit: 4000000,
    gasPrice,
    to,
    value: 0,
    data
  }

  return new TX(txParams)
}

module.exports.start = async (from, to, startTimestamp, endTimestamp, fundingAddress) => {
  let data = '0x' + ABI.simpleEncode("start(uint256,uint256,address)", startTimestamp, endTimestamp, fundingAddress).toString('hex')

  let [nonce, gasPrice] = await prepareParams(from)

  const txParams = {
    nonce,
    gasLimit: 1000000,
    gasPrice,
    to,
    value: 0,
    data
  }

  return new TX(txParams)
}

module.exports.changeToken = async (from, to, newToken) => {
  let data = '0x' + ABI.simpleEncode("changeToken(address)", newToken).toString('hex')

  let [nonce, gasPrice] = await prepareParams(from)

  const txParams = {
    nonce,
    gasLimit: 1000000,
    gasPrice,
    to,
    value: 0,
    data
  }

  return new TX(txParams)
}

module.exports.notifySale = async (from, to, ethAmount, tokenAmount) => {
  let data = '0x' + ABI.simpleEncode("notifySale(uint256,uint256)", ethAmount, tokenAmount).toString('hex')

  let [nonce, gasPrice] = await prepareParams(from)

  const txParams = {
    nonce,
    gasLimit: 1000000,
    gasPrice,
    to,
    value: 0,
    data
  }

  return new TX(txParams)
}

module.exports.transfer = async (from, to, bridgeAddress, tokenReward) => {
  let data = '0x' + ABI.simpleEncode("transfer(address,uint256)", bridgeAddress, tokenReward).toString('hex')

  let [nonce, gasPrice] = await prepareParams(from)

  const txParams = {
    nonce,
    gasLimit: 1000000,
    gasPrice,
    to,
    value: 0,
    data
  }

  return new TX(txParams)
}

module.exports.sendTransaction = async (from, to, ethReward) => {
  let data = ''

  let [nonce, gasPrice] = await prepareParams(from)

  const txParams = {
    nonce,
    gasLimit: 50000,
    gasPrice,
    to,
    value: ethReward,
    data
  }

  return new TX(txParams)
}

module.exports.finish = async (from, to) => {
  let data = '0x' + ABI.methodID('finish', []).toString('hex')

  let [nonce, gasPrice] = await prepareParams(from)

  const txParams = {
    nonce,
    gasLimit: 1000000,
    gasPrice,
    to,
    value: 0,
    data
  }

  return new TX(txParams)
}
