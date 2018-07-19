/*
  Example
*/
const Bridge = artifacts.require('Bridge')
const DefaultToken = artifacts.require('DefaultToken')

module.exports = (deployer) => {
  deployer.then(async () => {
    if (process.env.CREATOR) {
      const creator = process.env.CREATOR

      await deployer.deploy(Bridge, creator, creator, { from: creator, gas: 4700000 })
    }
  })
}
