/*
  Example
*/
const Bridge = artifacts.require('Bridge')
const DefaultToken = artifacts.require('DefaultToken')

module.exports = async (deployer) => {

  /*
    Setup these parameters before deploy
  */
  const name = ""
  const symbol = ""
  const decimals = 0
  const minimalGoal = 0
  const hardCap = 0

  await deployer.deploy(DefaultToken, name, symbol, decimals)

  let token = await DefaultToken.deployed()

  if (minimalGoal == 0 || hardCap == 0 || token.address == 'undefined') {
    throw new Error('Cannot deploy contract with empty arguments.')
  }

  await deployer.deploy(Bridge, minimalGoal, hardCap, token.address)
}
