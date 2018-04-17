pragma solidity 0.4.19;

/*
  ERC20 compliant token interface
*/
contract IERC20 {
  function transfer(address to, uint256 value) public returns (bool);
}
