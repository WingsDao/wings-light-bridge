/* global web3, artifacts, contract */
/**
 * Test scenario
 * - create bridge
 * - notify about collected amount
 * - check if rewards are ready
 * - finish bridge successfully
 */

'use strict';

require('chai').should();

const Bridge = artifacts.require('Bridge');
const ControllerStub = artifacts.require('ControllerStub');

contract('Bridge with 0% rewards (no rewards)', (accounts) => {
    const creator = accounts[0];

    const rewards = {
        tokens: 0,
        eth: 0
    };

    const totalCollected = web3.toWei(100, 'ether');
    const totalCollectedETH = 0;
    const totalSold = 0;

    let controller, bridge;

    before(async () => {
        // deploy bridge
        bridge = await Bridge.new(creator, creator, {from: creator});

        // deploy controller stub (it is manager of the bridge)
        controller = await ControllerStub.new(rewards.eth, rewards.tokens, {from: creator});

        // start crowdsale (in wings will be done in controller)
        await bridge.start(0, 0, '0x0', {from: creator});
    });

    it('notify sale with only total collected', async () => {
        await bridge.notifySale(totalCollected, totalCollectedETH, totalSold, {from: creator});
    });

    it('check how notification went', async () => {
        const notifiedTotalCollected = (await bridge.totalCollected.call()).toString(10);
        const notifiedTotalCollectedETH = (await bridge.totalCollectedETH.call()).toString(10);
        const notifiedTotalSold = (await bridge.totalSold.call()).toString(10);

        notifiedTotalCollected.should.be.equal(totalCollected.toString(10));
        notifiedTotalCollectedETH.should.be.equal(totalCollectedETH.toString(10));
        notifiedTotalSold.should.be.equal(totalSold.toString(10));
    });

    it('move bridge manager to controller', async () => {
        await bridge.transferManager(controller.address, {from: creator});
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

    it('finish Bridge successfully without rewards', async () => {
        await bridge.finish({from: creator});

        const successful = await bridge.isSuccessful.call();
        const failed = await bridge.isFailed.call();

        successful.should.be.equal(true);
        failed.should.be.equal(false);
    });
});
