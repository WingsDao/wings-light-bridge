/* global web3, artifacts, contract */
/**
 * Test scenario:
 * - create bridge
 * - set project token
 * - set goal
 * - set period
 * - notify about collected amount
 * - transfer rewards
 * - check whether crowdsale reached minimal goal or not
 * - finish bridge successfully
 */

'use strict';

require('chai').should();

const Bridge = artifacts.require('Bridge');
const Token = artifacts.require('TestToken');
const ControllerStub = artifacts.require('ControllerStub');

const {sendETH, isRevert} = require('./helpers/utils');

contract('Bridge', (accounts) => {
    const creator = accounts[0];

    const rewards = {
        tokens: 10000,
        eth: 10000
    };

    const totalCollected    = web3.toWei(600000, 'ether'); // let's say 600000 USD
    const totalCollectedETH = web3.toWei(10, 'ether');
    const totalSold         = web3.toWei(100000, 'ether');

    let token, controller, bridge;

    before(async () => {
        // deploy bridge
        bridge = await Bridge.new(creator, creator, {from: creator});

        // deploy controller stub (it is manager of the bridge)
        controller = await ControllerStub.new(rewards.eth, rewards.tokens, {from: creator});

        // start crowdsale (in wings will be done in controller)
        await bridge.start(0, 0, '0x0', {from: creator});
    });

    it('deploy token', async () => {
        token = await Token.new('Test Token', 'TT', 18, web3.toWei(10000, 'ether'), {from: creator});
    });

    it('change token', async () => {
        await bridge.changeToken(token.address, {from: creator});

        const projectToken = (await bridge.getToken.call()).toString();

        projectToken.should.be.equal(token.address);
    });

    it('doesn\'t allow to change token to token with incorrect decimals', async () => {
        const badToken = await Token.new('Bad Token', 'BT', 4, web3.toWei(10000, 'ether'), {from: creator});

        try {
            await bridge.changeToken(badToken.address, {from: creator});

            throw new Error('Should return revert');
        } catch (e) {
            isRevert(e);
        }
    });

    it('set only minimal goal', async () => {
        const minimalGoal = web3.toWei(10, 'ether').toString(10);

        await bridge.setCrowdsaleGoal(minimalGoal, 0, {from: creator});

        const bridgeMinimalGoal = (await bridge.minimalGoal.call()).toString(10);

        bridgeMinimalGoal.should.be.equal(minimalGoal);
    });

    it('set only hard cap', async () => {
        const hardCap = web3.toWei(1000, 'ether').toString(10);

        await bridge.setCrowdsaleGoal(0, hardCap, {from: creator});

        const bridgeHardCap = (await bridge.hardCap.call()).toString(10);

        bridgeHardCap.should.be.equal(hardCap);
    });

    it('set goals of crowdsale', async () => {
        const goal = {
            min: web3.toWei(15, 'ether').toString(10),
            max: web3.toWei(1500, 'ether').toString(10)
        };

        await bridge.setCrowdsaleGoal(goal.min, goal.max, {from: creator});

        const minimalGoal = (await bridge.minimalGoal.call()).toString(10);
        const hardCap = (await bridge.hardCap.call()).toString(10);

        minimalGoal.should.be.equal(goal.min);
        hardCap.should.be.equal(goal.max);
    });

    it('set only end timestamp', async () => {
        const now = Date.now();

        const endTimestamp = Math.floor(now/1000).toString(10);

        await bridge.setCrowdsalePeriod(0, endTimestamp, {from: creator});

        const bridgeEndTimestamp = (await bridge.endTimestamp.call()).toString(10);

        bridgeEndTimestamp.should.be.equal(endTimestamp);
    });

    it('set time period of crowdsale', async () => {
        const now = Date.now();

        const timestamps = {
            start: Math.floor(now/1000).toString(10),
            end: Math.floor((now + 86400 * 5)/1000).toString(10)
        };

        await bridge.setCrowdsalePeriod(timestamps.start, timestamps.end, {from: creator});

        const startTimestamp = (await bridge.startTimestamp.call()).toString(10);
        const endTimestamp = (await bridge.endTimestamp.call()).toString(10);

        startTimestamp.should.be.equal(timestamps.start);
        endTimestamp.should.be.equal(timestamps.end);
    });

    it('notify sale first time with incorrect values', async () => {
        await bridge.notifySale(web3.toBigNumber(totalCollected).mul(2), web3.toBigNumber(totalCollectedETH).mul(2), web3.toBigNumber(totalSold).mul(2), {from: creator});
    });

    it('check how notification went', async () => {
        const notifiedTotalCollected =    (await bridge.totalCollected.call()).toString(10);
        const notifiedTotalCollectedETH = (await bridge.totalCollectedETH.call()).toString(10);
        const notifiedTotalSold =         (await bridge.totalSold.call()).toString(10);

        const doubleTotalCollected =    web3.toBigNumber(totalCollected).mul(2).toString(10);
        const doubleTotalCollectedETH = web3.toBigNumber(totalCollectedETH).mul(2).toString(10);
        const doubleTotalSold =         web3.toBigNumber(totalSold).mul(2).toString(10);

        notifiedTotalCollected.should.be.equal(doubleTotalCollected);
        notifiedTotalCollectedETH.should.be.equal(doubleTotalCollectedETH);
        notifiedTotalSold.should.be.equal(doubleTotalSold);
    });

    it('notify sale second time with correct values', async () => {
        await bridge.notifySale(totalCollected, totalCollectedETH, totalSold, {from: creator});
    });

    it('check how notification went', async () => {
        const notifiedTotalCollected =    (await bridge.totalCollected.call()).toString(10);
        const notifiedTotalCollectedETH = (await bridge.totalCollectedETH.call()).toString(10);
        const notifiedTotalSold =         (await bridge.totalSold.call()).toString(10);

        notifiedTotalCollected.should.be.equal(totalCollected.toString(10));
        notifiedTotalCollectedETH.should.be.equal(totalCollectedETH.toString(10));
        notifiedTotalSold.should.be.equal(totalSold.toString(10));
    });

    it('move bridge manager to controller', async () => {
        await bridge.transferManager(controller.address, {from: creator});
    });

    it('doesn\'t allow to finish Bridge before rewards were sent', async () => {
        try {
            await bridge.finish({from: creator});

            throw new Error('Should return revert');
        } catch (e) {
            isRevert(e);
        }
    });

    it('transfer token and ETH rewards', async () => {
        const [ethReward, tokenReward] = await bridge.calculateRewards.call();

        const expectedEthReward   = web3.toBigNumber(totalCollectedETH).mul(rewards.eth).div(1e6).toString(10);
        const expectedTokenReward = web3.toBigNumber(totalSold).mul(rewards.tokens).div(1e6).toString(10);

        ethReward.toString(10).should.be.equal(expectedEthReward);
        tokenReward.toString(10).should.be.equal(expectedTokenReward);

        // Transfer token reward
        await token.transfer(bridge.address, tokenReward, {from: creator});

        // Send ETH reward
        await sendETH({
            from: creator,
            to: bridge.address,
            value: ethReward,
            gas: 500000
        });
    });

    it('correct total sold value in bridge', async () => {
        const bgSold = await bridge.totalSold.call();
        bgSold.toString(10).should.be.equal(totalSold.toString(10));
    });

    it('correct total collected value in bridge', async () => {
        const bgCollected = await bridge.totalCollected.call();
        bgCollected.toString(10).should.be.equal(totalCollected.toString(10));
    });

    it('check whether rewards are ready', async () => {
        const rewardsReady = await bridge.rewardsAreReady.call();
        rewardsReady.should.be.equal(true);
    });

    it('crowdsale reached minimal goal', async () => {
        const reached = await bridge.reachedMinGoal.call();

        reached.should.be.equal(true);
    });

    it('finish Bridge successfully', async () => {
        await bridge.finish({from: creator});

        const successful = await bridge.isSuccessful.call();
        successful.should.be.equal(true);
    });

    it('check notified values after finishing crowdsale', async () => {
        const notifiedTotalCollected =    (await bridge.totalCollected.call()).toString(10);
        const notifiedTotalCollectedETH = (await bridge.totalCollectedETH.call()).toString(10);
        const notifiedTotalSold =         (await bridge.totalSold.call()).toString(10);

        notifiedTotalCollected.should.be.equal(totalCollected.toString(10));
        notifiedTotalCollectedETH.should.be.equal(totalCollectedETH.toString(10));
        notifiedTotalSold.should.be.equal(totalSold.toString(10));
    });

    it('doesn\'t allow to change token address after Bridge was finished', async () => {
        try {
            await bridge.changeToken(token.address, {from: creator});

            throw new Error('Should return revert');
        } catch (e) {
            isRevert(e);
        }
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

    it('doesn\'t allow to withdraw reward after finish', async () => {
        try {
            await bridge.withdraw(1, 1, {from: creator});

            throw new Error('Should return revert');
        } catch (e) {
            isRevert(e);
        }
    });
});
