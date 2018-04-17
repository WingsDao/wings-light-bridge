pragma solidity 0.4.18;


import './wings/BasicCrowdsale.sol';
import './wings/IWingsController.sol';
import './wings/SafeMath.sol';
import './wings/IERC20.sol';


/*
  Standalone Bridge
*/
contract Bridge is BasicCrowdsale {

  using SafeMath for uint256;

  // Crowdsale token must be ERC20-compliant
  IERC20 token;

  // Crowdsale state
  bool completed;

  // Constructor
  function Bridge(
    uint256 _minimalGoal,
    uint256 _hardCap,
    address _token
  )
    BasicCrowdsale(msg.sender, msg.sender) // owner, manager
  {
    minimalGoal = _minimalGoal;
    hardCap = _hardCap;
    token = IERC20(_token);
  }

  /*
     Here goes ICrowdsaleProcessor methods implementation
  */

  // Returns address of crowdsale token
  function getToken()
    public
    view
    returns (address)
  {
    return address(token);
  }

  // Mints token Rewards to Forecasting contract
  // called by CrowdsaleController
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
  function notifySale(uint256 _ethAmount, uint256 _tokensAmount)
    public
    hasBeenStarted()
    hasntStopped()
    whenCrowdsaleAlive()
    onlyOwner()
  {
    totalCollected = totalCollected.add(_ethAmount);
    totalSold = totalSold.add(_tokensAmount);
  }

  // Validates parameters and starts crowdsale
  // called by CrowdsaleController
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

    uint256 tokenReward = totalSold.mul(tokenRewardPart) / 1000000;
    uint256 ethReward = (ethRewardPart == 0) ? 0 : (totalCollected.mul(ethRewardPart) / 1000000);

    return (ethReward, tokenReward);
  }

  function changeToken(address _newToken) onlyOwner() {
    token = IERC20(_newToken);
  }
}
