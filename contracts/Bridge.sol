pragma solidity ^0.4.18;


import 'wings-integration/contracts/BasicCrowdsale.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/token/DetailedERC20.sol';

import './IWingsController.sol';


/*
  Standalone Bridge
*/
contract Bridge is BasicCrowdsale {

  using SafeMath for uint256;

  event CUSTOM_CROWDSALE_TOKEN_ADDED(address token, uint8 decimals);
  event CUSTOM_CROWDSALE_GOAL_ADDED(uint256 minimalGoal, uint256 hardCap);
  event CUSTOM_CROWDSALE_PERIOD_ADDED(uint256 startTimestamp, uint256 endTimestamp);
  event CUSTOM_CROWDSALE_FINISH();

  modifier onlyOwnerOrManager() {
    require(msg.sender == owner || msg.sender == manager);
    _;
  }

  // Crowdsale token must be ERC20-compliant
  DetailedERC20 token;

  // Crowdsale state
  bool completed;

  // Constructor
  function Bridge(
    address _owner,
    address _manager
  )
    public
    BasicCrowdsale(_owner, _manager) // owner, manager
  {}

  /*
     Here goes ICrowdsaleProcessor methods implementation
  */

  // Returns address of crowdsale token
  function getToken()
    public
    returns (address)
  {
    return address(token);
  }

  // Mints token Rewards to Forecasting contract
  // called by IWingsController
  function mintTokenRewards(
    address _contract,
    uint256 _amount    // agreed part of totalSold which is intended for rewards
  )
    public
    onlyManager()
  {
    // in our example we are transferring tokens instead of minting them
    token.transfer(_contract, _amount);
  }

  function releaseTokens() public onlyManager() hasntStopped() whenCrowdsaleSuccessful() {
  }

  /*
     Crowdsale methods implementation
  */

  // Fallback payable function
  function() public payable {
  }

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
  }

  // Validates parameters and starts crowdsale
  // called by IWingsController
  function start(
    uint256 _startTimestamp,
    uint256 _endTimestamp,
    address _fundingAddress
  )
    public
    hasntStarted()
    hasntStopped()
    onlyManager()
  {
    started = true;

    CROWDSALE_START(_startTimestamp, _endTimestamp, _fundingAddress);
  }

  // Finish crowdsale
  function finish()
    public
    hasntStopped()
    hasBeenStarted()
    whenCrowdsaleAlive()
    onlyOwner()
  {
    completed = true;

    CUSTOM_CROWDSALE_FINISH();
  }

  function isFailed()
    public
    view
    returns (bool)
  {
    return (false);
  }

  function isActive()
    public
    view
    returns (bool)
  {
    return (started && !completed);
  }

  function isSuccessful()
    public
    view
    returns (bool)
  {
    return (completed);
  }

  // Find out the amount of rewards in ETH and tokens
  function calculateRewards() public view returns (uint256, uint256) {
    uint256 tokenRewardPart = IWingsController(manager).tokenRewardPart();
    uint256 ethRewardPart = IWingsController(manager).ethRewardPart();
    uint256 ethReward;
    bool hasEthReward = (ethRewardPart != 0);

    uint256 tokenReward = totalSold.mul(tokenRewardPart) / 1000000;

    if (hasEthReward) {
      ethReward = ((totalCollectedETH == 0) ? totalCollected : totalCollectedETH).mul(ethRewardPart) / 1000000;
    }

    return (ethReward, tokenReward);
  }

  // Change token address (in case you've used the dafault token address during bridge deployment)
  function changeToken(address _newToken) public onlyOwnerOrManager() {
    token = DetailedERC20(_newToken);

    uint8 tokenDecimals = uint8(token.decimals());

    require(tokenDecimals >= 8 && tokenDecimals <= 18);

    emit CUSTOM_CROWDSALE_TOKEN_ADDED(address(token), tokenDecimals);
  }

  // Set/update crowdsale goal
  function setCrowdsaleGoal(uint256 _minimalGoal, uint256 _hardCap) public onlyOwnerOrManager() {
    require(_minimalGoal > 0 && _hardCap > _minimalGoal);

    minimalGoal = _minimalGoal;
    hardCap = _hardCap;

    CUSTOM_CROWDSALE_GOAL_ADDED(minimalGoal, hardCap);
  }

  // Set/update crowdsale period
  function setCrowdsalePeriod(uint256 _startTimestamp, uint256 _endTimestamp) public onlyOwnerOrManager() {
    require(_startTimestamp > 0 && _endTimestamp > _startTimestamp);

    startTimestamp = _startTimestamp;
    endTimestamp = _endTimestamp;

    CUSTOM_CROWDSALE_PERIOD_ADDED(startTimestamp, endTimestamp);
  }

  // Gives owner ability to withdraw eth and wings from Bridge contract balance in case if some error during reward calculation occured
  function withdraw() public onlyOwner() {
    uint256 ethBalance = address(this).balance;
    uint256 tokenBalance = token.balanceOf(address(this));

    if (ethBalance > 0) {
      require(msg.sender.send(ethBalance));
    }

    if (tokenBalance > 0) {
      require(token.transfer(msg.sender, tokenBalance));
    }
  }
}
