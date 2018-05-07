# Wings Light Bridge CLI

Command-Line Interface for Wings Light Bridge.
Original [documentation](https://github.com/WingsDao/wings-light-bridge/tree/master#wings-light-bridge).

## Content
 - [Getting started](https://github.com/WingsDao/wings-light-bridge/tree/cli#getting-started)
 - [Deploy](https://github.com/WingsDao/wings-light-bridge/tree/cli#deploy)
 - [Forecasting](https://github.com/WingsDao/wings-light-bridge/tree/cli#forecasting)
 - [Before crowdsale start](https://github.com/WingsDao/wings-light-bridge/tree/cli#before-crowdsale-start)
 - [Before crowdsale end](https://github.com/WingsDao/wings-light-bridge/tree/cli#before-crowdsale-end)

## Requirements

- Nodejs v8
- Truffle v4.0.6
- Ganache-cli v6.1.0

# Getting started

### 1. Clone repository

```
git clone -b cli https://github.com/wingsdao/wings-light-bridge.git
```

### 2. Install dependencies

```
npm i
```

### 3. Configure truffle.js

```
cp truffle.example.js truffle.js
```
Have a look at `truffle.example.js`, which is example of how `truffle.js` should look like and configure it for your needs (configure network parameters).

In `truffle.js` file make setup:
 - `rawPrivateKey` - put your raw private key (without `0x` prefix). It will be used during deploy of contracts and for signing transactions.
 - Set your web3 provider in `PROVIDER` variable.  
   - (optional) Set api access token if your web3 provider needs it in `API_TOKEN`.
 - (optional) Set the `gasPrice` to the amount which you are most comfortable with.

### 4. Start cli

```
node index
```

## Deploy

You will be asked to enter:
 - token name (1-12 characters)
 - token symbol (3-5 characters)
 - token decimals

*NOTE: Save bridge contract address, you will need it later.*

## Forecasting

During forecasting period we need to transfer management of the `Bridge` contract to `DAO` contract.

You will be asked to enter:
 - `Bridge` contract address
 - `DAO` contract address

You can find `DAO` contract address from url.
To do it, just take URL of your project, like:

> https://wings.ai/project/0x28e7f296570498f1182cf148034e818df723798a

As you see - `0x28e7f296570498f1182cf148034e818df723798a`, it's your `DAO` contract address.

## Before crowdsale start

At this stage we need to start bridge.

You will be asked to enter:
 - `DAO` contract address

## Before crowdsale end

### Change token

Because during initial deploy `Default token` was used now we need to change it to the real one.

You will be asked to enter:
 - address of your real token contract

### Calculate rewards

You will be asked to enter:
 - total collected amount (ETH)
 - total sold amount (integer amount of tokens)
 - whether you are ready to transfer rewards or not (yes/no)

*NOTE: You have to have enough tokens and ETH for rewards on your balance before you make a transfer.*
*NOTE: If you don't have enough tokens and/or ETH on your account please choose no, fund your account and repeat the process.*

**Important: Be careful because if you choose yes token and ETH reward amounts will immediately be transferred to `Bridge` contract.**

### Finish bridge

The final step is to finish the Bridge.

You will be asked to enter:
 - `Bridge` contract address

---

That's it. Bridge is finished.

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
