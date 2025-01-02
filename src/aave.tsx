import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { ethers } from "ethers";
import { providers } from "web3";

import { ProviderSettings } from "./provider";

const AAVE_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
const ASSETS = {
  USDC: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    aTokenAddress: "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c",
    name: "USDC",
    decimals: 6,
  },
  USDT: {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    aTokenAddress: "0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a",
    name: "USDT",
    decimals: 6,
  },
};
// const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
// const aETHUSDC = "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c";
// const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

type SupplyEvent = {
  amount: ethers.BigNumber;
  timestamp: number;
};

interface AssetBalanceProps {
  assetKey: keyof typeof ASSETS;
  providerUrl: string;
}

const Balance: React.FC<AssetBalanceProps> = ({ assetKey, providerUrl }) => {
  const [address, setAddress] = useState(() => {
    return localStorage.getItem(`userAddress_${assetKey}`) || "";
  });
  const [balance, setBalance] = useState<number>(0);
  const [supplies, setSupplies] = useState<SupplyEvent[]>([]);
  const [interest, setInterest] = useState<number>(0);
  const [apy, setApy] = useState<number>(0);

  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>(
    () => new ethers.providers.JsonRpcProvider(providerUrl),
  );

  const asset = ASSETS[assetKey];

  // Update localStorage whenever address changes
  useEffect(() => {
    setProvider(new ethers.providers.JsonRpcProvider(providerUrl));
  }, [providerUrl]);

  const fetchBalance = async () => {
    try {
      const contract = new ethers.Contract(
        asset.aTokenAddress,
        [
          "function balanceOf(address) view returns (uint256)",
          "function decimals() view returns (uint8)",
        ],
        provider,
      );

      const balance = await contract.balanceOf(address);
      console.log("balance", balance);
      const decimals = await contract.decimals();
      const formattedBalance = Number(balance) / Math.pow(10, decimals);
      setBalance(formattedBalance);
      // query the supply/withdraw pair to get the sum_i(amount_i*duration_i)
      const poolContract = new ethers.Contract(
        AAVE_POOL,
        [
          "event Supply(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referralCode)",
        ],
        provider,
      );

      const filter = poolContract.filters.Supply(null, null, address);
      const events = await poolContract.queryFilter(filter);

      let supplyEvents: SupplyEvent[] = [];
      for (let event of events) {
        const block = await event.getBlock();
        supplyEvents.push({
          amount: event?.args?.amount,
          timestamp: block.timestamp,
        });
      }

      const now = Date.now() / 1000; // in seconds
      const sum = supplyEvents.reduce((acc, event) => {
        return acc + Number(event.amount) * (now - event.timestamp);
      }, 0);
      console.log("sum (amount*days)", sum / (3600 * 24));
      const supply = supplyEvents.reduce((acc, event) => {
        return acc + Number(event.amount);
      }, 0);
      const interest = balance - supply;
      console.log("interest", interest / 1e6);
      setInterest(interest / 1e6);
      setSupplies(supplyEvents);
      console.log(supplyEvents);

      // calculate APY
      const aps = interest / sum;
      setApy(aps * 365 * 3600 * 24); // 1 year in seconds
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(0);
    }
  };

  return (
    <div>
      <h2>a{asset.name} Balance</h2>
      <input
        type="text"
        placeholder="Enter address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button onClick={fetchBalance}>Get Balance</button>
      {balance !== null && (
        <div>
          <span>
            Balance: {balance} a{asset.name}
          </span>{" "}
          <br />
          <span>
            Supply: {balance - interest} {asset.name}
          </span>{" "}
          <br />
          <span>
            Interest: {interest} a{asset.name}
          </span>{" "}
          <br />
          <span>APY: {apy}</span>
          <p>
            <b>Supply Events</b>
          </p>
          <ul>
            {supplies.map((supply, index) => (
              <li key={index}>
                Amount: {Number(supply.amount) / Math.pow(10, asset.decimals)}{" "}
                {asset.name} at{" "}
                {(() => {
                  const now = Date.now() / 1000;
                  const diffDays = Math.floor(
                    (now - supply.timestamp) / (24 * 60 * 60),
                  );
                  if (diffDays < 30) {
                    return `${diffDays} days ago`;
                  } else {
                    const months = Math.floor(diffDays / 30);
                    const remainingDays = diffDays % 30;
                    return `${months} months and ${remainingDays} days ago`;
                  }
                })()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [providerUrl, setProviderUrl] = useState(() => {
    return localStorage.getItem("providerUrl") || DEFAULT_PROVIDER_URL;
  });
  useEffect(() => {
    localStorage.setItem("providerUrl", providerUrl);
  }, [providerUrl]);
  return (
    <div>
      <ProviderSettings
        providerUrl={providerUrl}
        onProviderChange={setProviderUrl}
      />
      <h1>aETH/USDC Balance Checker</h1>
      <Balance assetKey="USDC" providerUrl={providerUrl} />
      <Balance assetKey="USDT" providerUrl={providerUrl} />
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<App />);
