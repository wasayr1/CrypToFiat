console.log("USD to Sheep converter is running!");

function replaceText(node) {
    if (node.nodeType == 3) {

        const regex = /\$\s?\d+(?:,\d{3})*(?:\.\d{2})?(?:\s?USD)?/g;
        node.textContent = node.textContent.replace(regex, "sheep");

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