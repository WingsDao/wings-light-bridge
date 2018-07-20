pragma solidity ^0.4.18;


// Wings Controller Interface
contract IWingsController {
  uint256 public ethRewardPart;
  uint256 public tokenRewardPart;

  function fitCollectedValueIntoRange(uint256 _totalCollected) public view returns (uint256);
  function start(uint256 _startTimestamp, uint256 _endTimestamp, address _fundingAddress) public;
}
