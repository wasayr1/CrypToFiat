console.log("USD to Sheep converter is running!");

function replaceText(node) {
    if (node.nodeType == 3) {
        const regex = /\$\d+(?:,\d{3})*(?:\.\d{2})?/g;
        let text = node.textContent.replace(regex, "sheep");

        text = text.replace(/\b(USD|US\$|\$)\b/g, "");

        text = text.replace(/\s+/g, " ").trim();

        // Only update if we made changes
        if (text !== node.textContent) {
            node.textContent = text;
        }
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

// Better way to handle the timing
if (document.readyState === 'loading') {
    // If the document is still loading, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM Content Loaded - starting replacement");
        replaceText(document.body);
    });
} else {
    // If the document is already loaded, run immediately
    console.log("Document already loaded - starting replacement");
    replaceText(document.body);
}

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            replaceText(node);
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});