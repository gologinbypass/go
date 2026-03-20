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
         // <-- 2rd Passenger
    ];

    const BOOKING_DETAILS = {
        fromStation: "CSMT ",      // <-- ADDED: From Station
        toStation: "KQR ",        // <-- ADDED: To Station
        date: "21/03/2026",      // <-- ADDED: Journey Date
        trainNumber: "12322",   
        classCode: "3A",        
        quota: "PREMIUM TATKAL"  
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
    window.journeyDetailsFilled = false; // <-- ADDED for Journey Phase

    // ============================================================
    // 1. HELPER FUNCTIONS & STEALTH ENGINES
    // ============================================================
    function log(msg) { console.log(`[BOT] ${msg}`); }
    
    function updateReqStatus(msg, mode = "BOT") {
        log(`STATUS UPDATE: ${msg}`);
        
        const statusEl = document.getElementById('bmw-current-status');
        if (statusEl) {
            statusEl.innerText = msg;
        }

        const modeEl = document.getElementById('bmw-bot-mode');
        if (modeEl) {
            modeEl.innerText = mode;
            modeEl.style.color = mode === "BOT" ? "#00ff00" : "#ff9800";
            modeEl.style.textShadow = mode === "BOT" ? "0px 0px 8px #00ff00" : "0px 0px 8px #ff9800";
        }
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms < 150 ? ms : (ms * SPEED_MULTIPLIER)));
    const realTimeSleep = (ms) => new Promise(r => setTimeout(r, ms));

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

    // ADVANCED HUMAN TYPING - Angular events fix
    async function typeAndTrigger(element, value) {
        if (!element) return;
        element.focus();
        element.dispatchEvent(new Event('focus', { bubbles: true }));
        element.click();
        
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(element, '');
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        for (let i = 0; i < value.length; i++) {
            nativeSetter.call(element, element.value + value[i]);
            element.dispatchEvent(new KeyboardEvent('keydown', { key: value[i], bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keyup', { key: value[i], bubbles: true }));
            await sleep(15 + Math.random() * 20); 
        }
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    }

    // SPECIAL TYPING - Bina 'blur' ke jisse Station Dropdown gayab na ho
    async function typeForAutoComplete(element, value) {
        if (!element) return;
        element.focus();
        element.dispatchEvent(new Event('focus', { bubbles: true }));
        element.click();
        
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(element, '');
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        for (let i = 0; i < value.length; i++) {
            nativeSetter.call(element, element.value + value[i]);
            element.dispatchEvent(new KeyboardEvent('keydown', { key: value[i], bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keyup', { key: value[i], bubbles: true }));
            await sleep(40 + Math.random() * 20); 
        }
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    async function humanClick(el) {
        if (!el) return;
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, buttons: 1 }));
        await sleep(30);
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.click(); 
    }

    // XPath helper specific for JSON Selectors
    function getElementByXPath(xpath) {
        try {
            return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } catch (e) {
            return null;
        }
    }

    function startAntiIdle() {
        setInterval(() => {
            const x = Math.floor(Math.random() * window.innerWidth);
            const y = Math.floor(Math.random() * window.innerHeight);
            document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
        }, 1500);
    }
    startAntiIdle(); 

    // ============================================================
    // RECORDER LOGIN REPLAY
    // ============================================================
    async function executeRecorderLogin() {
        if (window.loginExecuted) return;
        const { username, password } = LOGIN_CREDENTIALS;
        if (!username || !password) return;

        

        const hamburger = document.querySelector('div.moblogo > a > i');
        if (hamburger && !document.querySelector('app-login')) {
            await humanClick(hamburger);
            await sleep(800);
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
        await sleep(1500); 

        const userField = document.querySelector('input[aria-label="User Name"]') || document.querySelector('input[formcontrolname="userid"]');
        if (userField && !userField.value) {
            await typeAndTrigger(userField, username);
            await sleep(500);
        }

        const passField = document.querySelector('input[aria-label="Password"]') || document.querySelector('input[formcontrolname="password"]');
        if (passField && !passField.value) {
            await typeAndTrigger(passField, password);
            await sleep(500);
        }

        const captchaInput = document.querySelector('app-login #captcha');
        const captchaImg = document.querySelector('app-login .captcha-img');
        
        if (captchaImg && captchaInput) {
            
            let retries = 0;
            while (retries < 20 && captchaImg.src.length < 100) {
                await sleep(200);
                retries++;
            }
            await solveTrueCaptcha(captchaImg, captchaInput);
            await sleep(1000); 
        } else {
            await sleep(1000);
        }

        const signInBtn = document.querySelector('app-login button[type="submit"]') || Array.from(document.querySelectorAll('app-login button')).find(b => b.innerText && b.innerText.includes('SIGN IN'));
        if (signInBtn) {
            
            await humanClick(signInBtn);
            await sleep(2000); 
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

        
        await sleep(1000);

        // First close any "Last Transaction Detail" popup to ensure clear view
        const allPrimaryBtns = document.querySelectorAll('button.btn.btn-primary');
        for (const btn of allPrimaryBtns) {
            if (btn.innerText.trim().toUpperCase() === "CLOSE" || (btn.getAttribute('aria-label') && btn.getAttribute('aria-label').includes('Last Transaction Detail'))) {
                await humanClick(btn);
                await sleep(500); 
                break;
            }
        }
        await waitForSpinner();

        // ---------------------------------------------------------
        // JSON STEP 1: Click "Minimize chat" (PC & Mobile Safe)
        // ---------------------------------------------------------
        try {
            let minimizeIcon = document.querySelector('#minimiseIconx') || getElementByXPath('//*[@id="minimiseIconx"]');
            if (minimizeIcon && minimizeIcon.offsetParent !== null) {
                await humanClick(minimizeIcon);
                await sleep(300);
            }
        } catch(e) {}

        // ---------------------------------------------------------
        // JSON STEP 2 & 3: Click 'From' Input and Type Value
        // ---------------------------------------------------------
        let fromEl = document.querySelector('form > div:nth-of-type(2) > div:nth-of-type(1) input') || document.querySelector('#origin input');
        if (fromEl) {
            await humanClick(fromEl); // JSON Click
            await sleep(400);
            await typeForAutoComplete(fromEl, BOOKING_DETAILS.fromStation); // Type WITHOUT Blur
            await sleep(1500); 
        }

        // ---------------------------------------------------------
        // JSON STEP 4: Click Highlighted Option
        // ---------------------------------------------------------
        let fromOpt = await waitFor('#p-highlighted-option > span', 5000);
        if (fromOpt) {
            await humanClick(fromOpt);
            await sleep(600);
        }

        // ---------------------------------------------------------
        // JSON STEP 5 & 6: Click 'To' Input and Type Value
        // ---------------------------------------------------------
        let toEl = document.querySelector('#divMain div:nth-of-type(2) > div:nth-of-type(2) input') || document.querySelector('#destination input');
        if (toEl) {
            await humanClick(toEl); // JSON Click
            await sleep(400);
            await typeForAutoComplete(toEl, BOOKING_DETAILS.toStation); // Type WITHOUT Blur
            await sleep(1500); 
        }

        // ---------------------------------------------------------
        // JSON STEP 7: Click Highlighted Option
        // ---------------------------------------------------------
        let toOpt = await waitFor('#p-highlighted-option > span', 5000);
        if (toOpt) {
            await humanClick(toOpt);
            await sleep(600);
        }

        // ---------------------------------------------------------
        // JSON STEP 8: Click 'Journey Date' Input
        // ---------------------------------------------------------
        let dateEl = document.querySelector('div:nth-of-type(3) > div:nth-of-type(1) input') || document.querySelector('#jDate input');
        if (dateEl) {
            await humanClick(dateEl); // JSON Click
            await sleep(800);
        }

        // ---------------------------------------------------------
        // JSON STEP 9 & 10: Click 'Next Arrow' till Month Matches
        // ---------------------------------------------------------
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
                
                // JSON Click: a.ui-datepicker-next > span
                let nextBtn = document.querySelector('a.ui-datepicker-next > span') || document.querySelector('.ui-datepicker-next');
                if (nextBtn) { 
                    await humanClick(nextBtn); 
                    await sleep(400); 
                } else {
                    break;
                }
                maxClicks--;
            }

            // ---------------------------------------------------------
            // JSON STEP 11: Click Exact Date
            // ---------------------------------------------------------
            const days = document.querySelectorAll('p-calendar .ui-datepicker-calendar a');
            for (const day of days) {
                if (day.innerText.trim() === parseInt(tDay, 10).toString()) {
                    await humanClick(day);
                    await sleep(500);
                    break;
                }
            }
        }

        // ---------------------------------------------------------
        // JSON STEP 12: Click Quota Dropdown
        // ---------------------------------------------------------
        let quotaDrop = document.querySelector('#journeyQuota > div');
        if (quotaDrop) {
            await humanClick(quotaDrop);
            await sleep(800);
            
            // ---------------------------------------------------------
            // JSON STEP 13: Click Specific Quota Option
            // ---------------------------------------------------------
            let quotaItems = document.querySelectorAll('p-dropdownitem li span, ul.ui-dropdown-items li span');
            for (let item of quotaItems) {
                if (item.innerText.trim().toUpperCase() === BOOKING_DETAILS.quota.toUpperCase()) {
                    await humanClick(item);
                    await sleep(500);
                    break;
                }
            }
        }

        // ---------------------------------------------------------
        // JSON STEP 14: Click Search Trains Button
        // ---------------------------------------------------------
        let searchBtn = document.querySelector('div.tbis-box > div:nth-of-type(1) button') || document.querySelector('button.search_btn.train_Search');
        if (searchBtn) {
            
            await humanClick(searchBtn);
            await sleep(1000);
            await waitForSpinner();
            window.journeyDetailsFilled = true; // Mark as done!
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
<div id="bmw-overlay-container" style="
    position: fixed; 
    top: 15px; 
    right: 15px; 
    z-index: 9999998; 
    background: rgba(0, 0, 0, 0.9); /* Original black background */
    padding: 8px 10px; 
    border-radius: 5px; /* Perfect Capsule shape jaisa image mein hai */
    font-family: 'Courier New', Courier, monospace; 
    border: 3px solid #ff007f; /* Image jaisa bright pink/magenta border */
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    box-shadow: 0px 0px 15px rgba(255, 0, 127, 0.4); /* Pinkish glow */
    backdrop-filter: blur(5px);
">
    <div id="bmw-bot-mode" style="
        font-size: 12px; 
        font-weight: bold; 
        color: #fff; 
        letter-spacing: 1px;
    ">KTM</div>

    ||

    <div id="bmw-current-status" style="
        font-size: 12px; 
        color: #fff;
    ">RED STAR</div>
    ||
    <div id="bmw-countdown-time" style="         
        font-size: 12px; 
        font-weight: bold; 
        color: #fff;
    ">EDISON</div>
</div>
        `;
        target.appendChild(container);
    }

    async function smartWaitWithDisplay(targetTimeStr, mainTitle) {
        if (!targetTimeStr) return;
        const[tHour, tMin, tSec] = targetTimeStr.split(':').map(Number);
        const now = new Date();
        const targetDate = new Date();
        targetDate.setHours(tHour, tMin, tSec || 0, 0);

        if (now > targetDate) {
            return;
        }

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

            try {
                const configResp = await fetch('https://raw.githubusercontent.com/SHANKARPDJ/EXESOFTWARE/refs/heads/main/trueconfig.json');
                if (configResp.ok) {
                    const json = await configResp.json();
                    if (json.truecaptcha) config = json.truecaptcha;
                }
            } catch (err) { }

            const base64Data = imgElement.src.split(',')[1];
            if (!base64Data) return false;

            const response = await fetch("https://api.apitruecaptcha.org/one/gettext", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    'client': "chrome extension",
                    'location': 'https://www.irctc.co.in/nget/train-search',
                    'version': "0.3.8",
                    'case': "mixed",
                    'promise': "true",
                    'extension': true,
                    'userid': config.userid,
                    'apikey': config.apikey,
                    'data': base64Data
                })
            });

            if (!response.ok) return false;
            const data = await response.json();
            let resultText = data.result;

            if (resultText) {
                resultText = resultText.replace(/\s+/g, '').replace(')', 'J').replace(']', 'J');
                await typeAndTrigger(inputElement, resultText);
                await sleep(500);
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

        // TIMING CHECK
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
            
            const [tHour, tMin] = targetTimeStr.split(':').map(Number);
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
    // RECORDER-REPLAY: PASSENGER FILLING PHASE 
    // ============================================================
    async function executePassengerPhase() {
        if (window.passengerFilled) return;
        

        // Wait for passenger component
        await waitFor('app-passenger', 5000);
        await sleep(1500); // UI load hone ke liye wait

        // START TIMER FOR 15 SECONDS STRICT RULE
        const startTime = Date.now();

        for (let i = 0; i < PASSENGER_DETAILS.length; i++) {
            const p = PASSENGER_DETAILS[i];

            if (i > 0) {
                // Click + Add Passenger
                const addBtn = getElementByXPath('//*[contains(text(), "+ Add Passenger")]') 
                               || document.querySelector('div.col-lg-9 > div:nth-of-type(6) div:nth-of-type(2) > div.pull-left span:nth-of-type(1)');
                if (addBtn) {
                    await humanClick(addBtn);
                    await sleep(600);
                }
            }

            const blocks = document.querySelectorAll('app-passenger');
            if (i >= blocks.length) continue;
            const block = blocks[i];

            // 1. Name Input 
            const nameInput = block.querySelector('span > div.col-xs-12 input');
            if (nameInput) {
                await humanClick(nameInput); 
                await sleep(200);
                await typeAndTrigger(nameInput, p.name); 
                await sleep(300);
            }

            // 2. Age Input 
            const ageInput = block.querySelector('div.col-sm-1 > input');
            if (ageInput) {
                await humanClick(ageInput); 
                await sleep(200);
                await typeAndTrigger(ageInput, p.age); 
                await sleep(300);
            }

            // 3. Gender Dropdown 
            const genderSelect = block.querySelector('div.col-sm-2 > select');
            if (genderSelect) {
                await humanClick(genderSelect); 
                await sleep(200);
                genderSelect.value = p.gender; 
                genderSelect.dispatchEvent(new Event('change', { bubbles: true }));
                genderSelect.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
                await sleep(300);
            }
        }

        // 4. Tick "Book only if confirm berths are allotted" 
        try {
            const confirmLabel = getElementByXPath('//label[contains(text(), "Book only if")]') 
                                 || document.querySelector('span div:nth-of-type(2) > label');
            if (confirmLabel) {
                await humanClick(confirmLabel);
                await sleep(500);
            }
        } catch (e) {
            console.log("No confirm berth option found or error:", e);
        }

        // 5. Select Payment Mode (BHIM/UPI)
        try {
            
            const upiRadio = getElementByXPath('//*[@id="2"]/div/div[2]') 
                             || document.querySelector('tr:nth-of-type(2) div.ui-radiobutton-box');

            if (upiRadio) {
                await humanClick(upiRadio);
                await sleep(500);
            } 
        } catch (e) {
            console.log("Payment selection error:", e);
        }

        // ==========================================================
        // ENFORCE MINIMUM 15 SECONDS WAIT BEFORE CONTINUE
        // ==========================================================
        const elapsedTime = Date.now() - startTime;
        const requiredTime = 15000; // 15 seconds strict rule
        if (elapsedTime < requiredTime) {
            const remainingTime = requiredTime - elapsedTime;
            
            await realTimeSleep(remainingTime);
        }

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
                while (retries < 20 && captchaImg.src.length < 100) {
                    await sleep(200);
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
                        await sleep(200); 
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
                            await typeAndTrigger(captchaInput, '');
                            await sleep(1000);
                            continue;
                        }

                    } else {
                        await sleep(1000);
                    }
                } else {
                    await sleep(1000);
                }
            } else {
                await sleep(1000);
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
        

        // Wait for Angular payment wrapper to load properly
        await waitFor('app-payment', 5000);
        await sleep(1500); 

        function getByXpath(xpath) {
            try {
                return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } catch (e) { return null; }
        }

        // STEP 1: Click BHIM/ UPI/ USSD 
        const step1Xpath = '//*[@id="pay-type"]/span/div[3]/span';
        let step1El = getByXpath(step1Xpath) || 
                      Array.from(document.querySelectorAll('div.col-sm-9 div > span')).find(el => el.innerText.includes('BHIM/ UPI/ USSD')) ||
                      Array.from(document.querySelectorAll('span')).find(el => el.innerText.trim() === 'BHIM/ UPI/ USSD');
        if (step1El) {
            await humanClick(step1El);
            await sleep(800); 
        }

        // STEP 2: Click Continue 
        const step2Xpath = '//*[@id="psgn-form"]/div[1]/div[1]/app-payment/div[1]/div/form/p-sidebar[2]/div/div/div[2]/button';
        let step2El = getByXpath(step2Xpath) || 
                      Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Continue');
        if (step2El && window.getComputedStyle(step2El).display !== 'none') {
            await humanClick(step2El);
            await sleep(800);
        }

// STEP 3: Click inside Bank Type Gateway Grid (JSON step 3)
        const step3Xpath = '//*[@id="bank-type"]/div/table/tr/span[2]/td/div/div';
        let step3El = getByXpath(step3Xpath) || 
                      document.querySelector('#bank-type span:nth-of-type(2) div > div') ||
                      (document.querySelectorAll('#bank-type span')[2] ? document.querySelectorAll('#bank-type span')[2].querySelector('div') : null);
        if (step3El) {
            await humanClick(step3El);
            await sleep(800);
        }
        
        
        
        
        // STEP 4: Click Pay & Book 
        const step4Xpath = '//*[@id="psgn-form"]/div[1]/div[1]/app-payment/div[1]/div/form/p-sidebar[1]/div/div/div[2]/div[2]/button';
        let step4El = getByXpath(step4Xpath) || 
                      Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes('Pay & Book'));
        if (step4El) {
            
            await humanClick(step4El);
            window.paymentExecuted = true;
            await sleep(1000);
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
                // FIXED LOGIN DETECTION LOGIC
                const loginLink = document.querySelector('a.search_btn.loginText');
                const isLoginLinkVisible = loginLink && window.getComputedStyle(loginLink).display !== 'none';
                const isLoginModalOpen = document.querySelector('app-login') !== null;
                
                if (isLoginLinkVisible || isLoginModalOpen) {
                    if (!window.loginExecuted || isLoginModalOpen) {
                        
                        await executeRecorderLogin();
                    } else {
                        
                    }
                } else {
                    // Executing EXACT JSON replay immediately when logged in
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
                    } else {
                        
                    }
                } else {
                    
                }
            }
            else if (url.includes('booking/psgninput')) {
                // PASSENGER PHASE TRIGGER
                if (!window.passengerFilled) {
                    await executePassengerPhase();
                } else {
                    
                }
            }
            else if (url.includes('booking/reviewBooking')) {
                if (!window.captchaSolved) {
                    
                    await executeReviewPhase();
                } else {
                    
                }
            }
            else if (url.includes('payment/bkgPaymentOptions')) {
                if (!window.paymentExecuted) {
                    await executePaymentPhase();
                } else {
                    
                }
            }
            else {
                
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
