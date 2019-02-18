pragma solidity ^0.4.18;


import './interfaces/IBridge.sol';


/*
    Bridge
*/
contract Bridge is IBridge {

    /**
     * Constructor.
     */
    function Bridge(address _owner, address _manager) public {
        owner = _owner;
        manager = _manager;
    }

    /*
        Public view
     */

    function isFailed() public view returns (bool) {
        return failed;
    }

    function isActive() public view returns (bool) {
        return started && !completed;
    }

    function isSuccessful() public view returns (bool) {
        return completed && !failed;
    }

    function reachedMinGoal() public view returns (bool) {
        return totalCollected >= minimalGoal;
    }

    function getToken() public view returns (address) {
        return address(token);
    }

    /**
     * Calculate the amount of rewards in ETH and tokens.
     */
    function calculateRewards() public view returns (uint256, uint256) {
        uint256 tokenRewardPart = IWingsController(manager).tokenRewardPart();
        uint256 ethRewardPart = IWingsController(manager).ethRewardPart();
        uint256 ethReward;
        bool hasEthReward = (ethRewardPart != 0);

        uint256 tokenReward = totalSold.mul(tokenRewardPart) / 1000000;

        uint256 totalCollectedCopy = totalCollected;

        if (totalCollectedETH != 0) {
            totalCollectedCopy = totalCollectedETH;
        }

        uint256 fittedTotalCollected = IWingsController(manager).fitCollectedValueIntoRange(totalCollectedCopy);

        if (fittedTotalCollected < totalCollectedCopy) {
            totalCollectedCopy = fittedTotalCollected;
        }

        if (hasEthReward) {
            ethReward = totalCollectedCopy.mul(ethRewardPart) / 1000000;
        }

        return (ethReward, tokenReward);
    }

    /**
     * Check whether rewards are ready to be distributed.
     */
    function rewardsAreReady() public view returns (bool) {
        uint256 ethReward;
        uint256 tokenReward;

        (ethReward, tokenReward) = calculateRewards();

        // check if there are enough eth rewards on this address
        if (ethReward > 0) {
            uint256 ethBalance = address(this).balance;

            if (ethBalance < ethReward) {
                return false;
            }
        }

        // check if there are enough tokens rewards on this address
        if (tokenReward > 0) {
            if (address(token) == address(0)) {
                return false;
            }

            uint256 tokenBalance = token.balanceOf(address(this));

            if (tokenBalance < tokenReward) {
                return false;
            }
        }

        return true;
    }

    /*
        Public
     */

    /**
     * Change token address.
     */
    function changeToken(address _newToken) public onlyOwnerOrManager() uncompleted() {
        token = DetailedERC20(_newToken);

        uint8 tokenDecimals = uint8(token.decimals());

        require(tokenDecimals >= 8 && tokenDecimals <= 18);

        CUSTOM_CROWDSALE_TOKEN_ADDED(address(token), tokenDecimals);
    }

    /**
     * Set/update crowdsale goal.
     */
    function setCrowdsaleGoal(uint256 _minimalGoal, uint256 _hardCap) public onlyOwnerOrManager() uncompleted() {
        if (_minimalGoal > 0 && _hardCap > 0) {
            require(_hardCap > _minimalGoal);
        }

        if (_minimalGoal > 0) {
            minimalGoal = _minimalGoal;
        }

        hardCap = _hardCap;

        CUSTOM_CROWDSALE_GOAL_ADDED(minimalGoal, hardCap);
    }

    /**
     * Set/update crowdsale period.
     */
    function setCrowdsalePeriod(uint256 _startTimestamp, uint256 _endTimestamp) public onlyOwnerOrManager() uncompleted() {
        if (_startTimestamp > 0 && _endTimestamp > 0) {
            require(_endTimestamp > _startTimestamp);
        }

        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;

        CUSTOM_CROWDSALE_PERIOD_ADDED(startTimestamp, endTimestamp);
    }

    /**
     * Update crowdsale information with collected ETH and amount of sold Tokens.
     */
    function notifySale(uint256 _amount, uint256 _ethAmount, uint256 _tokensAmount)
        public
        hasBeenStarted()
        hasntStopped()
        whenCrowdsaleAlive()
        onlyOwner()
    {
        totalCollected = _amount;
        totalCollectedETH = _ethAmount;
        totalSold = _tokensAmount;

        notifiedSale = true;

        CUSTOM_CROWDSALE_RESULT(totalCollected, totalCollectedETH, totalSold);
    }

    /**
     * Finish crowdsale.
     */
    function finish()
        public
        hasntStopped()
        hasBeenStarted()
        whenCrowdsaleAlive()
        onlyOwner()
    {
        // allow to finish bridge only if owner has communicated crowdsale results
        require(notifiedSale);

        if (!reachedMinGoal()) {
            failed = true;
        } else {
            // if crowdsale is not failed there should be rewards in order to finish bridge
            require(rewardsAreReady());
        }

        completed = true;

        CUSTOM_CROWDSALE_FINISH();
    }

    /**
     * Owner can withdraw ETH and WINGS from Bridge contract before crowdsale has finished or failed.
     */
    function withdraw(uint256 _ethAmount, uint256 _tokenAmount) public onlyOwner() {
        if (completed && !failed) {
            revert();
        }

        uint256 ethBalance = address(this).balance;
        uint256 tokenBalance = token.balanceOf(address(this));

        require(ethBalance >= _ethAmount && tokenBalance >= _tokenAmount);

        if (_ethAmount > 0) {
            msg.sender.transfer(_ethAmount);
        }

        if (_tokenAmount > 0) {
            require(token.transfer(msg.sender, _tokenAmount));
        }
    }

    /*
        Only manager
     */

    // Validates parameters and starts crowdsale
    // called by IWingsController
    function start(
        uint256 _startTimestamp,
        uint256 _endTimestamp,
        address /*_fundingAddress*/
    )
        public
        hasntStarted()
        hasntStopped()
        onlyManager()
    {
        if (_startTimestamp > 0 && _endTimestamp > 0) {
            require(_endTimestamp > _startTimestamp);
        }

        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;

        started = true;

        CROWDSALE_START(_startTimestamp, _endTimestamp, address(0));
    }

    // Transfer Token rewards to Forecasting contract.
    // called by IWingsController
    // 'mint' prefix is a legacy.
    function mintTokenRewards(address _contract, uint256 _amount) public onlyManager() {
        token.transfer(_contract, _amount);
    }

    // Transfer ETH rewards to Forecasting contract.
    // called by IWingsController
    // 'mint' prefix is a legacy.
    function mintETHRewards(address _contract, uint256 _amount) public onlyManager() {
        require(_contract.call.value(_amount)());
    }

    // cancels crowdsale
    function stop() public onlyManager() hasntStopped() {
        if (started) {
            require(!isFailed());
            require(!isSuccessful());
        }
        stopped = true;
    }

    /**
     * Fallback function.
     */
    function() public payable {}
}
