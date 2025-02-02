console.log("USD to Sheep conversion is running!");

// Object to store currency data for the page
let pageData = {
    currency: null, // 'USD', 'EUR', 'JPY', 'GBP', 'AED'
    values: []
};

function detectCurrency(text) {
    const patterns = {
        USD: /\$\s?\d+/,
        EUR: /€\s?\d+|EUR\s?\d+/,
        GBP: /£\s?\d+/,
        JPY: /¥\s?\d+|JPY\s?\d+/,
        AED: /AED\s?\d+/
    };

    for (let [currency, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
            return currency;
        }
    }
    return null;
}


function replaceText(node) {
    if (node.nodeType == 3) {

        const text = node.textContent;
        
        // Detect currency if not already set
        if (!pageData.currency) {
            pageData.currency = detectCurrency(text);
        }

        // Combined regex for all supported currencies
        const regex = /(?:\$|€|£|¥|AED)\s?\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|EUR|GBP|JPY|AED)/g;
        
        // Store values before replacing
        let match;
        while ((match = regex.exec(text)) !== null) {
            const numericValue = parseFloat(match[0].replace(/[^0-9.]/g, ''));
            pageData.values.push(numericValue);
        }

        node.textContent = text.replace(regex, "sheep");


    } else {

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

chrome.storage.sync.get(['isEnabled'], (result) => {
    if (result.isEnabled === false) {
        
        console.log('Extension is disabled, stopping conversion'); 
        return;
    }
    
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