/**
 * Helper function to get a Web3 instance
 * Uses the Web3 loaded from CDN
 */
export const getWeb3 = () => {
    if (typeof window.Web3 === 'undefined') {
      throw new Error('Web3 is not loaded. Check if the CDN script is included in your HTML.');
    }
    
    if (typeof window.ethereum !== 'undefined') {
      return new window.Web3(window.ethereum);
    } else if (typeof window.web3 !== 'undefined') {
      // Legacy dapp browsers
      return new window.Web3(window.web3.currentProvider);
    } else {
      // Fallback to a public provider (not recommended for production)
      return new window.Web3('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
    }
  };
  
  /**
   * Check if MetaMask or another Web3 provider is installed
   */
  export const isWeb3Available = () => {
    return typeof window.ethereum !== 'undefined' || typeof window.web3 !== 'undefined';
  };
  
  /**
   * Get the current connected account
   */
  export const getCurrentAccount = async () => {
    if (!isWeb3Available()) {
      throw new Error('No Web3 provider detected');
    }
    
    const web3 = getWeb3();
    const accounts = await web3.eth.getAccounts();
    return accounts[0] || null;
  };
  
  /**
   * Request account access from the user
   */
  export const requestAccounts = async () => {
    if (!isWeb3Available()) {
      throw new Error('No Web3 provider detected');
    }
    
    const web3 = getWeb3();
    return await web3.eth.requestAccounts();
  };
  
  /**
   * Sign a message with the current account
   */
  export const signMessage = async (message, account) => {
    if (!isWeb3Available()) {
      throw new Error('No Web3 provider detected');
    }
    
    const web3 = getWeb3();
    return await web3.eth.personal.sign(message, account, '');
  };
  
  export default getWeb3;