const { account, PROVIDER, networks } = require("./truffle")

const input = require("input")
const { spawn } = require("child_process")
const contract = require("truffle-contract")
const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER))
const raw = require("./helpers/raw")
const BigNumber = require("bignumber.js")
const { checkArtifacts, checkConfig, waitForTransaction, log, log_success, log_error } = require("./helpers/utils")
const { isZeroAddress } = require("ethereumjs-util")


const inputValidAddress = async (contractName) => {
  let address
  do {
    address = await input.text(`Enter ${contractName} address:`)
  } while (isZeroAddress(address) || address == "" || address.length != 42)
  return address
}

const sendTX = async (tx) => {
  tx.sign(account.privateKey)
  let txId = await web3.eth.sendRawTransaction(tx.serialize())
  await waitForTransaction(txId)

  log(`Transaction ID: ${txId}`)
}

async function deploy() {
  await checkArtifacts()

  const tokenABI = require("./build/contracts/DefaultToken.json")
  const bridgeABI = require("./build/contracts/Bridge.json")

  const Token = contract(tokenABI)
  const Bridge = contract(bridgeABI)

  Token.setProvider(new Web3.providers.HttpProvider(PROVIDER))
  Bridge.setProvider(new Web3.providers.HttpProvider(PROVIDER))

  let tokenName = ""
  let tokenSymbol = ""

  while (tokenName.length < 1 ||tokenName.length > 12 || tokenSymbol.length < 3 || tokenSymbol.length > 5 ) {
    tokenName = await input.text("Enter token name:")
    tokenSymbol = await input.text("Enter token symbol:")
  }

  const tokenDecimals = await input.select("Select token decimals:", ["8", "10", "16", "18"])

  try {
    let env = {}

    env['NAME'] = tokenName
    env['SYMBOL'] = tokenSymbol
    env['DECIMALS'] = tokenDecimals
    env['SOFTCAP'] = web3.toWei(1, "ether")
    env['HARDCAP'] = web3.toWei(1, "ether")

    let deployStream = await spawn('/usr/local/bin/node', ['/usr/local/bin/truffle', 'migrate', '--network', 'any'], { env: env })

    deployStream.stdout.pipe(process.stdout)
  } catch (err) {
    log_error(err.message)
  }
}

async function forecasting() {
  await checkArtifacts()

  const bridgeABI = require("./build/contracts/Bridge.json")

  const Bridge = contract(bridgeABI)

  Bridge.setProvider(new Web3.providers.HttpProvider(PROVIDER))

  const bridgeAddress = await inputValidAddress("Bridge")
  const daoAddress = await inputValidAddress("DAO")

  const bridge = await Bridge.at(bridgeAddress)

  try {
    let manager = await bridge.manager.call()

    if (manager.toString() == daoAddress) {
      throw new Error("DAO is already manager")
    }

    let tx = await raw.transferManager(account.address, bridgeAddress, daoAddress)

    await sendTX(tx)

    manager = await bridge.manager.call()

    if (manager.toString() == account.address || manager.toString() != daoAddress) {
      throw new Error("Transaction failed")
    }

    log_success("Management transferred")
  } catch (err) {
    log_error(err.message)
  }
}

async function start() {
  const daoABI = require("./ABI/DAO.json")
  const ccABI = require("./ABI/CrowdsaleController.json")

  const DAO = contract(daoABI)
  const CC = contract(ccABI)

  DAO.setProvider(new Web3.providers.HttpProvider(PROVIDER))
  CC.setProvider(new Web3.providers.HttpProvider(PROVIDER))

  const daoAddress = await inputValidAddress("DAO")

  const dao = await DAO.at(daoAddress)

  try {
    let tx = await raw.createCustomCrowdsale(account.address, daoAddress)

    await sendTX(tx)

    const ccAddress = await dao.crowdsaleController.call()

    if (isZeroAddress(ccAddress)) {
      throw new Error("Call to DAO createCustomCrowdsale failed")
    }

    log_success("Call to DAO createCustomCrowdsale succeeded")

    const cc = await CC.at(ccAddress)

    tx = await raw.start(account.address, ccAddress, 0, 0, "0x0")

    await sendTX(tx)

    let started = await cc.started.call()

    if (started.toString() == false) {
      throw new Error("Call to Crowdsale controller start failed")
    }

    log_success("Call to Crowdsale controller start succeeded")
  } catch (err) {
    log_error(err.message)
  }
}

async function changeToken() {
  await checkArtifacts()

  const bridgeABI = require("./build/contracts/Bridge.json")

  const Bridge = contract(bridgeABI)

  Bridge.setProvider(new Web3.providers.HttpProvider(PROVIDER))

  const bridgeAddress = await inputValidAddress("Bridge")
  const tokenAddress = await inputValidAddress("new Token")

  const bridge = await Bridge.at(bridgeAddress)

  try {
    let tx = await raw.changeToken(account.address, bridgeAddress, tokenAddress)

    await sendTX(tx)

    let newTokenAddress = await bridge.getToken.call()

    if (newTokenAddress.toString() != tokenAddress) {
      throw new Error("Transaction failed")
    }

    log_success("Token was changed")
  } catch (err) {
    log_error(err.message)
  }
}

