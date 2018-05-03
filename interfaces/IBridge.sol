pragma solidity ^0.4.18;


contract IBridge {
  function transferManager(address _newManager) public;
  function getToken() public view returns (address);
  function changeToken(address _newToken) public;
  function notifySale(uint256 _ethAmount, uint256 _tokensAmount) public;
  function calculateRewards() public view returns (uint256, uint256);
  function finish() public;
}
