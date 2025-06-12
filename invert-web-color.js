// ==UserScript==
// @name         Lightweight Invert Filter with UI Exclusion
// @namespace    https://github.com/lacdonlang/Invert-web-color
// @version      1.0
// @description  Invert colors with performance-friendly presets + optional UI exclusion (buttons, charts etc.)
// @author       Ethan Lang
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    const hostname = window.location.hostname;
    const siteListStr = GM_getValue('invert_sites_light', '');
    const siteList = siteListStr.split(',').map(s => s.trim()).filter(Boolean);
    const isEnabled = siteList.includes(hostname);

    const presetMap = GM_getValue('light_preset_map', {});
    const exclusionMap = GM_getValue('light_exclusion_map', {});

    let preset = presetMap[hostname] || 'natural';
    let excludeUI = exclusionMap[hostname] ?? true;

    const presets = {
        natural: { brightness: '1.05', contrast: '1.05', saturation: '0.9' },
        soft:    { brightness: '1.15', contrast: '0.95', saturation: '0.8' },
        vivid:   { brightness: '1.0',  contrast: '1.2',  saturation: '1.2' }
    };

    function applyFilter() {
        const styleTag = document.getElementById('light-invert-style') || (() => {
            const tag = document.createElement('style');
            tag.id = 'light-invert-style';
            document.head.appendChild(tag);
            return tag;
        })();

        const { brightness, contrast, saturation } = presets[preset];

        let excludedSelectors = `
            img, video, picture, canvas
        `;
        if (excludeUI) {
            excludedSelectors += `, button, .tab, .chart, svg, .no-invert`;
        }

        styleTag.innerHTML = `
            body {
                filter: invert(100%) hue-rotate(180deg)
                        brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) !important;
                background-color: #000 !important;
                will-change: filter;
            }
            ${excludedSelectors} {
                filter: invert(100%) hue-rotate(180deg) !important;
            }
        `;
    }

    function cyclePreset() {
        const order = ['natural', 'soft', 'vivid'];
        const currentIdx = order.indexOf(preset);
        preset = order[(currentIdx + 1) % order.length];
        presetMap[hostname] = preset;
        GM_setValue('light_preset_map', presetMap);
        applyFilter();
        alert(`Preset changed to: ${preset}`);
    }

    function toggleExclusion() {
        excludeUI = !excludeUI;
        exclusionMap[hostname] = excludeUI;
        GM_setValue('light_exclusion_map', exclusionMap);
        applyFilter();
        alert(`${excludeUI ? '✅ UI Exclusion Enabled' : '❌ UI Exclusion Disabled'}`);
    }

    if (!isEnabled) {
        GM_registerMenuCommand(`✅ Enable Inversion on This Site`, () => {
            siteList.push(hostname);
            GM_setValue('invert_sites_light', siteList.join(','));
            alert(`Inversion enabled on ${hostname}. Please refresh.`);
        });
    } else {
        GM_registerMenuCommand(`❌ Disable Inversion on This Site`, () => {
            const updated = siteList.filter(d => d !== hostname);
            GM_setValue('invert_sites_light', updated.join(','));
            alert(`Inversion disabled on ${hostname}. Please refresh.`);
        });

        GM_registerMenuCommand(`🎨 Cycle Style Preset (Now: ${preset})`, cyclePreset);
        GM_registerMenuCommand(`🖱️ Toggle UI Exclusion (Now: ${excludeUI ? 'On' : 'Off'})`, toggleExclusion);

        applyFilter();
    }
})();