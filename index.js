const input = require("input")
const { spawn } = require("child_process")
const contract = require("truffle-contract")
const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
const raw = require("./helpers/raw")
const { checkArtifacts, waitForTransaction, log, log_success, log_error } = require("./helpers/utils")



let account = {}
account.address = "0xdecee0be145f03a7ee5bee7ddae0f1d94b2d1f3e"
account.privateKey = new Buffer("ba7e8c3c791d54b4e4882a84b1e0cfd50e6bb634c5bdc114b67669e000f8faae", "hex")

const PROVIDER = "http://localhost:8545"

async function deploy() {
  await checkArtifacts()

  const tokenABI = require("./build/contracts/DefaultToken.json")
  const bridgeABI = require("./build/contracts/Bridge.json")

  const Token = contract(tokenABI)
  const Bridge = contract(bridgeABI)

  Token.setProvider(new Web3.providers.HttpProvider(PROVIDER))
  Bridge.setProvider(new Web3.providers.HttpProvider(PROVIDER))

  var tokenName = await input.text("Enter token name:")
  var tokenSymbol = await input.text("Enter token symbol:")

  while (tokenName.length < 1 ||tokenName.length > 12 || tokenSymbol.length < 3 || tokenSymbol.length > 7 ) {
    tokenName = await input.text("Enter token name:")
    tokenSymbol = await input.text("Enter token symbol:")
  }

  const tokenDecimals = await input.select("Select token decimals:", ["8", "10", "16", "18"])

  var softcap
  var hardcap

  while (isNaN(softcap) || isNaN(hardcap) || parseInt(softcap) <= 0 || parseInt(hardcap) <= 0 || parseInt(hardcap) <= parseInt(softcap)) {
    softcap = await input.text("Enter crowdsale softcap (ETH):")
    hardcap = await input.text("Enter crowdsale hardcap (ETH):")
  }

  try {
    let env = {}

    env['NAME'] = tokenName
    env['SYMBOL'] = tokenSymbol
    env['DECIMALS'] = tokenDecimals
    env['SOFTCAP'] = web3.toWei(softcap, "ether")
    env['HARDCAP'] = web3.toWei(hardcap, "ether")

    let bridgeAddress = await spawn('/usr/local/bin/node', ['/usr/local/bin/truffle', 'migrate'], { env: env })

    bridgeAddress.stdout.pipe(process.stdout)
  } catch (err) {
    log_error(err.message)
  }
}

async function forecasting() {
  const bridgeAddress = await input.text("Enter Bridge address:")
  const daoAddress = await input.text("Enter DAO address:")

  try {
    let tx = await raw.transferManager(account.address, bridgeAddress, daoAddress)
    tx.sign(account.privateKey)
    let txId = await web3.eth.sendRawTransaction(tx.serialize())
    await waitForTransaction(txId)

    log(`Transaction ID: ${txId}`)
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

  const daoAddress = await input.text("Enter DAO address:")

  const dao = await DAO.at(daoAddress)

  try {
    let tx = await raw.createCustomCrowdsale(account.address, daoAddress)
    tx.sign(account.privateKey)
    let txId = await web3.eth.sendRawTransaction(tx.serialize())
    await waitForTransaction(txId)

    log(`Transaction ID: ${txId}`)
    log_success("Call to DAO was successful")
  } catch (err) {
    log_error(err.message)
    throw new Error()
  }

  const ccAddress = await dao.crowdsaleController.call()

  try {
    await raw.start(account.address, ccAddress, 0, 0, "0x0")
    tx.sign(account.privateKey)
    let txId = await web3.eth.sendRawTransaction(tx.serialize())
    await waitForTransaction(txId)

    log(`Transaction ID: ${txId}`)
    log_success("Crowdsale controller start")
  } catch (err) {
    log_error(err.message)
  }
}

async function changeToken() {
  const bridgeAddress = await input.text("Enter Bridge address:")
  const tokenAddress = await input.text("Enter new Token address:")

  try {
    let tx = await raw.changeToken(account.address, bridgeAddress, tokenAddress)
    tx.sign(account.privateKey)
    let txId = await web3.eth.sendRawTransaction(tx.serialize())
    await waitForTransaction(txId)

    log(`Transaction ID: ${txId}`)
    log_success("Token was changed")
  } catch (err) {
    log_error(err.message)
  }
}

async function calculateRewards() {
  await checkArtifacts()

  const bridgeABI = require("./build/contracts/Bridge.json")

  const Bridge = contract(bridgeABI)

  Bridge.setProvider(new Web3.providers.HttpProvider(PROVIDER))

  const bridgeAddress = await input.text("Enter Bridge address:")

  const bridge = await Bridge.at(bridgeAddress)

  try {
    let tx = await raw.notifySale(account.address, bridgeAddress, totalCollected, totalSold)
    tx.sign(account.privateKey)
    let txId = await web3.eth.sendRawTransaction(tx.serialize())
    await waitForTransaction(txId)

    log(`Transaction ID: ${txId}`)
    log_success("Notification completed")
  } catch (err) {
    log_error(err.message)
  }

  const [ethReward, tokenReward] = await bridge.calculateRewards()

  log("ETH reward amount: " + ethReward)
  log("Token reward amount: " + tokenReward)

  const doTransfer = await input.select("Do you want to transfer rewards now?", [{ name: "Yes", value: true }, { name: "No", value: false }])

  if (doTransfer) {
    const tokenAddress = await input.text("Enter token address:")

    let tx = await raw.transfer(account.address, tokenAddress, bridgeAddress, tokenReward)
    tx.sign(account.privateKey)
    let txId = await web3.eth.sendRawTransaction(tx.serialize())
    await waitForTransaction(txId)

    log(`Transaction ID: ${txId}`)

    if (ethReward > 0) {
      let tx = await raw.sendTransaction(account.address, bridgeAddress, ethReward)
      tx.sign(account.privateKey)
      let txId = await web3.eth.sendRawTransaction(tx.serialize())
      await waitForTransaction(txId)

      log(`Transaction ID: ${txId}`)
    }
  }
}

async function finish() {
  const bridgeAddress = await input.text("Enter Bridge address:")

  try {
    let tx = await raw.finish(account.address, bridgeAddress)
    tx.sign(account.privateKey)
    let txId = await web3.eth.sendRawTransaction(tx.serialize())
    await waitForTransaction(txId)

    log(`Transaction ID: ${txId}`)
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
