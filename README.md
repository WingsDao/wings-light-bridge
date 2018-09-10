# Wings Light Bridge

In this tutorial we are going to walkthrough the Wings integration process.

## Content
#### Initial setup
  - [Setup](#1-setup)
  - [Prepare constructor arguments](#2-prepare-constructor-arguments)
  - [Deploy](#3-deploy)
  - [Create project](#4-create-project)

#### During forecasting
  - [Find DAO address from url](#1-find-dao-address-from-url)
  - [Transfer management to DAO](#2-transfer-management-to-dao)

#### Crowdsale start
  - [Make a call to method createCustomCrowdsale in DAO contract](#1-make-a-call-to-method-createcustomcrowdsale-in-dao-contract)
  - [Find crowdsaleController address](#2-find-crowdsalecontroller-address)
  - [Start crowdsale](#3-start-crowdsale)

#### Bridge methods
  - [getToken](#gettoken)
  - [changeToken](#changetoken)
  - [notifySale](#notifysale)
  - [withdraw](#withdraw)

#### Finishing Bridge
  - [Calculating rewards](#calculaterewards)
  - [Transferring rewards](#transferring-rewards)
  - [Finishing Bridge](#finish)

## Requirements

- Nodejs v10.2.1
- Truffle v4.1.8
- Ganache-cli v6.1.0

# Step by step guide

### 1. Setup

Clone this repository.

```
git clone https://github.com/wingsdao/wings-light-bridge.git
```

### 2. Prepare constructor arguments

*NOTE: Before deployment of Bridge contract you may already have deployed token contract. In this case just head to paragraph b) and assign your deployed token address to `token` variable.*

**a) Prepare these variables for DefaultToken contract:**
  - `name` - name of your token
  - `symbol` - symbol of your token
  - `decimals` - token decimals

**b) Prepare these variables for Bridge contract:**
  - `minimalGoal` - soft cap of your crowdfunding campaign *(this argument is currently not used in wings light bridge, use default value which is set to 1)*
  - `hardCap` - hard cap of your crowdfunding campaign *(this argument is currently not used in wings light bridge, use default value which is set to 1)*
  - `token` - address of your ERC20-compliant token

### 3. Deploy

Deploy contracts to mainnet using truffle, parity, etc.

*NOTE: Before deployment of Bridge contract you may already have deployed token contract. In this case you only need to deploy Bridge contract.*

**Deployment process:**

During deployment of `DefaultToken` pass `name`, `symbol` and `decimals` as arguments to constructor.

During deployment of `Bridge` pass `minimalGoal`, `hardCap`, `token` as arguments to constructor.

### 4. Create project

Create project on Wings platform as custom contract and provide address of **bridge** contract.

Now we need to create project on Wings platform. We go to [Wings](https://wings.ai), select **Custom Contract**, then in **Project overview** tab we need to add Bridge contract address to **Bridge contract address** field.

![select custom contract](https://i.imgur.com/DCn704E.png)
![add bridge contract address](https://i.imgur.com/YqZ5MB4.png)

---


After this step you can start your project's forecasting.


---

## During forecasting

### 1. Find DAO address from url

To do it, just take URL of your project, like:

`https://wings.ai/project/0x28e7f296570498f1182cf148034e818df723798a`

As you see - `0x28e7f296570498f1182cf148034e818df723798a`, it's your DAO contract address. You can check it via parity or some other ethereum client/tool. Account that you used during project creation on [wings.ai](https://wings.ai) is owner of this smart contract.

Initiate `DAO` contract with the address we just retrieved:

Here are [ABI](https://github.com/WingsDao/wings-light-bridge/tree/master/ABI) for contracts and we recommend to use [truffle contract](https://github.com/trufflesuite/truffle-contract) library to make calls.

Here are [interfaces](https://github.com/WingsDao/wings-light-bridge/tree/master/interfaces) for contracts.

```js
const dao = await DAO.at('0x28e7f296570498f1182cf148034e818df723798a') // change with your DAO address
```

### 2. Transfer management to DAO

During forecasting period transfer manager to `DAO` contract.

**Interface:**
```sc
function transferManager(address _newManager) public;
```

**Example:**
```js
await bridge.transferManager(dao.address, { from: yourAccount }) // change with your DAO address
```

---


When the forecasting finish you have 45 days to start your project's crowdsale.


---

## Crowdsale start

To start crowdsale, complete the following steps.

### 1. Make a call to method createCustomCrowdsale in DAO contract

Make a call to method `DAO.createCustomCrowdsale()`.

**Interface:**
```sc
function createCustomCrowdsale() public onlyOwner() hasntStopped() requireStage(Stage.ForecastingClosed);
```

**Example:**
```js
await dao.createCustomCrowdsale()
```

### 2. Find crowdsaleController address

Make a call to getter method `DAO.crowdsaleController()`.


**Interface:**
```sc
function crowdsaleController() public view returns (address);
```

**Example:**
```js
const ccAddress = await dao.crowdsaleController.call()
const crowdsaleController = await CrowdsaleController.at(ccAddress)
```

### 3. Start crowdsale

To start your project's crowdsale (`Bridge`) you need to make a call to `crowdsaleController`'s method `start`.

**Interface:**
```sc
function start(
        uint256 _startTimestamp,
        uint256 _endTimestamp,
        address _fundingAddress
    )
        public;
```
**Parameters:**
  - `_startTimestamp` - timestamp of the start of your crowdsale.
  - `_endTimestamp` - timestamp of the end of your crowdsale.
  - `_fundingAddress` - the address, which will receive funds

**Example:**
```js
await crowdsaleController.start(0, 0, '0x0')
```

**IMPORTANT:** values like 0, 0, '0x0' for start works fine only if you are using bridge. If you've done full integration, you have to do it in another way.

---


After this step your crowdsale is taking place and you come back right before the end of crowdfunding to complete few final steps.


---

## When crowdsale is about to end

### getToken

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

### changeToken

**Please note that if you used `DefaultToken` you must change token address to the address of your real token contract which stores your project token rewards.**

To change token address use `changeToken` method.

```sc
function changeToken(address _newToken) public onlyOwner() {
  token = IERC20(_newToken);
}
```
**Parameters:**
  - `_newToken` - address of new token contract

### notifySale

When crowdsale is over, make a call to this method and pass as arguments collected ETH amount and how many tokens were sold.

```sc
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
```

**Parameters:**
  - `_amount` - total collected amount *(in currency which you specified in forecasting question)*
  - `_ethAmount` - amount of funds raised *(in Wei) (optional if forecasting question in ETH)*
  - `_tokensAmount` - amount of tokens sold

**Important:** If collected amount is in normal currency (with 2 decimal places, e.g. USD) it should be padded to the number with 18 decimal places.  
*Example: If you have collected 1000$ and 14¢ you will have to pass 1000140000000000000000 as `_totalCollected`.*

**Important:** `_amount` should be the same as the currency which was used in forecasting question. If you have collected funds in USD, pass USD collected amount (padded to 18 decimals) as `_amount` argument and its translated amount in ETH as `_ethAmount` argument.

### withdraw

If some error occurred during token and/or ETH reward transfer to Bridge contract, you can use method `withdraw` to return funds.

```sc
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
```

### calculateRewards

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

### Transferring rewards

And now, before making a call to `finish` method, make a call to method `calculateRewards` to find out the amount of rewards.

**Important:** Send token and ETH rewards to `Bridge` contract.

### finish

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
