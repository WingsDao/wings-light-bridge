const Bridge = artifacts.require('Bridge')
const DefaultToken = artifacts.require('DefaultToken')


module.exports = async (deployer) => {

  const name = process.env.NAME
  const symbol = process.env.SYMBOL
  const decimals = process.env.DECIMALS
  const minimalGoal = process.env.SOFTCAP
  const hardCap = process.env.HARDCAP

  await deployer.deploy(DefaultToken, name, symbol, decimals, { gas: 1000000 })

  let token = await DefaultToken.deployed()

  if (minimalGoal == 0 || hardCap == 0 || token.address == 'undefined') {
    throw new Error('Cannot deploy contract with empty arguments.')
  }

  await deployer.deploy(Bridge, minimalGoal, hardCap, token.address, { gas: 4000000 })
  process.exit(0)
}
