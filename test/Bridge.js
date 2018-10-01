const { should } = require('chai').should();

const Bridge = artifacts.require('Bridge');
const Token = artifacts.require('TestToken');
const ControllerStub = artifacts.require('ControllerStub');

const sendETH = async (txObject) => {
    await web3.eth.sendTransaction(txObject);
}

const isRevert = (e) => {
    e.message.should.be.equal('VM Exception while processing transaction: revert');
}

contract('Bridge', (accounts) => {
    let creator = accounts[0];
    let participant = accounts[1];

    const rewards = {
        tokens: 10000,
        eth: 10000
    };

    let totalCollected = web3.toWei(600000, 'ether'); // let's say 600000 USD
    let totalCollectedETH = web3.toWei(100, 'ether');
    let totalSold = web3.toWei(1500, 'ether');

    let token, crowdsale, controller, bridge, decimals;

    before(async () => {
        // deploy bridge
        bridge = await Bridge.new(
            creator,
            creator,
            {
                from: creator
            }
        );

        // controller stub just for manager
        controller = await ControllerStub.new(
            rewards.eth,
            rewards.tokens,
            {
                from: creator
            }
        );

        // start crowdsale (in wings will be done in controller)
        await bridge.start(0, 0, '0x0', {
            from: creator
        });
    });

    it('deploy token', async () => {
        token = await Token.new('Test Token', 'TT', 18, web3.toWei(10000, 'ether'), {
            from: creator
        });
    });

    it('allow to change token', async () => {
        const changeToken_event = bridge.CUSTOM_CROWDSALE_TOKEN_ADDED({}, {fromBlock: 0, toBlock: 'latest'});

        await bridge.changeToken(token.address, {
            from: creator
        });

        changeToken_event.get((error, events) => {
            let args = events[0].args
            args.token.should.be.equal(token.address)
        });
    });

    it('doesn\'t allow to change token to token with incorrect decimals', async () => {
        const badToken = await Token.new('Bad Token', 'BT', 4, web3.toWei(10000, 'ether'), {
            from: creator
        });

        try {
            await bridge.changeToken(badToken.address, { from: creator });
        } catch (e) {
            (e.message === 'VM Exception while processing transaction: revert').should.be.equal(true);
        }
    });

    it('allow to set only minimal goal', async () => {
        const minimalGoal = web3.toWei(10, 'ether').toString(10);

        await bridge.setCrowdsaleGoal(minimalGoal, 0, { from: creator });

        let bridgeMinimalGoal = (await bridge.minimalGoal.call()).toString(10);
        console.log(`Minimal goal: ${web3.fromWei(bridgeMinimalGoal, 'ether')} ETH`);

        bridgeMinimalGoal.should.be.equal(minimalGoal);
    });

    it('allow to set only hard cap', async () => {
        const hardCap = web3.toWei(1000, 'ether').toString(10);

        await bridge.setCrowdsaleGoal(0, hardCap, { from: creator });

        let bridgeHardCap = (await bridge.hardCap.call()).toString(10);
        console.log(`Hard cap: ${web3.fromWei(bridgeHardCap, 'ether')} ETH`);

        bridgeHardCap.should.be.equal(hardCap);
    });

    it('allow to set goals of crowdsale', async () => {
        const goal = {
            min: web3.toWei(15, 'ether').toString(10),
            max: web3.toWei(1500, 'ether').toString(10)
        };

        await bridge.setCrowdsaleGoal(goal.min, goal.max, { from: creator });

        const minimalGoal = (await bridge.minimalGoal.call()).toString(10);
        const hardCap = (await bridge.hardCap.call()).toString(10);

        console.log(`Minimal goal: ${web3.fromWei(minimalGoal, 'ether')} ETH`);
        console.log(`Hard cap: ${web3.fromWei(hardCap, 'ether')} ETH`);

        minimalGoal.should.be.equal(goal.min);
        hardCap.should.be.equal(goal.max);
    });

    it('allow to set only end timestamp', async () => {
        const now = Date.now();

        const endTimestamp = Math.floor(now/1000).toString(10);

        await bridge.setCrowdsalePeriod(0, endTimestamp, { from: creator });

        let bridgeEndTimestamp = (await bridge.endTimestamp.call()).toString(10);
        console.log(`End timestamp: ${parseInt(bridgeEndTimestamp)}`);

        bridgeEndTimestamp.should.be.equal(endTimestamp);
    });

    it('allow to set time period of crowdsale', async () => {
        const now = Date.now();

        const timestamps = {
            start: Math.floor(now/1000).toString(10),
            end: Math.floor((now + 86400 * 5)/1000).toString(10)
        };

        await bridge.setCrowdsalePeriod(timestamps.start, timestamps.end, { from: creator });

        let startTimestamp = (await bridge.startTimestamp.call()).toString(10);
        let endTimestamp = (await bridge.endTimestamp.call()).toString(10);

        console.log(`Start timestamp: ${parseInt(startTimestamp)}`);
        console.log(`End timestamp: ${parseInt(endTimestamp)}`);

        startTimestamp.should.be.equal(timestamps.start);
        endTimestamp.should.be.equal(timestamps.end);
    });

    it('notify sale', async () => {
        await bridge.notifySale(totalCollected, totalCollectedETH, totalSold, {
            from: creator
        });
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

    it('doesn\'t allow to finish Bridge before rewards were sent', async () => {
        try {
            await bridge.finish({
                from: creator
            });
        } catch (e) {
            isRevert(e);
        }
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

    it('update total sold value in bridge', async () => {
        const bgSold = await bridge.totalSold.call();
        bgSold.toString(10).should.be.equal(totalSold.toString(10));
    });

    it('update total collected value in bridge', async () => {
        const bgCollected = await bridge.totalCollected.call();
        bgCollected.toString(10).should.be.equal(totalCollected.toString(10));
    });

    it('finish Bridge', async () => {
        await bridge.finish({
            from: creator
        });

        const completed = await bridge.isSuccessful.call();
        completed.should.be.equal(true);
    });

    it('doesn\'t allow to change token address after Bridge was finished', async () => {
        try {
            await bridge.changeToken(token.address, {
                from: creator
            });
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
            await bridge.withdraw({ from: creator });

            throw new Error('Should return revert');
        } catch (e) {
            isRevert(e);
        }
    });
});
