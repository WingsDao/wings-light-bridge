# Wings Light Bridge

In this tutorial we are going to walkthrough the Wings integration process.

## Content
#### Initial setup
  - [Setup](https://github.com/WingsDao/wings-light-bridge#1-setup)
  - [Prepare constructor arguments](https://github.com/WingsDao/wings-light-bridge#2-prepare-constructor-arguments)
  - [Deploy](https://github.com/WingsDao/wings-light-bridge#3-deploy)
  - [Create project](https://github.com/WingsDao/wings-light-bridge#4-create-project)
  - [Find DAO address](https://github.com/WingsDao/wings-light-bridge#5-find-dao-address)
  - [Find crowdsaleController address](https://github.com/WingsDao/wings-light-bridge#6-find-crowdsalecontroller-address)
  - [Transfer management of Bridge contract](https://github.com/WingsDao/wings-light-bridge#7-transfer-management-of-bridge-contract)
#### Bridge methods
  - [getToken](https://github.com/WingsDao/wings-light-bridge#gettoken)
  - [changeToken](https://github.com/WingsDao/wings-light-bridge#changetoken)
  - [notifySale](https://github.com/WingsDao/wings-light-bridge#notifysale)
  - [calculateRewards](https://github.com/WingsDao/wings-light-bridge#calculaterewards)
  - [Transferring rewards](https://github.com/WingsDao/wings-light-bridge#transferring-rewards)
  - [finish](https://github.com/WingsDao/wings-light-bridge#finish)

## Requirements

- Nodejs v8
- Truffle
- Ganache-cli v6.1.0

# Step by step guide

### 1. Setup ###

Clone this repository.

```
git clone https://github.com/wingsdao/wings-light-bridge.git
```

### 2. Prepare constructor arguments ###

**You need to prepare these variables:**
  - `minimalGoal` - soft cap of your crowdfunding campaign
  - `hardCap` - hard cap of your crowdfunding campaign
  - `token` - address of your ERC20-compliant token

### 3. Deploy ###

Deploy contracts to mainnet using truffle, parity, etc.

**Important:** During deployment pass `minimalGoal`, `hardCap`, `token` as arguments to constructor.

### 4. Create project ###

Create project at Wings platform as custom contract and provide address of **bridge** contract.

Now we need to create project at Wings platform. We go to [Wings](https://wings.ai), fill project details, and at **Smart contract** tab we need to select __Custom Contract__ and put **Bridge Contract Address** to __Contract address__ field.

Like on image:

![contract address](https://i.imgur.com/myATGnp.png)

### 5. Find DAO address

To do it, just take URL of your project, like:

https://wings.ai/project/0x28e7f296570498f1182cf148034e818df723798a

As you see - `0x28e7f296570498f1182cf148034e818df723798a`, it's your DAO contract address. You can check it via parity or some other ethereum clients/tools. Account that you used during project creation at [wings.ai](https://wings.ai) is owner of this smart contract.

### 6. Find crowdsaleController address ###

`crowdsaleController()` - `DAO` getter function.

**Returns:**
  - address of Crowdsale Controller

*If you are making a call from js it may look something like this:*
```js
const dao = await DAO.at('0x0000000000000000000000000000000000000000') // change with your DAO address
const ccAddress = await dao.crowdsaleController.call()
```

### 7. Transfer management of Bridge contract ###

When project is created call method `transferManager(address _newManager)` and pass address of `CrowdsaleController` to it.

**Parameters:**
  - `_newManager` - address of `CrowdsaleController`

---

You can start your crowdsale.

---

## When crowdsale is about to end

### getToken ###

If you need to check address of token contract which you specified during Bridge deploy, use `getToken` method.

```sc
function getToken()
  public
  view
  returns (address)
{
  return address(token);
}
```
**Returns:**
  - address of token contract

### changeToken ###

To change token address use `changeToken` method.

```sc
function changeToken(address _newToken) onlyOwner() {
  token = IERC20(_newToken);
}
```
**Parameters:**
  - `_newToken` - address of new token contract

### notifySale ###

When crowdsale is over, make a call to this method and pass as arguments collected ETH amount and how many tokens were sold.

```sc
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
```

**Parameters:**
  - `_ethAmount` - the amount of funds raised (in Wei)
  - `_tokensAmount` - the amount of tokens sold

### calculateRewards ###

Communicates with `CrowdsaleController` (aka `IWingsController`) and calculates rewards.

```sc
function calculateRewards() public view returns (uint256, uint256) {
  uint256 tokenRewardPart = IWingsController(manager).tokenRewardPart();
  uint256 ethRewardPart = IWingsController(manager).ethRewardPart();

  uint256 tokenReward = totalSold.mul(tokenRewardPart) / 1000000;
  uint256 ethReward = (ethRewardPart == 0) ? 0 : (totalCollected.mul(ethRewardPart) / 1000000);

  return (ethReward, tokenReward);
}
```

**Returns:**
  - `ethReward` - ETH reward amount (in Wei)
  - `tokenReward` - token reward amount

### Transferring rewards ###

And now, before making a call to `finish` method, make a call to method `calculateRewards` to find out the amount of rewards.

**Important:** Send token and ETH rewards to `Bridge` contract.

### finish ###

Call this method to stop `Bridge`. Changes the state of crowdsale to `completed`.

```sc
function finish()
  public
  hasntStopped()
  hasBeenStarted()
  whenCrowdsaleAlive()
  onlyOwner()
{
  completed = true;
}
```

---

That's it. Crowdsale is finished.

---

## Developing

We recommend to make pull requests to current repository. Each pull request should be covered with tests.

Fetch current repository, install dependencies:

    npm install

We strongly recommend to develop using [ganache-cli](https://github.com/trufflesuite/ganache-cli) to save time and cost.

## Testing

To run tests fetch current repository, install dependencies and run:

    truffle test

## Authors

Wings Stiftung

## License

See in [license file](https://github.com/WingsDao/wings-light-integration/blob/master/LICENSE).
