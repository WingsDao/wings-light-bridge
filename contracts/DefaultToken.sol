pragma solidity 0.4.19;


contract DefaultToken {

  string public name;
  string public symbol;
  uint8 public decimals;

  function DefaultToken(string _name, string _symbol, uint8 _decimals) {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
  }
}
