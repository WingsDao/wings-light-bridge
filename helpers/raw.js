const { web3Provider } = require("../config")

const TX = require('ethereumjs-tx')
const ABI = require('ethereumjs-abi')
const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider(web3Provider))


const prepareParams = (from) => {
  let nonce = web3.eth.getTransactionCount(from)
  let gasPrice = web3.eth.gasPrice
  gasPrice = '0x' + web3.toBigNumber(gasPrice).toString(16)

  nonce = '0x' + web3.toBigNumber(nonce).toString(16)

  return [nonce, gasPrice]
}

module.exports.transferManager = (from, to, recipient) => {
  let data = '0x' + ABI.simpleEncode("transferManager(address)", recipient).toString('hex')

  let [nonce, gasPrice] = prepareParams(from)

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

module.exports.createCustomCrowdsale = (from, to) => {
  let data = '0x' + ABI.methodID('createCustomCrowdsale', []).toString('hex')

  let [nonce, gasPrice] = prepareParams(from)

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

module.exports.start = (from, to, startTimestamp, endTimestamp, fundingAddress) => {
  let data = '0x' + ABI.simpleEncode("start(uint256,uint256,address)", startTimestamp, endTimestamp, fundingAddress).toString('hex')

  let [nonce, gasPrice] = prepareParams(from)

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

module.exports.changeToken = (from, to, newToken) => {
  let data = '0x' + ABI.simpleEncode("changeToken(address)", newToken).toString('hex')

  let [nonce, gasPrice] = prepareParams(from)

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

module.exports.notifySale = (from, to, amount, ethAmount, tokenAmount) => {
  let data = '0x' + ABI.simpleEncode("notifySale(uint256,uint256,uint256)", amount, ethAmount, tokenAmount).toString('hex')

  let [nonce, gasPrice] = prepareParams(from)

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

module.exports.transfer = (from, to, bridgeAddress, tokenReward) => {
  let data = '0x' + ABI.simpleEncode("transfer(address,uint256)", bridgeAddress, tokenReward).toString('hex')

  let [nonce, gasPrice] = prepareParams(from)

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

module.exports.sendTransaction = (from, to, ethReward) => {
  let data = ''

  let [nonce, gasPrice] = prepareParams(from)

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

module.exports.finish = (from, to) => {
  let data = '0x' + ABI.methodID('finish', []).toString('hex')

  let [nonce, gasPrice] = prepareParams(from)

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
