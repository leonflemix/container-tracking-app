// js/htmlLoader.js
// This module fetches HTML partials and injects them into the main page.

async function loadHTML(url, elementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        const text = await response.text();
        document.getElementById(elementId).innerHTML = text;
    } catch (error) {
        console.error(`Error loading partial: ${error}`);
        document.getElementById(elementId).innerHTML = `<p style="color: red; text-align: center;">Failed to load content.</p>`;
    }
}

export async function loadPartials() {
    await Promise.all([
        loadHTML('partials/_login.html', 'login-partial'),
        loadHTML('partials/_app_container.html', 'app-container-partial'),
        loadHTML('partials/_modals.html', 'modals-partial'),
    ]);
}
