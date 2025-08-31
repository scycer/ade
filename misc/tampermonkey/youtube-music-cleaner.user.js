// ==UserScript==
// @name         YouTube Music Cleaner
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Remove unwanted elements from YouTube Music
// @author       You
// @match        https://music.youtube.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Elements to hide - customize this list
    const selectorsToHide = [
        'ytmusic-nav-bar',                    // Top navigation bar
        'tp-yt-app-drawer',                    // Side drawer
        '.ytmusic-player-bar__left',           // Left side of player bar
        '.ytmusic-player-bar__right',          // Right side of player bar
        '.middle-controls .previous-button',   // Previous button
        '.middle-controls .next-button',       // Next button
        '.ytmusic-player-bar__center',         // Center controls
        '.volume-slider',                      // Volume slider
        '.time-info',                          // Time display
        '.player-minimize-button',             // Minimize button
        '.like-button-renderer',               // Like/dislike buttons
        '.ytmusic-menu-renderer',              // Menu buttons
        // Add more selectors here as needed
    ];

    function hideElements() {
        selectorsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
            });
        });
    }

    // Run immediately
    hideElements();

    // Run after page loads
    window.addEventListener('load', hideElements);

    // Run periodically for dynamic content
    setInterval(hideElements, 2000);

    // Watch for DOM changes
    const observer = new MutationObserver((mutations) => {
        hideElements();
    });

    // Start observing when body is available
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    console.log('YouTube Music Cleaner loaded!');
})();