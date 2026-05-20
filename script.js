/**
 * Timeframe Clock
 * カメラのタイムフレーム風デジタル時計
 */

(function () {
    'use strict';

    // --- DOM Elements ---
    const customTextEl = document.getElementById('custom-text');
    const timecodeEl = document.getElementById('timecode');
    const dateDisplayEl = document.getElementById('date-display');
    const clockDisplayEl = document.getElementById('clock-display');
    const bgImage = document.getElementById('bg-image');
    const container = document.getElementById('timeframe-container');

    // Settings
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsClose = document.getElementById('settings-close');
    const customTextInput = document.getElementById('custom-text-input');
    const uploadArea = document.getElementById('upload-area');
    const bgUpload = document.getElementById('bg-upload');
    const colorBtns = document.querySelectorAll('.color-btn');
    const styleBtns = document.querySelectorAll('.style-btn');
    const fullscreenToggle = document.getElementById('fullscreen-toggle');

    // --- Month Abbreviations ---
    const MONTHS = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];

    // --- Startup time for elapsed timecode ---
    const startTime = performance.now();

    // --- Pad number with leading zero ---
    function pad(n, digits = 2) {
        return String(n).padStart(digits, '0');
    }

    // --- Render string as tabular/monospace elements ---
    function renderMono(str, el) {
        el.innerHTML = str.split('').map(c => {
            const char = c === ' ' ? '&nbsp;' : c;
            return `<span class="tabular-char">${char}</span>`;
        }).join('');
    }

    // --- Update Clock ---
    function updateClock() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // --- Elapsed timecode (mm:ss:ff at 24fps) ---
        const elapsedMs = performance.now() - startTime;
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const elapsedMin = Math.floor(totalSeconds / 60) % 100;
        const elapsedSec = totalSeconds % 60;
        const elapsedFrame = Math.floor(((elapsedMs % 1000) / 1000) * 24);

        const timecodeStr = `${pad(elapsedMin)}:${pad(elapsedSec)}:${pad(elapsedFrame)}`;
        renderMono(timecodeStr, timecodeEl);

        // AM/PM Clock: A/PM h-mm-ss
        const isPM = hours >= 12;
        const ampm = isPM ? 'PM' : 'AM';
        let h12 = hours % 12;
        if (h12 === 0) h12 = 12;
        
        // Pad hour with space if single digit
        const paddedH12 = String(h12).padStart(2, ' ');
        const clockStr = `${ampm} ${paddedH12}-${pad(minutes)}-${pad(seconds)}`;
        renderMono(clockStr, clockDisplayEl);

        // Date: American abbreviated (e.g., MAY 03 2026)
        const month = MONTHS[now.getMonth()];
        const day = pad(now.getDate());
        const year = now.getFullYear();
        dateDisplayEl.textContent = `${month} ${day} ${year}`;
    }

    // --- Start high-precision update loop ---
    function startClockLoop() {
        updateClock();
        // Use requestAnimationFrame for smooth frame counter
        requestAnimationFrame(startClockLoop);
    }

    // --- Settings Panel ---
    settingsToggle.addEventListener('click', () => {
        settingsPanel.classList.toggle('open');
    });

    settingsClose.addEventListener('click', () => {
        settingsPanel.classList.remove('open');
    });

    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
            settingsPanel.classList.remove('open');
        }
    });

    // --- Custom Text ---
    customTextInput.addEventListener('input', (e) => {
        customTextEl.textContent = e.target.value || 'TIMEFRAME CLOCK';
    });

    // --- Image Upload ---
    function handleImageUpload(file) {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            bgImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    uploadArea.addEventListener('click', () => {
        bgUpload.click();
    });

    bgUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });

    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    });

    // Also allow dropping on the main container
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    });

    // --- Color Presets ---
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = btn.dataset.color;
            document.documentElement.style.setProperty('--frame-color', color);
        });
    });

    // --- Style Presets ---
    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            styleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const style = btn.dataset.style;

            // Remove all style classes
            container.classList.remove('style-cinematic', 'style-minimal', 'style-broadcast');

            // Apply selected (cinematic is default/no extra class)
            if (style !== 'cinematic') {
                container.classList.add(`style-${style}`);
            }
        });
    });

    // --- Font Size Sliders ---
    const fontSizeConfig = [
        { sliderId: 'fs-tl', valId: 'fs-tl-val', targetEl: customTextEl },
        { sliderId: 'fs-tr', valId: 'fs-tr-val', targetEl: timecodeEl },
        { sliderId: 'fs-bl', valId: 'fs-bl-val', targetEl: dateDisplayEl },
        { sliderId: 'fs-br', valId: 'fs-br-val', targetEl: clockDisplayEl },
    ];

    fontSizeConfig.forEach(({ sliderId, valId, targetEl }) => {
        const slider = document.getElementById(sliderId);
        const valDisplay = document.getElementById(valId);
        if (!slider || !valDisplay || !targetEl) return;

        slider.addEventListener('input', () => {
            const size = slider.value;
            targetEl.style.fontSize = size + 'px';
            valDisplay.textContent = size + 'px';
        });
    });

    // --- Fullscreen ---
    fullscreenToggle.addEventListener('change', () => {
        if (fullscreenToggle.checked) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } else {
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    document.addEventListener('fullscreenchange', () => {
        fullscreenToggle.checked = !!document.fullscreenElement;
    });

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', (e) => {
        // ESC: Close settings
        if (e.key === 'Escape') {
            settingsPanel.classList.remove('open');
        }
        // F: Toggle fullscreen
        if (e.key === 'f' || e.key === 'F') {
            if (!settingsPanel.classList.contains('open')) {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
            }
        }
        // S: Toggle settings
        if (e.key === 's' || e.key === 'S') {
            if (document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                settingsPanel.classList.toggle('open');
            }
        }
    });

    // --- Initialize ---
    startClockLoop();

})();
