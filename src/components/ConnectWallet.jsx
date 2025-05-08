import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import { getNonce, verifySignature, checkAuth, clearSession } from "../utils/api";

const ConnectWallet = ({ onLogin }) => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await checkAuth();
        
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setWalletAddress(response.data.walletAddress);
          setMessage(`Authenticated as: ${response.data.walletAddress.slice(0, 6)}...${response.data.walletAddress.slice(-4)}`);
    
          if (onLogin) {
            onLogin(response.data.walletAddress);
          }
    
          // Only navigate if we're not already on the dashboard
          if (!window.location.pathname.includes('/dashboard')) {
            navigate("/dashboard/vote");
          }
        } else {
          // If not authenticated, ensure we redirect to login if on a protected route
          if (window.location.pathname.includes('/dashboard')) {
            navigate('/');
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        clearSession();
        
        // Redirect to login if on a protected route
        if (window.location.pathname.includes('/dashboard')) {
          navigate('/');
        }
      }
    };
  
    checkAuthentication();
  }, [onLogin, navigate]);

  // Connect to wallet and authenticate
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError("Please install MetaMask or another Web3 wallet.");
      return;
    }

    setLoading(true);
    setMessage("Connecting to wallet...");
    setError("");

    try {
      // Initialize Web3 with the injected provider
      const web3 = new Web3(window.ethereum);
      
      // Request account access
      const accounts = await web3.eth.requestAccounts();
      const walletAddress = accounts[0];

      setMessage(`Wallet connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
      
      // Get authentication nonce from server
      setMessage("Requesting authentication nonce...");
      const nonceResponse = await getNonce(walletAddress);
      const nonce = nonceResponse.data.nonce;

      // Create the message to sign
      const message = `Sign this message to authenticate: ${nonce}`;
      setMessage("Please sign the message in your wallet...");
      
      // Request signature from the user
      const signature = await web3.eth.personal.sign(message, walletAddress, "");

      // Verify the signature on the server
      const verificationResponse = await verifySignature(walletAddress, signature);

      if (verificationResponse.data.success) {
        setMessage("Authentication successful!");
        setIsAuthenticated(true);
        setWalletAddress(walletAddress);
        localStorage.setItem('walletAddress', walletAddress);
        
        // Store the session token
        localStorage.setItem('sessionToken', verificationResponse.data.token);

        if (onLogin) {
          onLogin(walletAddress);
        }

        navigate("/dashboard/vote");
      } else {
        throw new Error("Signature verification failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(`Error: ${error.message || "Unknown error occurred"}`);
      setMessage("");
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  // Handle user logout
  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    setWalletAddress("");
    setMessage("");
    navigate('/');
  };

  // Listen for account changes in MetaMask
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User has disconnected all accounts
          handleLogout();
        } else if (isAuthenticated && accounts[0] !== walletAddress) {
          // User switched to a different account, log them out
          handleLogout();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Clean up the event listener
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [isAuthenticated, walletAddress]);

  return (
    <div className="connect-wallet-container">
      {isAuthenticated ? (
        <>
          <p>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
          <button 
            onClick={handleLogout}
            className="logout-button"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button 
          onClick={connectWallet} 
          disabled={loading}
          className="connect-button"
        >
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
      
      {message && <p className="status-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ConnectWallet;