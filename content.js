const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

console.log("Fiat currency to BTC conversion is running!");

// Object to store currency data for the page
let pageData = {
    currency: null, // 'USD', 'EUR', 'JPY', 'GBP', 'AED'
    values: []
};


function detectCurrency(text) {
    const patterns = {
        USD: /\$\s?\d+/
      //  EUR: /€\s?\d+|EUR\s?\d+/,
        //GBP: /£\s?\d+/,
        //JPY: /¥\s?\d+|JPY\s?\d+/,
        //AED: /AED\s?\d+/
    };

    for (let [currency, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
            return currency;
        }
    }
    return null;
}

const CRYPTO_CONFIG = {
    'BTC': { id: 'bitcoin', symbol: '₿' },
    'ETH': {id: 'ethereum', symbol: 'Ξ'},
    'XMR': {id: 'monero', symbol: 'ɱ'},
    'SOL': {id: 'solana', symbol: '◎'}
};

let cryptoRates = {};

async function fetchCryptoRates() {
  try {
    const ids = Object.values(CRYPTO_CONFIG).map(c => c.id).join(',');
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${ids}&vs_currencies=usd`
    );
    const data = await response.json();
    
    // Map all cryptocurrency rates
    cryptoRates = Object.keys(data).reduce((acc, cryptoId) => {
      const symbol = Object.keys(CRYPTO_CONFIG).find(k => CRYPTO_CONFIG[k].id === cryptoId);
      acc[symbol] = data[cryptoId].usd;
      return acc;
    }, {});
    
    console.log('Crypto rates updated:', cryptoRates);
  } catch (error) {
    console.error('Error fetching crypto rates:', error);
  }
}

function convertToCrypto(amount, currency, selectedCrypto) {
    if (!cryptoRates[selectedCrypto] || !cryptoRates[selectedCrypto]) return null;
    return (amount / cryptoRates[selectedCrypto]).toFixed(8);
}

function replaceText(node) {
    if (node.nodeType == 3) {
        const text = node.textContent;
        
        // Detect currency if not already set
        if (!pageData.currency) {
            pageData.currency = detectCurrency(text);
        }

        // Combined regex different (good for USD only)
        const regex = /(?:\$|USD)\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s?(?:USD)/g;;

        // Get selected crypto from storage with ETH default
        chrome.storage.sync.get(['selectedCrypto'], (result) => {
            const selectedCrypto = result.selectedCrypto || 'ETH';
            const cryptoData = CRYPTO_CONFIG[selectedCrypto];
            
            // Store values with crypto-agnostic structure
            let match;
            while ((match = regex.exec(text)) !== null) {
                const numericValue = parseFloat(match[0].replace(/[^\d.]/g, ''));
                const cryptoValue = convertToCrypto(numericValue, pageData.currency, selectedCrypto);
                pageData.values.push({
                    fiat: numericValue,
                    [selectedCrypto]: cryptoValue
                });
            }

            node.textContent = text.replace(regex, (match) => {
                const numericValue = parseFloat(match.replace(/[^\d.]/g, '').replace(/,/g, ''));
                const cryptoValue = convertToCrypto(numericValue, pageData.currency, selectedCrypto);
                return cryptoValue ? `${cryptoData.symbol}${cryptoValue}` : 'Loading...';
            });
        });

    } else {
        // Keep existing child node handling
        if (node.nodeName !== "SCRIPT" && 
            node.nodeName !== "STYLE" && 
            node.nodeName !== "TEXTAREA") {
            for (let i = 0; i < node.childNodes.length; i++) {
                replaceText(node.childNodes[i]);
            }
        }
    }
}


// Function to get stored currency data
function getPageCurrencyData() {
    return pageData;
}

chrome.storage.sync.get(['isEnabled', 'selectedCrypto'], async (result) => {
    if (result.isEnabled === false) {
        
        console.log('Extension is disabled, stopping conversion'); 
        return;
    }

    await fetchCryptoRates(); // Get initial rates
    setInterval(fetchCryptoRates, 60000); // Update rates every minute
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("DOM Content Loaded - starting replacement");
            replaceText(document.body);
            startObserver();
        });
    } else {
        console.log("Document already loaded - starting replacement");
        replaceText(document.body);
        startObserver();
    }
});

function startObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                replaceText(node);
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}