const { PROVIDER } = require("../truffle")

const fs = require("fs")
const { spawnSync } = require("child_process")
const BigNumber = require('bignumber.js')
const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER))


const log = (msg) => {
  console.log("system: " + msg)
}

const log_success = (msg) => {
  console.log("success: \x1b[32m" + msg + "\x1b[0m")
}

const log_error = (msg) => {
  console.log("error: \x1b[31m" + msg + "\x1b[0m")
}

module.exports.checkArtifacts = async () => {
  if (!fs.existsSync('./build')) {
    log("Artifacts not found.")
    log("Compiling contracts...")
    await spawnSync('/usr/local/bin/node', ['/usr/local/bin/truffle', 'compile'])
    log("Contracts compiled.")
  }
  log("Artifacts found.")
}

module.exports.waitForTransaction = async (txId) => {
  const wait = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  const transactionReceiptAsync = async (txId) => {
    const receipt = await
      await web3.eth.getTransactionReceipt(txId)
    if (receipt == null) {
      await wait(1000)
      return await transactionReceiptAsync(txId)
    } else {
      return receipt
    }
  }

  return await transactionReceiptAsync(txId)
}

module.exports.log = log
module.exports.log_success = log_success
module.exports.log_error = log_error
