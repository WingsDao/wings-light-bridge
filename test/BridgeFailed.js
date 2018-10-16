/**
 * Test scenario
 * - create bridge
 * - set project token
 * - set only minimal goal
 * - notify about collected amount
 * - finish bridge unsuccessfully
 * - withdraw rewards
 */

'use strict';

const { should } = require('chai').should();

const Bridge = artifacts.require('Bridge');
const Token = artifacts.require('TestToken');
const ControllerStub = artifacts.require('ControllerStub');

const { sendETH } = require('./helpers/utils');

contract('Bridge hasn\'t reached minimal goal', (accounts) => {
    const creator = accounts[0];

    const rewards = {
        tokens: 10000,
        eth: 10000
    };

    const totalCollected = web3.toWei(600000, 'ether');
    const totalCollectedETH = web3.toWei(100, 'ether');
    const totalSold = web3.toWei(1500, 'ether');

    let token, controller, bridge;

    before(async () => {
        // deploy bridge
        bridge = await Bridge.new(creator, creator, { from: creator });

        // deploy controller stub (it is manager of the bridge)
        controller = await ControllerStub.new(rewards.eth, rewards.tokens, { from: creator });

        // start crowdsale (in wings will be done in controller)
        await bridge.start(0, 0, '0x0', { from: creator });
    });

    it('deploy token', async () => {
        token = await Token.new('Test Token', 'TT', 18, web3.toWei(10000, 'ether'), {
            from: creator
        });
    });

    it('change token', async () => {
        await bridge.changeToken(token.address, {
            from: creator
        });

        let projectToken = (await bridge.getToken.call()).toString();

        projectToken.should.be.equal(token.address)
    });

    it('set minimal goal', async () => {
        const minimalGoal = totalCollected.toString(10) + '0';

        await bridge.setCrowdsaleGoal(minimalGoal, 0, { from: creator });

        let bridgeMinimalGoal = (await bridge.minimalGoal.call()).toString(10);

        bridgeMinimalGoal.should.be.equal(minimalGoal);
    });

    it('notify sale with total collected less then minimal goal', async () => {
        await bridge.notifySale(totalCollected, totalCollectedETH, totalSold, { from: creator });
    });

    it('check how notification went', async () => {
        let notifiedTotalCollected = (await bridge.totalCollected.call()).toString(10);
        let notifiedTotalCollectedETH = (await bridge.totalCollectedETH.call()).toString(10);
        let notifiedTotalSold = (await bridge.totalSold.call()).toString(10);

        notifiedTotalCollected.should.be.equal(totalCollected.toString(10));
        notifiedTotalCollectedETH.should.be.equal(totalCollectedETH.toString(10));
        notifiedTotalSold.should.be.equal(totalSold.toString(10));
    });

    it('move bridge manager to controller', async () => {
        await bridge.transferManager(controller.address, {
            from: creator
        });
    });

    it('transfer token and ETH rewards', async () => {
        const [ethReward, tokenReward] = await bridge.calculateRewards.call();

        // Transfer token reward
        await token.transfer(bridge.address, tokenReward, { from: creator });

        // Send ETH reward
        await sendETH({
            from: creator,
            to: bridge.address,
            value: ethReward,
            gas: 500000
        });
    });

    it('correct total sold value in bridge', async () => {
        const bridgeTotalSold = await bridge.totalSold.call();
        bridgeTotalSold.toString(10).should.be.equal(totalSold.toString(10));
    });

    it('correct total collected value in bridge', async () => {
        const bridgeTotalCollected = await bridge.totalCollected.call();
        bridgeTotalCollected.toString(10).should.be.equal(totalCollected.toString(10));
    });

    it('check whether rewards are ready', async () => {
        const rewardsReady = await bridge.rewardsAreReady.call();
        rewardsReady.should.be.equal(true);
    });

    it('finish Bridge in failed state', async () => {
        await bridge.finish({
            from: creator
        });

        const successful = await bridge.isSuccessful.call();
        const failed = await bridge.isFailed.call();

        successful.should.be.equal(false);
        failed.should.be.equal(true);
    });

    it('has tokens reward on contract', async () => {
        const tokenReward = web3.toBigNumber(totalSold).mul(rewards.tokens).div(1000000).toString(10);
        const tokenBalance = (await token.balanceOf.call(bridge.address)).toString(10);

        tokenBalance.should.be.equal(tokenReward);
    });

    it('has eth reward on contract', async () => {
        const ethReward = web3.toBigNumber(totalCollectedETH == 0 ? totalCollected : totalCollectedETH).mul(rewards.eth).div(1000000).toString(10);
        const ethBalance = web3.eth.getBalance(bridge.address).toString(10);

        ethBalance.should.be.equal(ethReward);
    });

    it('withdraw rewards after bridge finished with fail', async () => {
        const ethReward = web3.toBigNumber(totalCollectedETH == 0 ? totalCollected : totalCollectedETH).mul(rewards.eth).div(1000000).toString(10);
        const tokenReward = web3.toBigNumber(totalSold).mul(rewards.tokens).div(1000000).toString(10);

        await bridge.withdraw(ethReward, tokenReward, { from: creator });
    });

    it('bridge address should have 0 balance', async () => {
        const tokenBalance = (await token.balanceOf.call(bridge.address)).toString(10);
        const ethBalance = web3.eth.getBalance(bridge.address).toString(10);

        tokenBalance.should.be.equal('0');
        ethBalance.should.be.equal('0');
    });
});
