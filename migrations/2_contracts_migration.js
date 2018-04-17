/*
  Example
*/
const Bridge = artifacts.require('Bridge')

module.exports = (deployer) => {

  /*
    Setup these parameters before deploy
  */
  const minimalGoal = 5555000000000000000000
  const hardCap = 55555000000000000000000
  const token = '0x000000000000000000000000000000000000dead'

  if (minimalGoal == 0 || hardCap == 0 || token == '') {
    throw new Error('Cannot deploy contract with empty arguments.')
  }

  deployer.deploy(Bridge, minimalGoal, hardCap, token)
}
