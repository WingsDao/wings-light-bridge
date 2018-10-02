exports.sendETH = async (txObject) => {
    await web3.eth.sendTransaction(txObject);
};

exports.isRevert = (e) => {
    e.message.should.be.equal('VM Exception while processing transaction: revert');
};
