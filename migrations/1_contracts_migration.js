/* global artifacts */
'use strict';

const Bridge = artifacts.require('Bridge');

module.exports = (deployer) => {
    deployer.then(async () => {
        if (process.env.CREATOR) {
            const creator = process.env.CREATOR;

            await deployer.deploy(Bridge, creator, creator, {from: creator, gas: 4700000});
        }
    });
};
