document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('extensionToggle');
    const cryptoSelect = document.getElementById('cryptoSelect');
    console.log('Popup opened');
    
    // Check if chrome.storage API is available
    if (!chrome.storage || !chrome.storage.sync) {
        console.error('Chrome storage API not available');
        return;
    }
    
    // Load initial state
    chrome.storage.sync.get(['isEnabled'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error loading state:', chrome.runtime.lastError);
            return;
        }
        console.log('Initial storage state:', result.isEnabled);
        toggle.checked = result.isEnabled ?? true;
        console.log('Toggle state set to:', toggle.checked);

        // Set crypto selection (default to ethereum)
        chrome.storage.sync.get(['isEnabled', 'selectedCrypto'], (result) => {
            toggle.checked = result.isEnabled ?? true;
            cryptoSelect.value = result.selectedCrypto || 'ETH'; // Default to ETH
        });
    });
    
    // Handle toggle changes
    toggle.addEventListener('change', (e) => {
        const newState = e.target.checked;
        chrome.storage.sync.set({ isEnabled: newState }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving state:', chrome.runtime.lastError);
                return;
            }
            console.log('State saved:', newState);
        });
    });

    // Handle crypto selection changes
    cryptoSelect.addEventListener('change', (e) => {
        const selectedCrypto = e.target.value;
        chrome.storage.sync.set({ 
          selectedCrypto: selectedCrypto 
        }, () => {
          console.log('Saved crypto:', selectedCrypto);
          // Refresh conversions
          chrome.runtime.sendMessage({ action: 'updateCrypto' });
        });
    });


});