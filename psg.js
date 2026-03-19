(async function() {
    'use strict';

    if (window.BMW_RUNNING) return;
    window.BMW_RUNNING = true;

    console.log("BMW PRO Automation Started in Smart Mode!");

    // ============================================================
    // 0. LOGIN CREDENTIALS, BOOKING & PASSENGER DETAILS
    // ============================================================
    const LOGIN_CREDENTIALS = {
        username: "Babu123s",
        password: "g6gf77TN4tA54k#"
    };

    // YAHAN APNE KAM SE KAM 3 PASSENGERS KI DETAILS DAALEIN
    const PASSENGER_DETAILS =[
        { name: "SHIVA", age: "22", gender: "M" },
        { name: "RAHUL", age: "25", gender: "M" }  // <-- 2rd Passenger
    ];

    const BOOKING_DETAILS = {
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

    async function humanClick(el) {
        if (!el) return;
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, buttons: 1 }));
        await sleep(30);
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.click(); 
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

        updateReqStatus("EXECUTING RECORDER LOGIN...", "BOT");

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
            updateReqStatus("SOLVING LOGIN CAPTCHA...", "BOT");
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
            updateReqStatus("CLICKING SIGN IN...", "BOT");
            await humanClick(signInBtn);
            await sleep(2000); 
        }

        window.loginExecuted = true;
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
            <div style="position: fixed; top: 15px; right: 15px; z-index: 9999998; background: rgba(0, 0, 0, 0.85); padding: 12px; border-radius: 8px; font-family: 'Courier New', Courier, monospace; border: 2px solid #555; width: 220px; box-shadow: 0px 0px 15px rgba(0,0,0,0.8); backdrop-filter: blur(5px); text-align: center;">
                <div id="bmw-bot-mode" style="font-size: 24px; font-weight: bold; color: #00ff00; letter-spacing: 2px; text-shadow: 0px 0px 8px #00ff00;">BOT</div>
                <div id="bmw-countdown-box" style="display: none; margin-top: 10px; border-top: 1px dashed #777; padding-top: 8px;">
                    <div id="bmw-countdown-title" style="font-size: 11px; color: #00e5ff; margin-bottom: 4px; font-weight: bold;"></div>
                    <div id="bmw-countdown-time" style="font-size: 22px; font-weight: bold; color: #ff1744; text-shadow: 0 0 5px rgba(255,23,68,0.5); letter-spacing: 1px;">00:00:00</div>
                </div>
                <div id="bmw-current-status" style="font-size: 12px; font-weight: bold; margin-top: 10px; color: #fff; word-wrap: break-word; border-top: 1px dashed #777; padding-top: 8px;">Waiting...</div>
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
            countdownTitle.innerText = `Pending till ${targetTimeStr}`;
            updateReqStatus("WAITING FOR BOOKING TIME...", "BOT");
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

        updateReqStatus("CLICKING REFRESH...", "BOT");
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
                updateReqStatus(`TRYING BOOKING (${retryCount})`, "BOT");

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
            updateReqStatus("BOOKED! GOING TO PASSENGER PAGE...", "BOT");
        }
    }

    // ============================================================
    // RECORDER-REPLAY: PASSENGER FILLING PHASE
    // ============================================================
    async function executePassengerPhase() {
        if (window.passengerFilled) return;
        updateReqStatus("FILLING PASSENGER DETAILS...", "BOT");

        // Wait for passenger component
        await waitFor('app-passenger', 5000);
        await sleep(1500); // UI load hone ke liye

        for (let i = 0; i < PASSENGER_DETAILS.length; i++) {
            const p = PASSENGER_DETAILS[i];

            if (i > 0) {
                // Click + Add Passenger
                const addBtnElements = Array.from(document.querySelectorAll('span, a')).filter(s => s.innerText && s.innerText.includes('+ Add Passenger'));
                if (addBtnElements.length > 0) {
                    await humanClick(addBtnElements[addBtnElements.length - 1]);
                    await sleep(500);
                }
            }

            const blocks = document.querySelectorAll('app-passenger');
            if (i >= blocks.length) continue;
            const block = blocks[i];

            // 1. Name Input
            const nameInput = block.querySelector('p-autocomplete input') || block.querySelector('input[formcontrolname="passengerName"]');
            if (nameInput) {
                await typeAndTrigger(nameInput, p.name);
                await sleep(300);
            }

            // 2. Age Input
            const ageInput = block.querySelector('input[formcontrolname="passengerAge"]') || block.querySelector('input[aria-label="Age"]');
            if (ageInput) {
                await typeAndTrigger(ageInput, p.age);
                await sleep(300);
            }

            // 3. Gender Dropdown 
            const genderSelect = block.querySelector('select[formcontrolname="passengerGender"]');
            if (genderSelect) {
                await humanClick(genderSelect);
                genderSelect.value = p.gender;
                genderSelect.dispatchEvent(new Event('change', { bubbles: true }));
                genderSelect.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
                await sleep(300);
            }
        }

        // 4. Tick "Book only if confirm berths are allotted"
        try {
            const allLabels = Array.from(document.querySelectorAll('label'));
            const confirmLabel = allLabels.find(l => l.innerText.toLowerCase().includes('confirm berths'));
            
            if (confirmLabel) {
                const targetRadioBox = confirmLabel.parentElement.parentElement.querySelector('.ui-radiobutton-box, .ui-chkbox-box') 
                                       || document.querySelector('p-radiobutton[inputid="2"] .ui-radiobutton-box') 
                                       || confirmLabel;
                await humanClick(targetRadioBox);
                await sleep(500);
            }
        } catch (e) {
            console.log("No confirm berth option found or error:", e);
        }

        // 5. Select Payment Mode (BHIM/UPI - Option 2 based on your JSON)
        try {
            updateReqStatus("SELECTING BHIM/UPI PAYMENT...", "BOT");
            // Hum IRCTC k form mei directly 2nd option select kar rahe hain jaise JSON me record hua tha
            
            // Method 1: Using the exact id="2" from JSON
            let paymentOptionSelected = false;
            const upiRadioById = document.querySelector('p-radiobutton[inputid="2"] .ui-radiobutton-box') 
                                 || document.querySelector('tr:nth-of-type(2) .ui-radiobutton-box');

            if (upiRadioById) {
                await humanClick(upiRadioById);
                paymentOptionSelected = true;
                await sleep(500);
            } 
            
            // Method 2: Fallback (Text search)
            if (!paymentOptionSelected) {
                const allLabels = Array.from(document.querySelectorAll('label'));
                const upiLabel = allLabels.find(l => l.innerText.toUpperCase().includes('BHIM') || l.innerText.toUpperCase().includes('UPI'));
                
                if (upiLabel) {
                    const upiBox = upiLabel.parentElement.parentElement.querySelector('.ui-radiobutton-box') || upiLabel;
                    await humanClick(upiBox);
                    await sleep(500);
                }
            }
        } catch (e) {
            console.log("Payment selection error:", e);
        }

        // 6. Click Continue Button
        const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.toLowerCase().includes('continue') && !b.classList.contains('ng-hide'));
        if (continueBtn) {
            updateReqStatus("CLICKING CONTINUE...", "BOT");
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

                updateReqStatus('SOLVING PAYMENT CAPTCHA...', "BOT");
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
            updateReqStatus("CAPTCHA DONE. PAYMENT PAGE LOADED.", "BOT");
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
                const isLoggedIn = document.querySelector('a[aria-label="Click here to Logout"]') !== null || 
                                   (document.querySelector('span.pull-right') !== null && document.querySelector('span.pull-right').innerText.includes('Welcome'));
                
                if (!isLoggedIn) {
                    if (!window.loginExecuted || document.querySelector('app-login')) {
                        updateReqStatus("EXECUTING LOGIN...", "BOT");
                        await executeRecorderLogin();
                    } else {
                        updateReqStatus("LOGIN DONE. WAITING...", "BOT");
                    }
                } else {
                    updateReqStatus("SEARCH YOUR TRAIN", "MANUAL");
                    window.trainBooked = false; 
                    window.captchaSolved = false;
                    window.passengerFilled = false; // Reset tracker
                }
            }
            else if (url.includes('booking/train-list')) {
                if (!window.trainBooked) {
                    if (BOOKING_DETAILS.trainNumber && BOOKING_DETAILS.classCode) {
                        await executeTrainListPhase();
                    } else {
                        updateReqStatus("ENTER TRAIN NUMBER IN SCRIPT!", "MANUAL");
                    }
                } else {
                    updateReqStatus("BOOKED! WAITING NEXT PAGE...", "BOT");
                }
            }
            else if (url.includes('booking/psgninput')) {
                // PASSENGER PHASE TRIGGER
                if (!window.passengerFilled) {
                    await executePassengerPhase();
                } else {
                    updateReqStatus("PROCEEDING TO REVIEW...", "BOT");
                }
            }
            else if (url.includes('booking/reviewBooking')) {
                if (!window.captchaSolved) {
                    updateReqStatus("SOLVING CAPTCHA...", "BOT");
                    await executeReviewPhase();
                } else {
                    updateReqStatus("VERIFIED! PROCEED TO PAY...", "MANUAL");
                }
            }
            else if (url.includes('payment/bkgPaymentOptions')) {
                updateReqStatus("MAKE PAYMENT", "MANUAL");
            }
            else {
                updateReqStatus("IDLE / WAITING...", "MANUAL");
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
