pragma solidity ^0.4.18;


import 'zeppelin-solidity/contracts/token/BasicToken.sol';


contract DefaultToken is BasicToken {

  string public name;
  string public symbol;
  uint8 public decimals;

  function DefaultToken(string _name, string _symbol, uint8 _decimals) {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
  }
}
