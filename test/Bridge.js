const { should } = require('chai').should()
const BigNumber = require('bignumber.js')

const Bridge = artifacts.require('Bridge');
const Token = artifacts.require('TestToken');
const ControllerStub = artifacts.require('ControllerStub')

const sendETH = async (txObject) => {
  await web3.eth.sendTransaction(txObject)
}

const EMPTY_32BYTES = "0x0000000000000000000000000000000000000000000000000000000000000000"

contract('Bridge', (accounts) => {
  let creator = accounts.splice(0, 1).pop()
  let participant = accounts.splice(0, 1).pop()

  const rewards = {
    tokens: 100000,
    eth: 100000
  }

  let totalCollected = web3.toWei(100, 'ether')
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

    let changeToken_event = bridge.DAO_TOKEN_CREATE({}, {fromBlock: 0, toBlock: 'latest'})

    await bridge.changeToken(token.address, {
      from: creator
    })

    changeToken_event.get((error, events) => {
        // console.log(events[0])
        let args = events[0].args
        args.token.should.be.equal(token.address)
        args.name.should.be.equal(EMPTY_32BYTES)
        args.symbol.should.be.equal(EMPTY_32BYTES)
        args.decimals.toNumber().should.be.equal(decimals)
    })
  })

  it('Should notify sale', async () => {
    await bridge.notifySale(totalCollected, totalSold, {
      from: creator
    })
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
    const tokenReward = new BigNumber(totalSold).mul(rewards.tokens).div(1000000)
    const balance = await token.balanceOf.call(bridge.address)

    balance.toString(10).should.be.equal(tokenReward.toString(10))
  })

  it('Should have eth reward on contract', async () => {
    const ethReward = new BigNumber(totalCollected).mul(rewards.eth).div(1000000)
    const balance = web3.eth.getBalance(bridge.address)

    balance.toString(10).should.be.equal(ethReward.toString(10))
  })
})
