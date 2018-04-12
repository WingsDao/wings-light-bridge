/*
  Example
*/
const Bridge = artifacts.require('Bridge')

module.exports = (deployer) => {

  /*
    Setup these parameters before deploy
  */
  const minimalGoal = 0
  const hardCap = 0
  const token = ''

  if (minimalGoal == 0 || hardCap == 0 || token == '') {
    throw new Error('Cannot deploy contract with empty arguments.')
  }

  deployer.deploy(Bridge, minimalGoal, hardCap, token)
}
