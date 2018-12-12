# Wings Light Bridge

Wings easy integration.

## Content
#### Initial setup
  - [Setup](#1-setup)
  - [Prepare constructor arguments](#2-prepare-constructor-arguments)
  - [Deploy](#3-deploy)
  - [Create project](#4-create-project)

#### Crowdsale start
  - [Find DAO address from url](#1-find-dao-address-from-url)
  - [Transfer management to DAO](#2-transfer-management-to-dao)
  - [Make a call to method createCustomCrowdsale in DAO contract](#3-make-a-call-to-method-createcustomcrowdsale-in-dao-contract)
  - [Find crowdsaleController address](#4-find-crowdsalecontroller-address)
  - [Start crowdsale](#5-start-crowdsale)

#### Bridge methods
  - [getToken](#gettoken)
  - [changeToken](#changetoken)
  - [withdraw](#withdraw)
  - [setCrowdsaleGoal](#setCrowdsaleGoal-(optional))
  - [setCrowdsalePeriod](#setCrowdsalePeriod-(optional))

#### Finishing Bridge
  - [Summarising crowdsale results](#notifySale)
  - [Calculating rewards](#calculaterewards)
  - [Transferring rewards](#transferring-rewards)
  - [Finishing Bridge](#finish)

## Requirements

- Nodejs ~8.6.0
- Truffle ^4.0.4
- Ganache-cli ^6.1.0

# Step by step guide

In this tutorial we are going to walkthrough the Wings integration process.

### 1. Setup

Clone this repository.

```
git clone https://github.com/wingsdao/wings-light-bridge.git
```

### 2. Сonstructor

```
await deployer.deploy(Bridge, owner, manager, { from: creator })
```

**Parameters:**
 - `owner` - address - owner of Bridge
 - `manager` - address - could be either owner or DAO address (if already exists)

### 3. Deploy

Deploy Bridge contract to mainnet using truffle, parity, etc. with constructor arguments described above.

---

## If you already created project on wings.ai head to [¶Crowdsale start](#crowdsale-start-1).

---


### 4. Create project

Create project on Wings platform as custom contract and provide address of **bridge** contract.

Now we need to create project on Wings platform.
1. Go to [Wings project creating](https://www.wings.ai/project_creating) and select **Custom Contract**
![select custom contract](https://i.imgur.com/DCn704E.png)
2. In **Project overview** tab add Bridge contract address to **Bridge contract address** field
![add bridge contract address](https://i.imgur.com/YqZ5MB4.png)

---


After this step you can start your project's forecasting.


---

---


When the forecasting finish you have 45 days to start your project's crowdsale.


---

## Crowdsale start

### 1. Find DAO address from url

To do it, just take URL of your project, like:

`https://wings.ai/project/0x28e7f296570498f1182cf148034e818df723798a`

As you see - `0x28e7f296570498f1182cf148034e818df723798a`, it's your DAO contract address. You can check it via parity or some other ethereum client/tool. Account that you used during project creation on [wings.ai](https://wings.ai) is owner of this smart contract.

Initiate `DAO` contract with the address we just retrieved:

Here are [artifacts](https://github.com/WingsDao/wings-light-bridge/tree/master/build) for contracts and we recommend to use [truffle contract](https://github.com/trufflesuite/truffle-contract) library to make calls.

Here are [interfaces](https://github.com/WingsDao/wings-light-bridge/tree/master/contracts/interfaces) for contracts.

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

To start crowdsale, complete the following steps.

### 3. Make a call to method createCustomCrowdsale in DAO contract

Make a call to method `DAO.createCustomCrowdsale()`.

**Interface:**
```sc
function createCustomCrowdsale() public;
```

**Example:**
```js
await dao.createCustomCrowdsale()
```

### 4. Find crowdsaleController address

Make a call to getter method `DAO.crowdsaleController()`.


**Interface:**
```sc
function crowdsaleController() public view returns (address);
```

**Example:**
```js
const ccAddress = await dao.crowdsaleController.call()
const crowdsaleController = await IWingsController.at(ccAddress)
```

### 5. Start crowdsale

To start your project's crowdsale (`Bridge`) you need to make a call to `crowdsaleController`'s method `start`.

**Interface:**
```sc
function start(uint256 _startTimestamp, uint256 _endTimestamp, address _fundingAddress) public;
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

## Bridge methods

### getToken

If you need to check address of token contract which you specified during Bridge deploy, use `getToken` method.

```sc
function getToken() public view returns (address);
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

### setCrowdsaleGoal (optional)

You can set and update crowdsale goals in the Bridge any time before the end of crowdsale.

```sc
function setCrowdsaleGoal(uint256 _minimalGoal, uint256 _hardCap) public;
```
**Description:**
- Can be called any time before Bridge is finished.

**Parameters:**
 - `_minimalGoal` - uint256 - soft cap of crowdsale (in the same currency as the forecast question)
 - `_hardCap` - uint256 - hard cap of crowdsale (in the same currency as the forecast question)

 **Important:** If collected minimal goal or hard cap is in normal currency (with 2 decimal places, e.g. USD) it should be padded to the number with 18 decimal places.  
 *Example: If your hard cap is 1000000$ you will have to pass 1000000000000000000000000 as `_hardCap`.*

*NOTE: Hard cap must be greater then minimal goal. Minimal goal must be greater then 0.*

### setCrowdsalePeriod (optional)

You can set and update crowdsale time frame in the Bridge any time before the end of crowdsale.

```sc
function setCrowdsalePeriod(uint256 _startTimestamp, uint256 _endTimestamp) public;
```
**Description:**
- Can be called any time before Bridge is finished.

**Parameters:**
 - `_startTimestamp` - uint256 - start of crowdsale (unix timestamp)
 - `_endTimestamp` - uint256 - end of crowdsale (unix timestamp)

 *NOTE: End timestamp must be greater then start timestamp. Start timestamp must be greater then 0.*

### withdraw

If some error occurred during token and/or ETH reward transfer to Bridge contract, you can use method `withdraw` to return funds.

```sc
function withdraw(uint256 _ethAmount, uint256 _tokenAmount) public;
```
**Parameters:**
- `_ethAmount` - uint256 - amount of wei to withdraw
- `_tokenAmount` - uint256 - amount of tokens (minimal value similar to wei in eth) to withdraw

**Description:**
- Can be called any time before Bridge is finished.

## Finishing Bridge

### notifySale

When crowdsale is over, make a call to this method and pass as arguments collected ETH amount and how many tokens were sold.

```sc
function notifySale(uint256 _amount, uint256 _ethAmount, uint256 _tokensAmount) public;
```

**Parameters:**
 - `_amount` - total collected amount *(in currency which you specified in forecasting question)*
 - `_ethAmount` - amount of funds raised *(in Wei) (0 if forecasting currency is ETH)*
 - `_tokensAmount` - amount of tokens sold

**Important:** If collected amount is in normal currency (with 2 decimal places, e.g. USD) it should be padded to the number with 18 decimal places.  
*Example: If you have collected 1000$ and 14¢ you will have to pass 1000140000000000000000 as `_totalCollected`.*

**Important:** `_amount` should be the same as the currency which was used in forecasting question. If you have collected funds in USD, pass USD collected amount (padded to 18 decimals) as `_amount` argument and its translated amount in ETH as `_ethAmount` argument.

**NOTE:** Every call to this method will override previous values.

### calculateRewards

Communicates with `CrowdsaleController` (aka `IWingsController`) and calculates rewards.

```sc
function calculateRewards() public view returns (uint256, uint256);
```
**Description:**
 - Calculates rewards absolutely the same as it does the wings crowdsale controller.

**Returns:**
  - `ethReward` - ETH reward amount (in Wei)
  - `tokenReward` - token reward amount

### Transferring rewards

And now, before making a call to `finish` method, make a call to method `calculateRewards` to find out the amount of rewards.

**Important:** Send token and ETH rewards to `Bridge` contract.

### rewardsAreReady

Check whether rewards are ready and Bridge can be finished.

```cs
function rewardsAreReady() public;
```

**Returns:**
- `bool` - whether Bridge contract contains rewards and is ready to be finished

### finish

Call this method to stop `Bridge`.

```sc
function finish() public;
```
**Description:**
- Checks if the Bridge balance has enough ETH and tokens for rewards.
- Changes the state of crowdsale to `completed`.
- If total collected amount is less then minimal goal - crowdsale status will evaluate to failed.

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
