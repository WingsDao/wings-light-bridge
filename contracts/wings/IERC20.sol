pragma solidity 0.4.19;

/*
  ERC20 compliant token interface
*/
contract IERC20 {
  function name() public view returns (string);
  function symbol() public view returns (string);
  function decimals() public view returns (uint8);
  /* string public name;
  string public symbol;
  uint8 public decimals; */
  function transfer(address to, uint256 value) public returns (bool);
}
