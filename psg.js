(async function() {
    'use strict';

    if (window.BMW_RUNNING) return;
    window.BMW_RUNNING = true;

    // ============================================================
    // 0. LOGIN CREDENTIALS, BOOKING & PASSENGER DETAILS
    // ============================================================
    const LOGIN_CREDENTIALS = {
        username: "Babu123s",
        password: "g6gf77TN4tA54k#"
    };

    // YAHAN APNE KAM SE KAM 3 PASSENGERS KI DETAILS DAALEIN
    const PASSENGER_DETAILS =[
        { name: "GUDDU KUMAR", age: "25", gender: "M" }
    ];

    const BOOKING_DETAILS = {
        fromStation: "KQR ",      
        toStation: "LDH ",        
        date: "20/04/2026",      
        trainNumber: "13307",   
        classCode: "SL",        
        quota: "GENERAL",
        ACTime: "10:00:00",
        SLTime: "11:00:00",
        GNTime: "08:00:00"
    };
    // ============================================================

    const originalError = console.error;
    console.error = function(...args) {
        if (args && args[0] && typeof args[0] === 'string') {
            if (args[0].includes('Content Security Policy') || 
                args[0].includes('font') || 
                args[0].includes('Report Only')) {
                return; 
            }
        }
        originalError.apply(console, args);
    };

    let SPEED_MULTIPLIER = 1;

    // State Trackers
    window.trainBooked = false;
    window.captchaSolved = false;
    window.loginExecuted = false;
    window.passengerFilled = false; 
    window.paymentExecuted = false; 
    window.journeyDetailsFilled = false; 
    window.cachedTrueCaptchaConfig = null; // Added cache state for truecaptcha speedup

    // ============================================================
    // 1. ADVANCED STEALTH ENGINES & HELPER FUNCTIONS
    // ============================================================
    function log(msg) { console.log(`[BOT-PRO] ${msg}`); }
    
    function updateReqStatus(msg, mode = "BOT") {
        log(`STATUS UPDATE: ${msg}`);
        const statusEl = document.getElementById('bmw-current-status');
        if (statusEl) statusEl.innerText = msg;

        const modeEl = document.getElementById('bmw-bot-mode');
        if (modeEl) {
            modeEl.innerText = mode;
            modeEl.style.color = mode === "BOT" ? "#00ff00" : "#ff9800";
            modeEl.style.textShadow = mode === "BOT" ? "0px 0px 8px #00ff00" : "0px 0px 8px #ff9800";
        }
    }

    // --- STEP 1: GAUSSIAN DELAY SYSTEM (Bell Curve) ---
    function gaussianRandom(mean, stdev) {
        let u = 1 - Math.random(); 
        let v = Math.random();
        let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        let delay = Math.abs(Math.floor(mean + z * stdev));
        return Math.max(delay, 10); // Kam se kam 10ms toh ho
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const realTimeSleep = (ms) => new Promise(r => setTimeout(r, ms));
    const humanSleep = async (mean, stdev) => await sleep(gaussianRandom(mean, stdev));

    async function waitFor(selector, timeout = 30000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);
            if (el && el.offsetParent !== null) return el;
            await sleep(200);
        }
        return null;
    }

    async function waitForSpinner() {
        const loaderSelectors =['div.ngx-spinner-overlay', 'div.loading-backdrop', '#loaderP'];
        let isLoading = true;
        let checkCount = 0;
        while (isLoading && checkCount < 300) { 
            isLoading = false;
            for (const sel of loaderSelectors) {
                const el = document.querySelector(sel);
                if (el && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden' && window.getComputedStyle(el).opacity !== '0') {
                    isLoading = true;
                    break;
                }
            }
            if (isLoading) await sleep(100);
            checkCount++;
        }
    }

    async function waitForIrctcLoader() {
        const loaderSelectors =['div.ngx-spinner-overlay', 'div.loading-backdrop', '#loaderP'];
        let waitTime = 0;
        const maxWait = 15000; 

        while (waitTime < maxWait) {
            let isLoaderVisible = false;
            for (const selector of loaderSelectors) {
                const loader = document.querySelector(selector);
                if (loader && window.getComputedStyle(loader).display !== 'none' && window.getComputedStyle(loader).visibility !== 'hidden') {
                    isLoaderVisible = true;
                    break;
                }
            }
            if (!isLoaderVisible) {
                await sleep(300); 
                return;
            }
            await sleep(200); 
            waitTime += 200;
        }
    }

    // --- STEP 4: MOUSE MOVEMENT & SCROLLING ---
    async function simulateMouseMove(startX, startY, endX, endY) {
        const steps = gaussianRandom(8, 2); // 6 se 10 steps me mouse move hoga
        for(let i=1; i<=steps; i++) {
            const x = startX + (endX - startX) * (i / steps) + (Math.random() * 6 - 3);
            const y = startY + (endY - startY) * (i / steps) + (Math.random() * 6 - 3);
            document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
            await sleep(gaussianRandom(15, 5));
        }
    }

    async function naturalScroll() {
        await humanSleep(150, 30);
        window.scrollBy({ top: gaussianRandom(150, 40), behavior: 'smooth' });
        await humanSleep(300, 50);
        window.scrollBy({ top: -gaussianRandom(50, 20), behavior: 'smooth' }); 
    }

    // --- STEP 2: FULL EVENT LIFECYCLE (PRO HUMAN CLICK) ---
    async function humanClick(el) {
        if (!el) return;
        
        // Visual Search Time (Element dhoondhne aur dekhne me time lagta hai)
        await humanSleep(250, 60);

        try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch(e){}
        await humanSleep(150, 40);

        // Get coordinates for mouse movement
        const rect = el.getBoundingClientRect();
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;

        // Mouse ko button tak le jana
        await simulateMouseMove(targetX - 40, targetY - 40, targetX, targetY);

        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: targetX, clientY: targetY }));
        await humanSleep(20, 5);
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: targetX, clientY: targetY }));
        await humanSleep(30, 10);
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, buttons: 1, clientX: targetX, clientY: targetY }));
        
        // Button dabane aur chhodne ke beech ka waqt
        await humanSleep(50, 15); 
        
        el.dispatchEvent(new Event('focus', { bubbles: true }));
        await humanSleep(20, 5);
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: targetX, clientY: targetY }));
        await humanSleep(15, 5);
        
        el.click(); // Final trigger
        
        // Click karne ke baad ka natural pause
        await humanSleep(200, 50);
    }

    // --- STEP 3: KEYBOARD DYNAMICS (Human Typing + Typos) ---
    async function humanType(element, value, triggerBlur = true) {
        if (!element) return;
        
        await humanClick(element); 
        
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(element, '');
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        for (let i = 0; i < value.length; i++) {
            let char = value[i];
            
            // Pro Tip: Typo (Mistake) & Correction Logic
            // Insaan se speed me galti hoti hai, 4% chance of making a typo to confuse anti-bot
            if (value.length > 3 && Math.random() < 0.04 && /[a-zA-Z]/.test(char)) {
                let typoChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1)); 
                nativeSetter.call(element, element.value + typoChar);
                element.dispatchEvent(new KeyboardEvent('keydown', { key: typoChar, bubbles: true }));
                element.dispatchEvent(new KeyboardEvent('keypress', { key: typoChar, bubbles: true }));
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new KeyboardEvent('keyup', { key: typoChar, bubbles: true }));
                
                await humanSleep(250, 50); // Oops, galti ho gayi (realization time)
                
                // Backspace se mitana
                nativeSetter.call(element, element.value.slice(0, -1));
                element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, keyCode: 8 }));
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', bubbles: true, keyCode: 8 }));
                
                await humanSleep(200, 40); // Sahi letter soch kar likhna
            }

            // Actual Correct Character typing
            nativeSetter.call(element, element.value + char);
            element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
            
            // Random Gaussian Typing Speed between keystrokes
            await humanSleep(120, 35); 
        }
        
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        if (triggerBlur) {
            await humanSleep(100, 30);
            element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
        }
    }

    function getElementByXPath(xpath) {
        try { return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; } 
        catch (e) { return null; }
    }

    function startAntiIdle() {
        setInterval(async () => {
            const x = Math.floor(Math.random() * window.innerWidth);
            const y = Math.floor(Math.random() * window.innerHeight);
            const currentX = window.innerWidth / 2;
            const currentY = window.innerHeight / 2;
            await simulateMouseMove(currentX, currentY, x, y);
        }, gaussianRandom(2500, 500));
    }
    startAntiIdle(); 

    // ============================================================
    // RECORDER LOGIN REPLAY
    // ============================================================
    async function executeRecorderLogin() {
        if (window.loginExecuted) return;
        const { username, password } = LOGIN_CREDENTIALS;
        if (!username || !password) return;

        await naturalScroll(); // Thoda scroll shuru mein

        const hamburger = document.querySelector('div.moblogo > a > i');
        if (hamburger && !document.querySelector('app-login')) {
            await humanClick(hamburger);
            await humanSleep(800, 100);
        }

        const slideLoginBtn = document.querySelector('div.header-fix button');
        const topLoginBtn = document.querySelector('a.search_btn.loginText'); 
        
        if (!document.querySelector('app-login')) {
            if (slideLoginBtn && window.getComputedStyle(slideLoginBtn).display !== 'none') {
                await humanClick(slideLoginBtn);
            } else if (topLoginBtn) {
                await humanClick(topLoginBtn);
            }
        }

        const loginModal = await waitFor('app-login', 5000);
        if (!loginModal) return;
        await humanSleep(1500, 200); 

        const userField = document.querySelector('input[aria-label="User Name"]') || document.querySelector('input[formcontrolname="userid"]');
        if (userField && !userField.value) {
            await humanType(userField, username, true);
            await humanSleep(500, 100);
        }

        const passField = document.querySelector('input[aria-label="Password"]') || document.querySelector('input[formcontrolname="password"]');
        if (passField && !passField.value) {
            await humanType(passField, password, true);
            await humanSleep(500, 100);
        }

        const captchaInput = document.querySelector('app-login #captcha');
        const captchaImg = document.querySelector('app-login .captcha-img');
        
        if (captchaImg && captchaInput) {
            let retries = 0;
            // Delay for checking captcha image fixed (20ms instead of 200ms) to send to TrueCaptcha instantly
            while (retries < 100 && captchaImg.src.length < 100) {
                await sleep(20);
                retries++;
            }
            await solveTrueCaptcha(captchaImg, captchaInput);
            await humanSleep(1000, 150); 
        } else {
            await humanSleep(1000, 150);
        }

        const signInBtn = document.querySelector('app-login button[type="submit"]') || Array.from(document.querySelectorAll('app-login button')).find(b => b.innerText && b.innerText.includes('SIGN IN'));
        if (signInBtn) {
            await humanClick(signInBtn);
            await humanSleep(2000, 200); 
        }

        window.loginExecuted = true;
    }

    // ============================================================
    // STRICT JSON REPLAY: JOURNEY DETAILS PHASE
    // ============================================================
    async function executeJourneyDetailsPhase() {
        if (window.journeyDetailsFilled) return;
        
        const originInput = await waitFor('form > div:nth-of-type(2) > div:nth-of-type(1) input', 15000) || await waitFor('#origin input', 5000);
        if (!originInput) return;

        await humanSleep(1000, 150);

        const allPrimaryBtns = document.querySelectorAll('button.btn.btn-primary');
        for (const btn of allPrimaryBtns) {
            if (btn.innerText.trim().toUpperCase() === "CLOSE" || (btn.getAttribute('aria-label') && btn.getAttribute('aria-label').includes('Last Transaction Detail'))) {
                await humanClick(btn);
                await humanSleep(500, 100); 
                break;
            }
        }
        await waitForSpinner();

        try {
            let minimizeIcon = document.querySelector('#minimiseIconx') || getElementByXPath('//*[@id="minimiseIconx"]');
            if (minimizeIcon && minimizeIcon.offsetParent !== null) {
                await humanClick(minimizeIcon);
                await humanSleep(300, 50);
            }
        } catch(e) {}

        let fromEl = document.querySelector('form > div:nth-of-type(2) > div:nth-of-type(1) input') || document.querySelector('#origin input');
        if (fromEl) {
            await humanType(fromEl, BOOKING_DETAILS.fromStation, false); // Type WITHOUT Blur
            await humanSleep(1500, 200); 
        }

        let fromOpt = await waitFor('#p-highlighted-option > span', 5000);
        if (fromOpt) {
            await humanClick(fromOpt);
            await humanSleep(600, 100);
        }

        let toEl = document.querySelector('#divMain div:nth-of-type(2) > div:nth-of-type(2) input') || document.querySelector('#destination input');
        if (toEl) {
            await humanType(toEl, BOOKING_DETAILS.toStation, false); // Type WITHOUT Blur
            await humanSleep(1500, 200); 
        }

        let toOpt = await waitFor('#p-highlighted-option > span', 5000);
        if (toOpt) {
            await humanClick(toOpt);
            await humanSleep(600, 100);
        }

        let dateEl = document.querySelector('div:nth-of-type(3) > div:nth-of-type(1) input') || document.querySelector('#jDate input');
        if (dateEl) {
            await humanClick(dateEl); 
            await humanSleep(800, 150);
        }

        const calendarTable = await waitFor('table.ui-datepicker-calendar', 3000);
        if (calendarTable) {
            const [tDay, tMonth, tYear] = BOOKING_DETAILS.date.split('/');
            const monthNames =["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const targetMonthName = monthNames[parseInt(tMonth, 10) - 1];

            let maxClicks = 12;
            while (maxClicks > 0) {
                const titleEl = document.querySelector('.ui-datepicker-title');
                if (!titleEl) break;
                
                if (titleEl.innerText.includes(targetMonthName) && titleEl.innerText.includes(tYear)) {
                    break;
                }
                
                let nextBtn = document.querySelector('a.ui-datepicker-next > span') || document.querySelector('.ui-datepicker-next');
                if (nextBtn) { 
                    await humanClick(nextBtn); 
                    await humanSleep(400, 80); 
                } else {
                    break;
                }
                maxClicks--;
            }

            const days = document.querySelectorAll('p-calendar .ui-datepicker-calendar a');
            for (const day of days) {
                if (day.innerText.trim() === parseInt(tDay, 10).toString()) {
                    await humanClick(day);
                    await humanSleep(500, 100);
                    break;
                }
            }
        }

        let quotaDrop = document.querySelector('#journeyQuota > div');
        if (quotaDrop) {
            await humanClick(quotaDrop);
            await humanSleep(800, 150);
            
            let quotaItems = document.querySelectorAll('p-dropdownitem li span, ul.ui-dropdown-items li span');
            for (let item of quotaItems) {
                if (item.innerText.trim().toUpperCase() === BOOKING_DETAILS.quota.toUpperCase()) {
                    await humanClick(item);
                    await humanSleep(500, 100);
                    break;
                }
            }
        }

        let searchBtn = document.querySelector('div.tbis-box > div:nth-of-type(1) button') || document.querySelector('button.search_btn.train_Search');
        if (searchBtn) {
            await humanClick(searchBtn);
            await humanSleep(1000, 200);
            await waitForSpinner();
            window.journeyDetailsFilled = true; 
        }
    }

    // ============================================================
    // 2. UI CREATION 
    // ============================================================
    function initBMWUI() {
        if (document.getElementById('bmw-status-container')) return;
        const target = document.body || document.documentElement;
        if (!target) return;

        const container = document.createElement('div');
        container.id = 'bmw-status-container';
        container.innerHTML = `
<div id="bmw-overlay-container" style="position: fixed; top: 15px; right: 15px; z-index: 9999998; background: rgba(0, 0, 0, 0.9); padding: 8px 10px; border-radius: 5px; font-family: 'Courier New', Courier, monospace; border: 3px solid #ff007f; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0px 0px 15px rgba(255, 0, 127, 0.4); backdrop-filter: blur(5px);">
    <div id="bmw-bot-mode" style="font-size: 12px; font-weight: bold; color: #fff; letter-spacing: 1px;">KTM</div>
    ||
    <div id="bmw-current-status" style="font-size: 12px; color: #fff;">RED STAR PRO</div>
    ||
    <div id="bmw-countdown-time" style="font-size: 12px; font-weight: bold; color: #fff;">EDISON</div>
</div>`;
        target.appendChild(container);
    }

    async function smartWaitWithDisplay(targetTimeStr, mainTitle) {
        if (!targetTimeStr) return;
        const[tHour, tMin, tSec] = targetTimeStr.split(':').map(Number);
        const now = new Date();
        const targetDate = new Date();
        targetDate.setHours(tHour, tMin, tSec || 0, 0);

        if (now > targetDate) return;

        const countdownBox = document.getElementById('bmw-countdown-box');
        const countdownTitle = document.getElementById('bmw-countdown-title');
        const countdownTime = document.getElementById('bmw-countdown-time');

        if (countdownBox && countdownTitle) {
            countdownBox.style.display = 'block';
            countdownTitle.innerText = `${targetTimeStr}`;
        }

        while (true) {
            const current = new Date();
            const diff = targetDate - current;
            if (diff <= 0) {
                if (countdownBox) countdownBox.style.display = 'none';
                break;
            }

            if (countdownTime) {
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                const hStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
                countdownTime.innerText = `${hStr}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            await new Promise(r => setTimeout(r, 200)); 
        }
    }

    async function solveTrueCaptcha(imgElement, inputElement) {
        try {
            let config = { userid: "truecaptchalover", apikey: "ocGi50BzCfYwabQMsrUg" };

            // Fetch slow ho raha tha, isliye isko Cache system me daal diya to instantly bhej sake
            if (window.cachedTrueCaptchaConfig) {
                config = window.cachedTrueCaptchaConfig;
            } else {
                try {
                    const configResp = await fetch('https://raw.githubusercontent.com/SHANKARPDJ/EXESOFTWARE/refs/heads/main/trueconfig.json');
                    if (configResp.ok) {
                        const json = await configResp.json();
                        if (json.truecaptcha) {
                            config = json.truecaptcha;
                            window.cachedTrueCaptchaConfig = config;
                        }
                    }
                } catch (err) { }
            }

            const base64Data = imgElement.src.split(',')[1];
            if (!base64Data) return false;

            const response = await fetch("https://api.apitruecaptcha.org/one/gettext", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    'client': "chrome extension", 'location': 'https://www.irctc.co.in/nget/train-search', 'version': "0.3.8",
                    'case': "mixed", 'promise': "true", 'extension': true,
                    'userid': config.userid, 'apikey': config.apikey, 'data': base64Data
                })
            });

            if (!response.ok) return false;
            const data = await response.json();
            let resultText = data.result;

            if (resultText) {
                resultText = resultText.replace(/\s+/g, '').replace(')', 'J').replace(']', 'J');
                // CAPTCHA Typing
                await humanType(inputElement, resultText, true);
                await humanSleep(500, 100);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    // ============================================================
    // 3. PHASE EXECUTORS
    // ============================================================
    
    // Train List phase
    async function executeTrainListPhase() {
        const { trainNumber, classCode, quota, ACTime, SLTime, GNTime } = BOOKING_DETAILS;
        
        const trainListContainer = await waitFor('app-train-avl-enq', 5000);
        if (!trainListContainer) return;
        
        await waitForIrctcLoader(); 

        const trainBlocks = document.querySelectorAll('div.ng-star-inserted app-train-avl-enq');
        let foundTrainBlock = null;
        for (const block of trainBlocks) {
            const heading = block.querySelector('.train-heading');
            if (heading && heading.innerText.includes(trainNumber)) {
                foundTrainBlock = block;
                block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }
        }

        if (!foundTrainBlock) return; 

        const now = new Date();
        const currentHour = now.getHours();

        if (quota.toUpperCase() === "GENERAL" && GNTime) {
            const[gHour, gMin] = GNTime.split(':').map(Number);
            if (currentHour >= 5 && (currentHour < gHour || (currentHour === gHour && now.getMinutes() < gMin))) {
                await smartWaitWithDisplay(GNTime, "GENERAL BOOKING");
            }
        }

        if (quota.toUpperCase().includes("TATKAL")) {
            const acClasses =["1A", "2A", "3A", "3E", "CC", "EC", "EA"];
            const isAC = acClasses.includes(classCode.toUpperCase());
            const targetTimeStr = isAC ? ACTime : SLTime;
            
            const[tHour, tMin] = targetTimeStr.split(':').map(Number);
            if (currentHour < tHour || (currentHour === tHour && now.getMinutes() < tMin)) {
                await smartWaitWithDisplay(targetTimeStr, `TATKAL : ${isAC ? 'AC' : 'NON-AC'}`);
            }
        }
        
        let booked = false;

        const initialBoxes = foundTrainBlock.querySelectorAll('div.pre-avl');
        for (const box of initialBoxes) {
            if (box.innerText.toUpperCase().includes(`(${classCode.toUpperCase()})`) && box.innerText.toUpperCase().includes("REFRESH")) {
                await humanClick(box);
                await waitForIrctcLoader(); 
                break;
            }
        }

        const firstActiveBoxes = foundTrainBlock.querySelectorAll('div.pre-avl');
        for (const box of firstActiveBoxes) {
            const text = box.innerText.toUpperCase();
            if (text.includes("YEARS") || text.includes(`(${classCode.toUpperCase()})`)) continue;
            if (text.includes("AVAILABLE") || text.includes("WL") || text.includes("RAC") || text.includes("CURR_AVL")) {
                await humanClick(box);
                await waitForIrctcLoader(); 
                break; 
            }
        }

        const firstBookBtn = foundTrainBlock.querySelector('button.btnDefault.train_Search');
        if (firstBookBtn && !firstBookBtn.disabled && !firstBookBtn.classList.contains('disable-book')) {
            if (firstBookBtn.innerText.toUpperCase().includes('BOOK NOW')) {
                await humanClick(firstBookBtn);
                await waitForIrctcLoader(); 
                const confirmationBtn = document.querySelector('.ui-confirmdialog-acceptbutton');
                if (confirmationBtn) await humanClick(confirmationBtn);
                
                await waitForIrctcLoader(); 
                if (document.querySelector('app-passenger-input') || window.location.href.includes('passenger')) {
                    booked = true;
                }
            }
        }

        if (!booked) {
            let retryCount = 0;
            while (retryCount < 250 && !booked && window.location.href.includes('train-list')) {
                retryCount++;
                const activeBoxes = foundTrainBlock.querySelectorAll('div.pre-avl');
                for (const box of activeBoxes) {
                    const text = box.innerText.toUpperCase();
                    if (text.includes("YEARS") || text.includes(`(${classCode.toUpperCase()})`)) continue;
                    if (text.includes("REFRESH") || text.includes("AVAILABLE") || text.includes("WL") || text.includes("RAC") || text.includes("CURR_AVL")) {
                        await humanClick(box);
                        await waitForIrctcLoader(); 
                        break; 
                    }
                }

                const bookBtn = foundTrainBlock.querySelector('button.btnDefault.train_Search');
                if (bookBtn && !bookBtn.disabled && !bookBtn.classList.contains('disable-book')) {
                    if (bookBtn.innerText.toUpperCase().includes('BOOK NOW')) {
                        await humanClick(bookBtn);
                        await waitForIrctcLoader(); 
                        const confirmationBtn = document.querySelector('.ui-confirmdialog-acceptbutton');
                        if (confirmationBtn) await humanClick(confirmationBtn);
                        
                        await waitForIrctcLoader(); 
                        if (document.querySelector('app-passenger-input') || window.location.href.includes('passenger')) {
                            booked = true;
                            break; 
                        }
                    }
                }
                if (!booked) await realTimeSleep(800); 
            }
        }

        if(booked) {
            window.trainBooked = true;
        }
    }

    // ============================================================
    // RECORDER-REPLAY: PASSENGER FILLING PHASE (SUPER HUMANIZED)
    // ============================================================
    async function executePassengerPhase() {
        if (window.passengerFilled) return;
        
        await waitFor('app-passenger', 5000);
        await humanSleep(1500, 300); // UI load hone ka lamba intezar jaisa aapne kaha

        for (let i = 0; i < PASSENGER_DETAILS.length; i++) {
            const p = PASSENGER_DETAILS[i];

            if (i > 0) {
                const addBtn = getElementByXPath('//*[contains(text(), "+ Add Passenger")]') 
                               || document.querySelector('div.col-lg-9 > div:nth-of-type(6) div:nth-of-type(2) > div.pull-left span:nth-of-type(1)');
                if (addBtn) {
                    // Thoda sochne ka waqt aur scroll
                    await humanSleep(500, 100);
                    window.scrollBy({ top: gaussianRandom(100, 20), behavior: 'smooth' });
                    await humanClick(addBtn);
                    await humanSleep(800, 150);
                }
            }

            const blocks = document.querySelectorAll('app-passenger');
            if (i >= blocks.length) continue;
            const block = blocks[i];

            // Thoda screen padhne ka samay
            await humanSleep(400, 100); 

            // 1. Name Input 
            const nameInput = block.querySelector('span > div.col-xs-12 input');
            if (nameInput) {
                await humanType(nameInput, p.name, true); 
                await humanSleep(500, 150); // Ruk ruk kar bharna
            }

            // 2. Age Input 
            const ageInput = block.querySelector('div.col-sm-1 > input');
            if (ageInput) {
                await humanType(ageInput, p.age, true); 
                await humanSleep(400, 100);
            }

            // 3. Gender Dropdown 
            const genderSelect = block.querySelector('div.col-sm-2 > select');
            if (genderSelect) {
                await humanClick(genderSelect); 
                await humanSleep(300, 80);
                genderSelect.value = p.gender; 
                genderSelect.dispatchEvent(new Event('change', { bubbles: true }));
                genderSelect.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
                await humanSleep(600, 150); // Agle passenger/field se pehle pause
            }
        }

        // 4. Tick "Book only if confirm berths are allotted" 
        try {
            await humanSleep(600, 200); // Padha aur scroll kiya
            window.scrollBy({ top: gaussianRandom(200, 50), behavior: 'smooth' });
            await humanSleep(400, 100);

            const confirmLabel = getElementByXPath('//label[contains(text(), "Book only if")]') 
                                 || document.querySelector('span div:nth-of-type(2) > label');
            if (confirmLabel) {
                await humanClick(confirmLabel);
                await humanSleep(700, 150);
            }
        } catch (e) {}

        // 5. Select Payment Mode (BHIM/UPI)
        try {
            const upiRadio = getElementByXPath('//*[@id="2"]/div/div[2]') 
                             || document.querySelector('tr:nth-of-type(2) div.ui-radiobutton-box');
            if (upiRadio) {
                await humanClick(upiRadio);
                await humanSleep(800, 200);
            } 
        } catch (e) {}

        // 15 SECOND KA BEKAR WAIT HATA DIYA GAYA HAI. 
        // Ab typing aur selection mein waqt laga hai jo human proof hai.
        await humanSleep(600, 100); // Final check pause before continue

        // 6. Click Continue Button
        const continueBtn = getElementByXPath('//*[@id="psgn-form"]/form/div/div[1]/p-sidebar/div/div/div[2]/button') 
                            || document.querySelector('div.pull-right > button');
                            
        if (continueBtn) {
            await humanClick(continueBtn);
        }

        window.passengerFilled = true;
    }

    // Payment / Review phase
    async function executeReviewPhase() {
        await waitForSpinner();
        
        let localCaptchaSolved = false;
        let lastCaptchaSrc = "";

        while (!localCaptchaSolved && window.location.href.includes('reviewBooking')) {
            if (document.querySelector('.bank-type') || window.location.href.includes('payment')) {
                localCaptchaSolved = true;
                break;
            }

            const captchaInput = document.querySelector('#captcha');
            const captchaImg = document.querySelector('.captcha-img');

            if (captchaInput && captchaImg) {
                captchaInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                let retries = 0;
                // Delay for checking captcha image fixed (20ms instead of 200ms) to speed up sending
                while (retries < 100 && captchaImg.src.length < 100) {
                    await sleep(20);
                    retries++;
                }

                if (lastCaptchaSrc && captchaImg.src === lastCaptchaSrc) {
                    await sleep(500);
                    continue; 
                }
                lastCaptchaSrc = captchaImg.src;

                const solved = await solveTrueCaptcha(captchaImg, captchaInput);

                if (solved) {
                    const finalBtn = document.querySelector('.btnDefault.train_Search');
                    if (finalBtn) {
                        await humanSleep(400, 100); 
                        await humanClick(finalBtn);
                        
                        let checkTimer = 0;
                        let errorFound = false;

                        while (checkTimer < 4000) {
                            const errorToast = document.querySelector('.ui-toast-detail');
                            if (errorToast && errorToast.innerText.toLowerCase().includes('invalid captcha')) {
                                errorFound = true;
                                break; 
                            }
                            if (document.querySelector('.bank-type') || window.location.href.includes('payment')) {
                                localCaptchaSolved = true;
                                break;
                            }
                            await sleep(200);
                            checkTimer += 200;
                        }

                        if (localCaptchaSolved) break;
                        if (errorFound) {
                            await humanType(captchaInput, '', true);
                            await humanSleep(1000, 200);
                            continue;
                        }
                    } else {
                        await humanSleep(1000, 200);
                    }
                } else {
                    await humanSleep(1000, 200);
                }
            } else {
                await humanSleep(1000, 200);
            }
        }

        if(localCaptchaSolved) {
            window.captchaSolved = true;
        }
    }

    // ============================================================
    // RECORDER-REPLAY: PAYMENT GATEWAY SELECTION PHASE
    // ============================================================
    async function executePaymentPhase() {
        if (window.paymentExecuted) return;
        
        await waitFor('app-payment', 5000);
        await humanSleep(1500, 300); 

        function getByXpath(xpath) {
            try { return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; } 
            catch (e) { return null; }
        }

        const step1Xpath = '//*[@id="pay-type"]/span/div[3]/span';
        let step1El = getByXpath(step1Xpath) || 
                      Array.from(document.querySelectorAll('div.col-sm-9 div > span')).find(el => el.innerText.includes('BHIM/ UPI/ USSD')) ||
                      Array.from(document.querySelectorAll('span')).find(el => el.innerText.trim() === 'BHIM/ UPI/ USSD');
        if (step1El) {
            await humanClick(step1El);
            await humanSleep(800, 150); 
        }

        const step2Xpath = '//*[@id="psgn-form"]/div[1]/div[1]/app-payment/div[1]/div/form/p-sidebar[2]/div/div/div[2]/button';
        let step2El = getByXpath(step2Xpath) || Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Continue');
        if (step2El && window.getComputedStyle(step2El).display !== 'none') {
            await humanClick(step2El);
            await humanSleep(800, 150);
        }

        // --- NEW STEP 3: DYNAMIC PAYTM SELECTION ---
        let step3El = null;
        const allBankTexts = document.querySelectorAll('.bank-text span');
        for (let i = 0; i < allBankTexts.length; i++) {
            if (allBankTexts[i].innerText.toUpperCase().includes('PAYTM')) {
                // Paytm mil gaya kisi bhi line mein, uska parent clickable box le lega
                step3El = allBankTexts[i].closest('.border-all') || allBankTexts[i].closest('div[tabindex="0"]') || allBankTexts[i];
                break;
            }
        }
        
        // Agar galti se PAYTM option load nahi hua, toh original fallback code chalega
        if (!step3El) {
            const step3Xpath = '//*[@id="bank-type"]/div/table/tr/span[2]/td/div/div';
            step3El = getByXpath(step3Xpath) || document.querySelector('#bank-type span:nth-of-type(2) div > div') ||
                          (document.querySelectorAll('#bank-type span')[2] ? document.querySelectorAll('#bank-type span')[2].querySelector('div') : null);
        }

        if (step3El) {
            await humanClick(step3El);
            await humanSleep(800, 150);
        }
        
        const step4Xpath = '//*[@id="psgn-form"]/div[1]/div[1]/app-payment/div[1]/div/form/p-sidebar[1]/div/div/div[2]/div[2]/button';
        let step4El = getByXpath(step4Xpath) || Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes('Pay & Book'));
        if (step4El) {
            await humanClick(step4El);
            window.paymentExecuted = true;
            await humanSleep(1000, 200);
        }
    }

    // ============================================================
    // 4. MAIN ORCHESTRATOR LOOP (SPA Router)
    // ============================================================
    async function mainLoop() {
        initBMWUI();

        while (true) {
            const url = window.location.href;
            
            if (url.includes('train-search') || url === 'https://www.irctc.co.in/nget/') {
                const loginLink = document.querySelector('a.search_btn.loginText');
                const isLoginLinkVisible = loginLink && window.getComputedStyle(loginLink).display !== 'none';
                const isLoginModalOpen = document.querySelector('app-login') !== null;
                
                if (isLoginLinkVisible || isLoginModalOpen) {
                    if (!window.loginExecuted || isLoginModalOpen) {
                        await executeRecorderLogin();
                    }
                } else {
                    if (!window.journeyDetailsFilled) {
                        await executeJourneyDetailsPhase();
                    } else {
                        window.trainBooked = false; 
                        window.captchaSolved = false;
                        window.passengerFilled = false; 
                        window.paymentExecuted = false; 
                    }
                }
            }
            else if (url.includes('booking/train-list')) {
                if (!window.trainBooked) {
                    if (BOOKING_DETAILS.trainNumber && BOOKING_DETAILS.classCode) {
                        await executeTrainListPhase();
                    }
                }
            }
            else if (url.includes('booking/psgninput')) {
                if (!window.passengerFilled) {
                    await executePassengerPhase();
                }
            }
            else if (url.includes('booking/reviewBooking')) {
                if (!window.captchaSolved) {
                    await executeReviewPhase();
                }
            }
            else if (url.includes('payment/bkgPaymentOptions')) {
                if (!window.paymentExecuted) {
                    await executePaymentPhase();
                }
            }
            
            await sleep(1000);
        }
    }

    // Start the engine
    mainLoop().catch(e => {
        console.error(e);
        log(`CRITICAL ERROR: ${e.message}`);
    });

})();
