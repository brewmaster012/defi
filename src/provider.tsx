import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { ethers } from "ethers";
import { providers } from "web3";

const DEFAULT_PROVIDER_URL =
  "https://eth-mainnet.nodereal.io/v1/1659dfb40aa24bbb8153a677b98064d7";

interface ProviderSettingsProps {
  providerUrl: string;
  onProviderChange: (url: string) => void;
}

const ProviderSettings: React.FC<ProviderSettingsProps> = ({
  providerUrl,
  onProviderChange,
}) => {
  const resetProvider = () => {
    onProviderChange(DEFAULT_PROVIDER_URL);
  };
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f5f5f5",
        borderRadius: "5px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      }}
    >
      <h3>Provider Settings</h3>
      <input
        type="text"
        placeholder="Provider URL"
        value={providerUrl}
        onChange={(e) => onProviderChange(e.target.value)}
        style={{ width: "300px" }}
      />
      <button onClick={resetProvider}>Reset to Default</button>
    </div>
  );
};

export { ProviderSettings };
