pragma solidity ^0.4.18;


import './interfaces/IBridge.sol';


/*
    Standalone Bridge
*/
contract Bridge is IBridge {

    // Constructor
    function Bridge(address _owner, address _manager) public {
        owner = _owner;
        manager = _manager;
    }

    /*
        Only manager
     */

    // Mints token Rewards to Forecasting contract
    // called by IWingsController
    function mintTokenRewards(
        address _contract,
        uint256 _amount        // agreed part of totalSold which is intended for rewards
    )
        public
        onlyManager()
    {
        // in our example we are transferring tokens instead of minting them
        token.transfer(_contract, _amount);
    }

    // called by CrowdsaleController to transfer reward part of ETH
    // collected by successful crowdsale to Forecasting contract.
    // This call is made upon closing successful crowdfunding process
    // iff agreed ETH reward part is not zero
    function mintETHRewards(
        address _contract,    // Forecasting contract
        uint256 _amount         // agreed part of totalCollected which is intended for rewards
    )
        public
        onlyManager() // manager is CrowdsaleController instance
    {
        require(_contract.call.value(_amount)());
    }

    // cancels crowdsale
    function stop() public onlyManager() hasntStopped()    {
        // we can stop only not started and not completed crowdsale
        if (started) {
            require(!isFailed());
            require(!isSuccessful());
        }
        stopped = true;
    }

    /*
        Public
     */

    // Update information about collected ETH and sold tokens amount
    function notifySale(uint256 _amount, uint256 _ethAmount, uint256 _tokensAmount)
        public
        hasBeenStarted()
        hasntStopped()
        whenCrowdsaleAlive()
        onlyOwner()
    {
        totalCollected = totalCollected.add(_amount);
        totalCollectedETH = totalCollectedETH.add(_ethAmount);
        totalSold = totalSold.add(_tokensAmount);

        notifiedSale = true;
    }

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

    // Finish crowdsale
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

    // Change token address (in case you've used the dafault token address during bridge deployment)
    function changeToken(address _newToken) public onlyOwnerOrManager() uncompleted() {
        token = DetailedERC20(_newToken);

        uint8 tokenDecimals = uint8(token.decimals());

        require(tokenDecimals >= 8 && tokenDecimals <= 18);

        CUSTOM_CROWDSALE_TOKEN_ADDED(address(token), tokenDecimals);
    }

    // Set/update crowdsale goal
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

    // Set/update crowdsale period
    function setCrowdsalePeriod(uint256 _startTimestamp, uint256 _endTimestamp) public onlyOwnerOrManager() uncompleted() {
        if (_startTimestamp > 0 && _endTimestamp > 0) {
            require(_endTimestamp > _startTimestamp);
        }

        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;

        CUSTOM_CROWDSALE_PERIOD_ADDED(startTimestamp, endTimestamp);
    }

    // Gives owner ability to withdraw eth and wings from Bridge contract balance in case
    // if some error during reward calculation occured or crowdsale failed
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
        Public view
     */

    // Returns address of crowdsale token
    function getToken() public view returns (address) {
        return address(token);
    }

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

    // Find out the amount of rewards in ETH and tokens
    function calculateRewards() public view returns (uint256, uint256) {
        uint256 tokenRewardPart = IWingsController(manager).tokenRewardPart();
        uint256 ethRewardPart = IWingsController(manager).ethRewardPart();
        uint256 ethReward;
        bool hasEthReward = (ethRewardPart != 0);

        uint256 tokenReward = totalSold.mul(tokenRewardPart) / 1000000;

        if (totalCollectedETH != 0) {
            totalCollected = totalCollectedETH;
        }

        totalCollected = IWingsController(manager).fitCollectedValueIntoRange(totalCollected);

        if (hasEthReward) {
            ethReward = totalCollected.mul(ethRewardPart) / 1000000;
        }

        return (ethReward, tokenReward);
    }

    // Find out whether rewards are ready to be distributed
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
        Fallback
     */

    function() public payable {
    }
}
