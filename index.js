const input = require("input")
const fs = require("fs")
const { spawnSync } = require("child_process")
const contract = require("truffle-contract")
const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const log = (msg) => {
  console.log("system: " + msg)
}

async function deploy() {
  if (!fs.existsSync('./build')) {
    log("Artifacts not found.")
    log("Compiling contracts...")
    await spawnSync('/usr/local/bin/node', ['/usr/local/bin/truffle', 'compile'])
    log("Contracts compiled.")
  }
  log("Artifacts found.")

  const tokenABI = require("./build/contracts/DefaultToken.json")
  const bridgeABI = require("./build/contracts/Bridge.json")

  const Token = contract(tokenABI)
  const Bridge = contract(bridgeABI)

  Token.setProvider(new Web3.providers.HttpProvider("http://localhost:8545"))
  Bridge.setProvider(new Web3.providers.HttpProvider("http://localhost:8545"))

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
    let token = await Token.new(tokenName, tokenSymbol, parseInt(tokenDecimals), { from: "0x11aeb0226be1c6ebb77ed2728db15ef3adca486a", gas: 1000000 })

    let bridge = await Bridge.new(web3.toWei(softcap, "ether"), web3.toWei(hardcap, "ether"), token.address, { from: "0x11aeb0226be1c6ebb77ed2728db15ef3adca486a", gas: 2000000 })

    log("Contracts deployed.")
    log("Bridge address: " + bridge.address)
  } catch (err) {
    log(err.message)
  }
}

async function forecasting() {

}

async function start() {

}

async function end() {

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