async function calculateRewards() {
  await checkArtifacts()

  const bridgeABI = require("./build/contracts/Bridge.json")
  const tokenABI = require("./build/contracts/DefaultToken.json")

  const Bridge = contract(bridgeABI)
  const Token = contract(tokenABI)

  Bridge.setProvider(new Web3.providers.HttpProvider(PROVIDER))
  Token.setProvider(new Web3.providers.HttpProvider(PROVIDER))

  const bridgeAddress = await inputValidAddress("Bridge")
  const bridge = await Bridge.at(bridgeAddress)

  const tokenAddress = await bridge.getToken.call()
  const token = await Token.at(tokenAddress)

  const tokenSymbol = await token.symbol.call()
  const tokenDecimals = await token.decimals.call()

  let totalCollected
  let totalSold

  while (isNaN(totalCollected) || isNaN(totalSold) || parseInt(totalCollected) <= 0 || parseInt(totalSold) <= 0) {
    totalCollected = await input.text("Enter total collected amount (ETH):")
    totalSold = await input.text(`Enter total sold amount (${tokenSymbol.toString()}):`)
  }

  try {
    totalSold = new BigNumber(totalSold)

    let tx = await raw.notifySale(account.address, bridgeAddress, web3.toWei(totalCollected, "ether"), totalSold.multipliedBy((new BigNumber(10)).pow(tokenDecimals.toNumber())).toString(10))

    await sendTX(tx)

    let newTotalCollected = await bridge.totalCollected.call()
    let newTotalSold = await bridge.totalSold.call()

    if (newTotalCollected.toNumber() == 0 || newTotalSold.toNumber() == 0) {
      throw new Error("Transaction failed")
    }

    log_success("Notification completed")
  } catch (err) {
    log_error(err)
  }

  const [ethReward, tokenReward] = await bridge.calculateRewards.call()

  log("ETH reward amount: " + ethReward.toString(10))
  log("Token reward amount: " + tokenReward.toString(10))

  const doTransfer = await input.select("Do you want to transfer rewards now?", [{ name: "Yes", value: true }, { name: "No", value: false }])

  if (doTransfer) {
    try {
      let tx = await raw.transfer(account.address, tokenAddress, bridgeAddress.toString(10), tokenReward.toString(10))

      await sendTX(tx)

      let bridgeTokenBalance = await token.balanceOf.call(bridgeAddress)

      if (bridgeTokenBalance.toNumber() < tokenReward.toNumber()) {
        throw new Error("Token transfer failed")
      }

      log_success("Token transfer succeeded")

      if (ethReward.toNumber() > 0) {
        let tx = await raw.sendTransaction(account.address, bridgeAddress, "0x" + ethReward.toString(16))

        await sendTX(tx)

        let bridgeEthBalance = web3.eth.getBalance(bridgeAddress)

        if (bridgeEthBalance.toNumber() < ethReward.toNumber()) {
          throw new Error("ETH transfer failed")
        }

        log_success("ETH transfer succeeded")
      }
    } catch(err) {
      log_error(err)
    }
  }
}

async function finish() {
  await checkArtifacts()

  const bridgeABI = require("./build/contracts/Bridge.json")

  const Bridge = contract(bridgeABI)

  Bridge.setProvider(new Web3.providers.HttpProvider(PROVIDER))

  const bridgeAddress = await inputValidAddress("Bridge")

  const bridge = await Bridge.at(bridgeAddress)

  try {
    let tx = await raw.finish(account.address, bridgeAddress)

    await sendTX(tx)

    let completed = await bridge.isSuccessful.call()

    if (completed.toString() == "false") {
      throw new Error("Transaction failed")
    }
    log_success("Bridge finished")
  } catch (err) {
    log_error(err.message)
  }
}

async function end() {
  const scenario = await input.select("Select action:", ["Change token", "Calculate rewards", "Finish bridge"])

  switch(scenario) {
    case "Change token":
      await changeToken()
      break
    case "Calculate rewards":
      await calculateRewards()
      break
    case "Finish bridge":
      await finish()
      break
  }
}

async function main() {
  const scenario = await input.select("Select stage:", ["Deploy", "During forecasting", "Before crowdsale start", "Before crowdsale end"])

  switch(scenario) {
    case "Deploy":
      await deploy()
      break
    case "During forecasting":
      await forecasting()
      break
    case "Before crowdsale start":
      await start()
      break
    case "Before crowdsale end":
      await end()
      break
  }
}

main()
