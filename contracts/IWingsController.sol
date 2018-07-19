pragma solidity ^0.4.18;


// Wings Controller Interface
contract IWingsController {
  uint256 public ethRewardPart;
  uint256 public tokenRewardPart;

  function fitCollectedValueIntoRange(uint256 _totalCollected) public view returns (uint256);
}
