

(async function() {
    'use strict';

    if (window.BMW_RUNNING) return;
    window.BMW_RUNNING = true;

    console.log("BMW PRO Automation Started in Full-Auto Payment Mode!");

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

    // ============================================================
    // 0. DYNAMIC CONFIGURATION (Saved in Local Storage)
    // ============================================================
    const DEFAULT_CONFIG = {
        trainNumber: "13307",
        classCode: "SL",
        quota: "GENERAL",
        ACTime: "09:59:00",
        SLTime: "10:59:00",
        GNTime: "07:59:00"
    };

    let BMW_CONFIG = JSON.parse(localStorage.getItem('BMW_CONFIG')) || DEFAULT_CONFIG;

    function saveConfig() {
        localStorage.setItem('BMW_CONFIG', JSON.stringify(BMW_CONFIG));
    }

    // State Trackers
    window.trainBooked = false;
    window.captchaSolved = false;
    window.paymentExecuted = false; // Added Payment State

    // ============================================================
    // 1. HELPER FUNCTIONS & STEALTH ENGINES
    // ============================================================
    function log(msg) { console.log(`[BOT] ${msg}`); }
    
    function updateReqStatus(msg) {
        log(`STATUS UPDATE: ${msg}`);
        const statusEl = document.getElementById('bmw-current-status');
        if (statusEl) {
            statusEl.innerText = msg;
        }
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms < 150 ? ms : (ms * SPEED_MULTIPLIER)));
    const realTimeSleep = (ms) => new Promise(r => setTimeout(r, ms));
    const humanSleep = (ms, jitter = 0) => new Promise(r => setTimeout(r, ms + Math.floor(Math.random() * jitter))); // Fix for payment block

    // Helper for XPath selections in Payment section
    function getElementByXPath(xpath) {
        try {
            return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } catch (e) {
            return null;
        }
    }

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

    async function typeAndTrigger(element, value) {
        if (!element) return;
        element.focus();
        element.click();
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        for (let i = 0; i < value.length; i++) {
            nativeSetter.call(element, element.value + value[i]);
            element.dispatchEvent(new KeyboardEvent('keydown', { key: value[i], bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keyup', { key: value[i], bubbles: true }));
            await sleep(10 + Math.random() * 20); 
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
    // 2. UI CREATION (Status Bar)
    // ============================================================
    function initBMWUI() {
        if (document.getElementById('bmw-status-container')) return;
        const target = document.body || document.documentElement;
        if (!target) return;

        const container = document.createElement('div');
        container.id = 'bmw-status-container';
        container.innerHTML = `
            <div style="position: fixed; top: 15px; right: 15px; z-index: 9999998; background: rgba(0, 0, 0, 0.85); border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #00ff00; width: 200px; box-shadow: 0px 4px 15px rgba(0,255,0,0.3); backdrop-filter: blur(5px); overflow: hidden;">
                
                <div style="display:flex; justify-content: space-between; align-items:center; background: #111; padding: 10px 15px; border-bottom: 1px solid #00ff00;">
                    <div style="font-size: 14px; font-weight: bold; color: #00ff00; letter-spacing: 1px;">BMW PRO</div>
                    <div style="display:flex; gap: 5px;">
                        <button id="bmw-save-btn" style="background: #28a745; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-weight: bold; cursor: pointer; box-shadow: 0 0 5px #28a745; font-size:12px; transition: 0.2s;">SAVE</button>
                        <button id="bmw-toggle-btn" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 4px 8px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size:12px; transition: 0.2s;" title="Toggle Inputs">▼</button>
                    </div>
                </div>
                
                <div style="padding: 15px;">
                    <div id="bmw-inputs-section" style="display: none; margin-bottom: 15px;">
                        <div style="margin-bottom: 10px; display:flex; justify-content: space-between; gap: 8px;">
                            <input type="text" id="bmw-status-train" placeholder="Train No" value="${BMW_CONFIG.trainNumber}" style="width:50%; background:#222; color:#0f0; border:1px solid #444; border-radius:4px; padding:6px; font-size:12px; font-weight:bold; text-align:center; outline:none;">
                            
                            <select id="bmw-status-class" style="width:50%; background:#222; color:#0f0; border:1px solid #444; border-radius:4px; padding:6px; font-size:12px; font-weight:bold; outline:none;">
                                <option value="SL">SL</option><option value="1A">1A</option><option value="2A">2A</option>
                                <option value="3A">3A</option><option value="3E">3E</option><option value="CC">CC</option>
                                <option value="EC">EC</option><option value="2S">2S</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 5px;">
                            <select id="bmw-status-quota" style="width:100%; background:#222; color:#0f0; border:1px solid #444; border-radius:4px; padding:6px; font-size:12px; font-weight:bold; outline:none;">
                                <option value="GENERAL">GENERAL</option>
                                <option value="TATKAL">TATKAL</option>
                                <option value="PREMIUM TATKAL">PREMIUM TATKAL</option>
                            </select>
                        </div>
                    </div>

                    <div style="padding: 10px 20px; background: rgba(0, 20, 0, 0.6); border: 1px solid #00ff00; border-radius: 6px; text-align: center; min-height: 55px; display: flex; flex-direction: column; justify-content: center;">
                        <div id="bmw-status-wrapper">
                            <div style="font-size: 11px; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">Current Process</div>
                            <div id="bmw-current-status" style="font-size: 13px; font-weight: bold; color: #ffeb3b; word-wrap: break-word;">Waiting...</div>
                        </div>
                        <div id="bmw-timer-wrapper" style="display: none;">
                            <div id="bmw-countdown-title" style="font-size: 11px; color: #00e5ff; margin-bottom: 4px; font-weight: bold; text-transform: uppercase;"></div>
                            <div id="bmw-countdown-time" style="font-size: 22px; font-weight: bold; color: #ff1744; text-shadow: 0 0 8px rgba(255,23,68,0.6); letter-spacing: 2px; font-family: 'Courier New', monospace;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        target.appendChild(container);

        document.getElementById('bmw-status-class').value = BMW_CONFIG.classCode;
        document.getElementById('bmw-status-quota').value = BMW_CONFIG.quota;

        const toggleBtn = document.getElementById('bmw-toggle-btn');
        const inputsSection = document.getElementById('bmw-inputs-section');
        toggleBtn.addEventListener('click', () => {
            if (inputsSection.style.display === 'none') {
                inputsSection.style.display = 'block';
                toggleBtn.innerText = '▲';
            } else {
                inputsSection.style.display = 'none';
                toggleBtn.innerText = '▼';
            }
        });

        document.getElementById('bmw-status-train').addEventListener('input', (e) => { BMW_CONFIG.trainNumber = e.target.value; saveConfig(); });
        document.getElementById('bmw-status-class').addEventListener('change', (e) => { BMW_CONFIG.classCode = e.target.value; saveConfig(); });
        document.getElementById('bmw-status-quota').addEventListener('change', (e) => { BMW_CONFIG.quota = e.target.value; saveConfig(); });
        
        document.getElementById('bmw-save-btn').addEventListener('click', () => {
            BMW_CONFIG.trainNumber = document.getElementById('bmw-status-train').value.trim();
            BMW_CONFIG.classCode = document.getElementById('bmw-status-class').value;
            BMW_CONFIG.quota = document.getElementById('bmw-status-quota').value;
            saveConfig();
            
            const btn = document.getElementById('bmw-save-btn');
            btn.innerText = 'SAVED!';
            setTimeout(() => { btn.innerText = 'SAVE'; }, 2000);
        });
    }

    async function smartWaitWithDisplay(targetTimeStr, mainTitle, subDetail) {
        if (!targetTimeStr) return;
        const[tHour, tMin, tSec] = targetTimeStr.split(':').map(Number);
        const now = new Date();
        const targetDate = new Date();
        targetDate.setHours(tHour, tMin, tSec || 0, 0);

        if (now > targetDate) {
            log(`Target time ${targetTimeStr} already passed.`);
            return;
        }

        const statusWrapper = document.getElementById('bmw-status-wrapper');
        const timerWrapper = document.getElementById('bmw-timer-wrapper');
        const countdownTitle = document.getElementById('bmw-countdown-title');
        const countdownTime = document.getElementById('bmw-countdown-time');

        if (statusWrapper && timerWrapper && countdownTitle) {
            statusWrapper.style.display = 'none';
            timerWrapper.style.display = 'block';
            countdownTitle.innerText = `${mainTitle} - ${targetTimeStr}`;
        }

        while (true) {
            const current = new Date();
            const diff = targetDate - current;
            
            if (diff <= 0) {
                if (statusWrapper && timerWrapper) {
                    timerWrapper.style.display = 'none';
                    statusWrapper.style.display = 'block';
                }
                break;
            }

            if (countdownTime) {
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                const ms = Math.floor((diff % 1000) / 10); 
                
                const hStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
                countdownTime.innerText = `${hStr}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
            }

            if (diff < 1000) await new Promise(r => setTimeout(r, 20));
            else await new Promise(r => setTimeout(r, 80)); 
        }
    }

    async function solveTrueCaptcha(imgElement, inputElement) {
        try {
            updateReqStatus('SOLVING CAPTCHA...');
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
    async function executeTrainListPhase() {
        const { trainNumber, classCode, quota, ACTime, SLTime, GNTime } = BMW_CONFIG;
        
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
                await smartWaitWithDisplay(GNTime, "GENERAL BOOKING", "Waiting...");
            }
        }

        if (quota.toUpperCase().includes("TATKAL")) {
            const acClasses =["1A", "2A", "3A", "3E", "CC", "EC", "EA"];
            const isAC = acClasses.includes(classCode.toUpperCase());
            const targetTimeStr = isAC ? ACTime : SLTime;
            
            const[tHour, tMin] = targetTimeStr.split(':').map(Number);
            if (currentHour < tHour || (currentHour === tHour && now.getMinutes() < tMin)) {
                await smartWaitWithDisplay(targetTimeStr, `TATKAL : ${isAC ? 'AC' : 'NON-AC'}`, `Class: ${classCode}`);
            }
        }

        updateReqStatus("CLICKING REFRESH...");
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
                updateReqStatus(`TRYING BOOKING (${retryCount})`);

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
            updateReqStatus("BOOKED! GOING TO PASSENGER PAGE...");
        }
    }

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
                        await sleep(300);
                    }
                } else {
                    await sleep(300);
                }
            } else {
                await sleep(300);
            }
        }

        if(localCaptchaSolved) {
            window.captchaSolved = true;
            updateReqStatus("CAPTCHA DONE. PAYMENT PAGE LOADED.");
        }
    }

    // PAYMENT GATEWAY SELECTION PHASE (Automated)
    // ============================================================
    async function executePaymentPhase() {
        if (window.paymentExecuted) return;
        
        updateReqStatus("AUTO SELECTING PAYMENT GATEWAY...");
        await waitFor('app-payment', 5000);
        await humanSleep(180, 100); 

        // Step 1: Click BHIM/ UPI/ USSD
        const step1Xpath = '//*[@id="pay-type"]/span/div[3]/span';
        let step1El = getElementByXPath(step1Xpath) || Array.from(document.querySelectorAll('span')).find(el => el.innerText.trim() === 'BHIM/ UPI/ USSD');
        if (step1El) {
            await humanClick(step1El);
            await humanSleep(230, 150); 
        }

        // Step 2: Click Continue if present
        const step2Xpath = '//*[@id="psgn-form"]/div[1]/div[1]/app-payment/div[1]/div/form/p-sidebar[2]/div/div/div[2]/button';
        let step2El = getElementByXPath(step2Xpath) || Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Continue');
        if (step2El && window.getComputedStyle(step2El).display !== 'none') {
            await humanClick(step2El);
            await humanSleep(215, 150);
        }

        // Step 3: Click Paytm
        let step3El = null;
        const allBankTexts = document.querySelectorAll('.bank-text span');
        for (let i = 0; i < allBankTexts.length; i++) {
            if (allBankTexts[i].innerText.toUpperCase().includes('PAYTM')) {
                step3El = allBankTexts[i].closest('.border-all') || allBankTexts[i].closest('div[tabindex="0"]') || allBankTexts[i];
                break;
            }
        }
        
        if (!step3El) {
            const step3Xpath = '//*[@id="bank-type"]/div/table/tr/span[2]/td/div/div';
            step3El = getElementByXPath(step3Xpath) || document.querySelector('#bank-type span:nth-of-type(2) div > div');
        }

        if (step3El) {
            await humanClick(step3El);
            await humanSleep(210, 150);
        }
        
        // Step 4: Click Pay & Book
        const step4Xpath = '//*[@id="psgn-form"]/div[1]/div[1]/app-payment/div[1]/div/form/p-sidebar[1]/div/div/div[2]/div[2]/button';
        let step4El = getElementByXPath(step4Xpath) || Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes('Pay & Book'));
        if (step4El) {
            await humanClick(step4El);
            window.paymentExecuted = true;
            updateReqStatus("PAYMENT INITIATED!");
            await humanSleep(200, 100);
        }
    }


    // ============================================================
    // 4. MAIN ORCHESTRATOR LOOP (SPA Router)
    // ============================================================
    async function mainLoop() {
        initBMWUI();

        while (true) {
            const url = window.location.href;
            const uiContainer = document.getElementById('bmw-status-container');
            
            // ✅ HIDE ON PASSENGER & PAYMENT PAGES
            if (url.includes('booking/psgninput') || url.includes('payment/bkgPaymentOptions') || url.includes('payment')) {
                if (uiContainer) uiContainer.style.display = 'none';
            } else {
                if (uiContainer) uiContainer.style.display = 'block';
            }
            
            if (url.includes('train-search')) {
                updateReqStatus("MANUAL SEARCH PAGE...");
                window.trainBooked = false; 
                window.captchaSolved = false;
                window.paymentExecuted = false; // Reset Payment logic on new search
            }
            else if (url.includes('booking/train-list')) {
                if (!window.trainBooked) {
                    if (BMW_CONFIG.trainNumber && BMW_CONFIG.classCode) {
                        await executeTrainListPhase();
                    } else {
                        updateReqStatus("ENTER TRAIN NUMBER!");
                    }
                } else {
                    updateReqStatus("BOOKED! WAITING NEXT PAGE...");
                }
            }
            else if (url.includes('booking/psgninput')) {
                updateReqStatus("MANUALLY FILL PASSENGER...");
            }
            else if (url.includes('booking/reviewBooking')) {
                if (!window.captchaSolved) {
                    await executeReviewPhase();
                } else {
                    updateReqStatus("VERIFIED! PROCEED TO PAY...");
                }
            }
            else if (url.includes('payment/bkgPaymentOptions') || url.includes('payment')) {
                if (!window.paymentExecuted) {
                    await executePaymentPhase(); // Ab manual nahi auto Payment Gateway select karega
                } else {
                    updateReqStatus("WAITING FOR PAYMENT PROCESS...");
                }
            }
            else {
                updateReqStatus("IDLE / WAITING...");
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
