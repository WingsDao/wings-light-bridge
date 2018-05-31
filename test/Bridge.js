const { should } = require('chai').should()

const Bridge = artifacts.require('Bridge');
const Token = artifacts.require('TestToken');
const ControllerStub = artifacts.require('ControllerStub')

const sendETH = async (txObject) => {
  await web3.eth.sendTransaction(txObject)
}

contract('Bridge', (accounts) => {
  let creator = accounts.splice(0, 1).pop()
  let participant = accounts.splice(0, 1).pop()

  const rewards = {
    tokens: 100000,
    eth: 100000,
  }

  let totalCollected = web3.toWei(600000, 'ether') // let's say 600000 USD
  let totalCollectedETH = web3.toWei(100, 'ether')
  let totalSold = web3.toWei(1500, 'ether')

  let token, crowdsale, controller, bridge, decimals

  before(async () => {
    // deploy token
    token = await Token.new(web3.toWei(10000, 'ether'), {
      from: creator
    })

    decimals = (await token.decimals.call()).toNumber()

    // deploy bridge
    bridge = await Bridge.new(
      web3.toWei(55, 'ether'),
      web3.toWei(555, 'ether'),
      token.address,
      {
        from: creator
      }
    )

    // controller stub just for manager
    controller = await ControllerStub.new(
      rewards.eth,
      rewards.tokens,
      {
        from: creator
      }
    )

    // start crowdsale (in wings will be done in controller)
    await bridge.start(0, 0, '0x0', {
      from: creator
    })
  })

  it('Should allow to change token', async () => {

    let changeToken_event = bridge.CUSTOM_CROWDSALE_TOKEN_ADDED({}, {fromBlock: 0, toBlock: 'latest'})

    await bridge.changeToken(token.address, {
      from: creator
    })

    changeToken_event.get((error, events) => {
      let args = events[0].args
      args.token.should.be.equal(token.address)
      args.decimals.toNumber().should.be.equal(decimals)
    })
  })

  it('Should notify sale', async () => {
    await bridge.notifySale(totalCollected, totalCollectedETH, totalSold, {
      from: creator
    })
  })

  it('Should check how notification went', async () => {
    let notifiedTotalCollected = (await bridge.totalCollected.call()).toString(10)
    let notifiedTotalCollectedETH = (await bridge.totalCollectedETH.call()).toString(10)
    let notifiedTotalSold = (await bridge.totalSold.call()).toString(10)

    notifiedTotalCollected.should.be.equal(totalCollected.toString(10)),
    notifiedTotalCollectedETH.should.be.equal(totalCollectedETH.toString(10))
    notifiedTotalSold.should.be.equal(totalSold.toString(10))
  })

  it('Should move bridge manager to controller', async () => {
    await bridge.transferManager(controller.address, {
      from: creator
    })
  })

  it('Should transfer token and ETH rewards', async () => {
    const [ethReward, tokenReward] = await bridge.calculateRewards.call()

    // Transfer token reward
    await token.transfer(bridge.address, tokenReward, { from: creator })

    // Send ETH reward
    await sendETH({
      from: creator,
      to: bridge.address,
      value: ethReward,
      gas: 500000
    })
  })

  it('Should update total sold value in bridge', async () => {
    const bgSold = await bridge.totalSold.call()
    bgSold.toString(10).should.be.equal(totalSold.toString(10))
  })

  it('Should update total collected value in bridge', async () => {
    const bgCollected = await bridge.totalCollected.call()
    bgCollected.toString(10).should.be.equal(totalCollected.toString(10))
  })

  it('Should finish Bridge', async () => {
    await bridge.finish({
      from: creator
    })

    const completed = await bridge.isSuccessful.call()
    completed.should.be.equal(true);
  })

  it('Should have tokens reward on contract', async () => {
    const tokenReward = web3.toBigNumber(totalSold).mul(rewards.tokens).div(1000000)
    const tokenBalance = await token.balanceOf.call(bridge.address)

    tokenBalance.toString(10).should.be.equal(tokenReward.toString(10))
  })

  it('Should have eth reward on contract', async () => {
    const ethReward = web3.toBigNumber(totalCollectedETH).mul(rewards.eth).div(1000000)
    const ethBalance = web3.eth.getBalance(bridge.address)

    ethBalance.toString(10).should.be.equal(ethReward.toString(10))
  })
})
