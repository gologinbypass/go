(async function() {
    'use strict';

    if (window.BMW_RUNNING) return;
    window.BMW_RUNNING = true;

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
    // 0. DYNAMIC CONFIGURATION (Edit values directly here)
    // ============================================================
    const DEFAULT_CONFIG = {
        // ---- LOGIN & JOURNEY DETAILS ----
        USERNAME: "Babu123s",
        PASSWORD: "g6gf77TN4tA54k#",
        FROM_CODE: "KQR",
        TO_CODE: "LDH",
        DATE_DMY: "23/05/2026", // Format DD/MM/YYYY
        CLASS_NAME: "Sleeper (SL)",
        // ---------------------------------
        trainNumber: "13307",
        classCode: "SL",
        quota: "GENERAL",
        ACTime: "10:00:00",
        SLTime: "11:00:00",
        GNTime: "08:00:00",
        passengers:[
            { name: "Rahul", age: "25", gender: "M" }
        ],
        mobile: "9876543210",
        autoUpgrade: false,
        confirmBerths: true,
        insurance: "yes",
        paymentMethod: "UPI",
        noFood: false
    };

    // Load from memory if exists, otherwise use the code default above
    let savedConfig = JSON.parse(localStorage.getItem('BMW_CONFIG')) || {};
    let BMW_CONFIG = { ...DEFAULT_CONFIG, ...savedConfig };
    
    if (!BMW_CONFIG.passengers || BMW_CONFIG.passengers.length === 0) {
        BMW_CONFIG.passengers =[{ name: "", age: "", gender: "M" }];
    }

    // Execution States
    window.loginExecuted = false;
    window.journeyExecuted = false;
    window.trainBooked = false;
    window.passengerExecuted = false; 
    window.captchaSolved = false;
    window.paymentExecuted = false; 

    // ============================================================
    // 1. HELPER FUNCTIONS
    // ============================================================
    function log(msg) { console.log(`[BOT] ${msg}`); }
    
    function updateReqStatus(msg) {
        // Now only prints to console instead of a bulky UI box
        log(`STATUS UPDATE: ${msg}`);
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms < 150 ? ms : (ms * SPEED_MULTIPLIER)));
    const realTimeSleep = (ms) => new Promise(r => setTimeout(r, ms));
    const humanSleep = (ms, jitter = 0) => new Promise(r => setTimeout(r, ms + Math.floor(Math.random() * jitter))); 

    function getElementByXPath(xpath) {
        try { return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; } 
        catch (e) { return null; }
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
            if (!isLoaderVisible) { await sleep(300); return; }
            await sleep(200); 
            waitTime += 200;
        }
    }

    async function typeAndTrigger(element, value) {
        if (!element || value == null || value === "") return;
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

    function isUserLoggedIn() {
        const allTags = document.querySelectorAll('a, button, span, div.h_head1');
        for (let el of allTags) {
            let txt = el.innerText ? el.innerText.trim().toUpperCase() : '';
            if (txt === "LOGOUT" || txt.includes("WELCOME,")) {
                return true;
            }
        }
        return false;
    }

    // ============================================================
    // 2. MINI TIMER UI CREATION (Only shows during TATKAL countdown)
    // ============================================================
    function initMiniTimerUI() {
        if (document.getElementById('bmw-timer-container')) return;
        const target = document.body || document.documentElement;
        if (!target) return;

        const container = document.createElement('div');
        container.id = 'bmw-timer-container';
        // Minimal Top-Right Styling
        container.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            z-index: 9999999; 
            background: rgba(0, 0, 0, 0.9); 
            border: 2px solid #00e5ff; 
            border-radius: 8px; 
            padding: 10px 15px; 
            font-family: 'Courier New', monospace; 
            box-shadow: 0px 4px 15px rgba(0,229,255,0.3); 
            backdrop-filter: blur(5px);
            text-align: center;
            display: none; /* Hidden by default */
        `;
        
        container.innerHTML = `
            <div id="bmw-countdown-title" style="font-size: 12px; color: #00e5ff; margin-bottom: 5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">WAITING...</div>
            <div id="bmw-countdown-time" style="font-size: 24px; font-weight: bold; color: #ff1744; text-shadow: 0 0 10px rgba(255,23,68,0.7); letter-spacing: 2px;">00:00:00.00</div>
        `;
        
        target.appendChild(container);
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

        const timerContainer = document.getElementById('bmw-timer-container');
        const countdownTitle = document.getElementById('bmw-countdown-title');
        const countdownTime = document.getElementById('bmw-countdown-time');

        // Show the timer box
        if (timerContainer && countdownTitle) {
            timerContainer.style.display = 'block';
            countdownTitle.innerText = `${mainTitle} - ${targetTimeStr}`;
        }

        while (true) {
            const current = new Date();
            const diff = targetDate - current;
            
            if (diff <= 0) {
                // Hide the timer box when time is up
                if (timerContainer) timerContainer.style.display = 'none';
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

    // ============================================================
    // 3. INJECTED PHASES (Login & Pure Calendar Click Logic)
    // ============================================================
    
    // LOGIN PHASE
    async function executeLoginPhase() {
        if (window.loginExecuted) return;
        updateReqStatus("EXECUTING LOGIN...");

        let loginTrigger = document.querySelector('.header-fix button') || document.querySelector('a.search_btn.loginText') || document.querySelector('a[aria-label*="Login"]');
        let userInput = document.querySelector('input[formcontrolname="userid"]') || document.querySelector('[aria-label="User Name"]');
        
        if (!userInput && loginTrigger) {
            await humanClick(loginTrigger);
            await sleep(1500);
            userInput = document.querySelector('input[formcontrolname="userid"]') || document.querySelector('[aria-label="User Name"]');
        }

        if (userInput) {
            await typeAndTrigger(userInput, BMW_CONFIG.USERNAME);
            await sleep(300);

            let passInput = document.querySelector('input[formcontrolname="password"]') || document.querySelector('[aria-label="Password"]');
            if (passInput) {
                await typeAndTrigger(passInput, BMW_CONFIG.PASSWORD);
                await sleep(300);
            }

            let signInBtn = Array.from(document.querySelectorAll('app-login button')).find(b => b.innerText.includes('SIGN IN'));
            if (signInBtn) {
                await humanClick(signInBtn);
                window.loginExecuted = true;
            }
        }
    }

    // JOURNEY DETAILS PHASE
    async function executeJourneyFillPhase() {
        if (window.journeyExecuted) return;
        updateReqStatus("FILLING JOURNEY DETAILS...");

        await waitFor('p-autocomplete[formcontrolname="origin"] input', 10000);

        // 1. FROM Station
        let fromBox = document.querySelector('p-autocomplete[formcontrolname="origin"] input') || document.querySelector('[aria-label*="From station"]');
        if (fromBox) {
            fromBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await typeAndTrigger(fromBox, BMW_CONFIG.FROM_CODE);
            await sleep(500);
            fromBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
            await sleep(400);
        }

        // 2. TO Station
        let toBox = document.querySelector('p-autocomplete[formcontrolname="destination"] input') || document.querySelector('[aria-label*="To station"]');
        if (toBox) {
            toBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await typeAndTrigger(toBox, BMW_CONFIG.TO_CODE);
            await sleep(500);
            toBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
            await sleep(400);
        }

        // 3. DATE - (100% PURE CALENDAR CLICK LOGIC - NO TYPING)
        let dateBox = document.querySelector('p-calendar[formcontrolname="journeyDate"] input');
        if (dateBox) {
            updateReqStatus("SELECTING DATE FROM CALENDAR...");
            dateBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await humanClick(dateBox);
            await sleep(800); // Wait for calendar popup to appear completely

            try {
                const parts = BMW_CONFIG.DATE_DMY.split('/');
                const targetDay = parseInt(parts[0], 10).toString(); // e.g. "04" becomes "4"
                const targetMonthIdx = parseInt(parts[1], 10) - 1; // e.g. "04" becomes 3 (April)
                const targetYear = parseInt(parts[2], 10); // e.g. 2026
                const monthNames =["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                
                // Max 24 steps to find the month, exactly like your python code
                for(let i=0; i<24; i++) {
                    let monthEl = document.querySelector('.ui-datepicker-month');
                    let yearEl = document.querySelector('.ui-datepicker-year');
                    
                    if(!monthEl || !yearEl) {
                        await sleep(500);
                        continue;
                    }

                    let currentMonthStr = monthEl.innerText.trim();
                    let currentYear = parseInt(yearEl.innerText.trim(), 10);
                    let currentMonthIdx = monthNames.findIndex(m => m.toLowerCase() === currentMonthStr.toLowerCase());

                    if (currentMonthIdx === -1) continue;

                    let currentVal = currentYear * 12 + currentMonthIdx;
                    let targetVal = targetYear * 12 + targetMonthIdx;

                    if (currentVal === targetVal) {
                        // Correct Month and Year Found! Now find the Exact Day
                        let dayCells = document.querySelectorAll('td:not(.ui-datepicker-other-month) a.ui-state-default');
                        for(let cell of dayCells) {
                            if(cell.innerText.trim() === targetDay) {
                                await humanClick(cell); 
                                await sleep(600);
                                break;
                            }
                        }
                        break; 
                    } else if (currentVal < targetVal) {
                        // Current date is before target date, click NEXT
                        let nextBtn = document.querySelector('a.ui-datepicker-next');
                        if(nextBtn) {
                            await humanClick(nextBtn);
                            await sleep(800); // Wait for IRCTC calendar to animate
                        } else { break; }
                    } else {
                        // Current date is after target date, click PREV
                        let prevBtn = document.querySelector('a.ui-datepicker-prev');
                        if(prevBtn) {
                            await humanClick(prevBtn);
                            await sleep(800); // Wait for IRCTC calendar to animate
                        } else { break; }
                    }
                }
            } catch(e) {
                console.log("Calendar selection error:", e);
            }
        }

        // 4. CLASS
        let classDropdown = Array.from(document.querySelectorAll('p-dropdown')).find(el => el.getAttribute('formcontrolname') === 'journeyClass');
        if (classDropdown) {
            let trigger = classDropdown.querySelector('.ui-dropdown-trigger');
            if (trigger) {
                trigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await humanClick(trigger);
                await sleep(500);
                let options = document.querySelectorAll('p-dropdownitem li span');
                let targetClass = Array.from(options).find(el => el.innerText.trim() === BMW_CONFIG.CLASS_NAME);
                if (targetClass) {
                    await humanClick(targetClass);
                    await sleep(300);
                }
            }
        }

        // 5. QUOTA
        let quotaDropdown = Array.from(document.querySelectorAll('p-dropdown')).find(el => el.getAttribute('formcontrolname') === 'journeyQuota');
        if (quotaDropdown) {
            let trigger = quotaDropdown.querySelector('.ui-dropdown-trigger');
            if (trigger) {
                trigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await humanClick(trigger);
                await sleep(500);
                let options = document.querySelectorAll('p-dropdownitem li span');
                let targetQuota = Array.from(options).find(el => el.innerText.trim().toUpperCase() === BMW_CONFIG.quota.toUpperCase());
                if (targetQuota) {
                    await humanClick(targetQuota);
                    await sleep(300);
                }
            }
        }

        // 6. SEARCH BUTTON
        let searchBtn = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Search'));
        if (searchBtn) {
            searchBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            updateReqStatus("CLICKING SEARCH...");
            await humanClick(searchBtn);
            window.journeyExecuted = true;
            await sleep(2000);
        }
    }

    // ============================================================
    // 4. PRE-EXISTING PHASE EXECUTORS
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
                if (document.querySelector('app-passenger-input') || window.location.href.includes('passenger') || window.location.href.includes('psgninput')) {
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
                        if (document.querySelector('app-passenger-input') || window.location.href.includes('passenger') || window.location.href.includes('psgninput')) {
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

    async function executePassengerPhase() {
        if (window.passengerExecuted) return;
        updateReqStatus("INJECTING PASSENGER DETAILS...");
        await waitFor('app-passenger', 5000);
        await humanSleep(300, 200);

        let validPassengers = BMW_CONFIG.passengers.filter(p => p.name.trim() !== "");
        if (validPassengers.length === 0) {
            updateReqStatus("NO PASSENGER DATA SET!");
            return;
        }

        for (let i = 0; i < validPassengers.length; i++) {
            let p = validPassengers[i];
            updateReqStatus(`FILLING PASSENGER #${i+1}...`);
            if (i > 0) {
                let addBtnXpath = "//span[contains(text(),'+ Add Passenger')] | //a[contains(text(),'+ Add Passenger')]";
                let addBtn = getElementByXPath(addBtnXpath);
                if (addBtn) {
                    addBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await humanClick(addBtn);
                    await humanSleep(300, 100);
                }
            }
            let forms = document.querySelectorAll('app-passenger');
            let form = forms[i];
            if (!form) continue;

            let nameInput = form.querySelector('p-autocomplete input, input[formcontrolname="passengerName"], input[placeholder="Passenger Name"]');
            if (nameInput) {
                nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await typeAndTrigger(nameInput, p.name);
            }
            let ageInput = form.querySelector('input[formcontrolname="passengerAge"], input[placeholder="Age"]');
            if (ageInput) {
                await typeAndTrigger(ageInput, p.age.toString());
            }
            let genderSelect = form.querySelector('select[formcontrolname="passengerGender"]');
            if (genderSelect) {
                genderSelect.value = p.gender;
                genderSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            await humanSleep(150, 100);
        }

        updateReqStatus("FILLING CONTACT & PREFERENCES...");
        let mobileInput = document.querySelector('input[formcontrolname="mobileNumber"]');
        if (mobileInput && BMW_CONFIG.mobile) {
            mobileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await typeAndTrigger(mobileInput, BMW_CONFIG.mobile);
        }

        if (BMW_CONFIG.autoUpgrade) {
            let autoUpLabel = Array.from(document.querySelectorAll('label')).find(el => el.innerText.includes('Consider for Auto Upgradation'));
            if (autoUpLabel) {
                let checkbox = autoUpLabel.parentElement.querySelector('input[type="checkbox"]');
                if (checkbox && !checkbox.checked) await humanClick(autoUpLabel);
            }
        }
        if (BMW_CONFIG.confirmBerths) {
            let cbLabel = Array.from(document.querySelectorAll('label')).find(el => el.innerText.includes('Book only if confirm berths'));
            if (cbLabel) {
                let checkbox = cbLabel.parentElement.querySelector('input[type="checkbox"]');
                if (checkbox && !checkbox.checked) await humanClick(cbLabel);
            }
        }
        if (BMW_CONFIG.insurance.toLowerCase() === 'yes') {
            let insLabel = Array.from(document.querySelectorAll('label')).find(el => el.innerText.includes('Yes, and I accept the') || el.innerText.includes('Yes, I want travel insurance'));
            if (insLabel) {
                let radio = insLabel.parentElement.querySelector('input[type="radio"]');
                if (radio && !radio.checked) await humanClick(insLabel);
            }
        } else {
            let insLabel = Array.from(document.querySelectorAll('label')).find(el => el.innerText.includes('No, I don\'t want travel'));
            if (insLabel) {
                let radio = insLabel.parentElement.querySelector('input[type="radio"]');
                if (radio && !radio.checked) await humanClick(insLabel);
            }
        }
        if (BMW_CONFIG.noFood) {
            let noFoodLabel = Array.from(document.querySelectorAll('label')).find(el => el.innerText.includes("I don't want Food/Beverages"));
            if (noFoodLabel) {
                noFoodLabel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                let checkbox = noFoodLabel.parentElement.querySelector('input[type="checkbox"]');
                if (checkbox && !checkbox.checked) {
                    await humanClick(noFoodLabel);
                    await humanSleep(800, 200);
                    let okBtn = Array.from(document.querySelectorAll('p-footer button, div.ui-dialog-footer button')).find(el => el.innerText.includes('OK'));
                    if (okBtn) await humanClick(okBtn);
                }
            }
        }

        if (BMW_CONFIG.paymentMethod === 'UPI') {
            let upiRadioBox = document.querySelector('tr:nth-of-type(2) div.ui-radiobutton-box');
            if (upiRadioBox) {
                upiRadioBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await humanClick(upiRadioBox);
            }
        } else {
            let cardRadioBox = document.querySelector('tr:nth-of-type(1) div.ui-radiobutton-box');
            if (cardRadioBox) {
                cardRadioBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await humanClick(cardRadioBox);
            }
        }

        updateReqStatus("FINAL REVIEW & SUBMIT...");
        window.scrollBy(0, -300);
        await humanSleep(300, 200);
        window.scrollBy(0, 300);
        await humanSleep(200, 100);

        let continueBtn = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Continue'));
        if (continueBtn) {
            continueBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await humanClick(continueBtn);
            window.passengerExecuted = true;
            updateReqStatus("PASSENGERS SUBMITTED!");
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
        } catch (e) { return false; }
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
                while (retries < 20 && captchaImg.src.length < 100) { await sleep(200); retries++; }

                if (lastCaptchaSrc && captchaImg.src === lastCaptchaSrc) {
                    await sleep(500); continue; 
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
                                errorFound = true; break; 
                            }
                            if (document.querySelector('.bank-type') || window.location.href.includes('payment')) {
                                localCaptchaSolved = true; break;
                            }
                            await sleep(200); checkTimer += 200;
                        }
                        if (localCaptchaSolved) break;
                        if (errorFound) {
                            await typeAndTrigger(captchaInput, '');
                            await sleep(1000); continue;
                        }
                    } else { await sleep(300); }
                } else { await sleep(300); }
            } else { await sleep(300); }
        }
        if(localCaptchaSolved) {
            window.captchaSolved = true;
            updateReqStatus("CAPTCHA DONE. PAYMENT PAGE LOADED.");
        }
    }

    async function executePaymentPhase() {
        if (window.paymentExecuted) return;
        updateReqStatus("AUTO SELECTING PAYMENT GATEWAY...");
        await waitFor('app-payment', 5000);
        await humanSleep(180, 100); 

        const step1Xpath = '//*[@id="pay-type"]/span/div[3]/span';
        let step1El = getElementByXPath(step1Xpath) || Array.from(document.querySelectorAll('span')).find(el => el.innerText.trim() === 'BHIM/ UPI/ USSD');
        if (step1El) {
            await humanClick(step1El);
            await humanSleep(230, 150); 
        }
        const step2Xpath = '//*[@id="psgn-form"]/div[1]/div[1]/app-payment/div[1]/div/form/p-sidebar[2]/div/div/div[2]/button';
        let step2El = getElementByXPath(step2Xpath) || Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Continue');
        if (step2El && window.getComputedStyle(step2El).display !== 'none') {
            await humanClick(step2El);
            await humanSleep(215, 150);
        }

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
    // 5. MAIN ORCHESTRATOR LOOP (SPA Router) - AUTO-RUNNING
    // ============================================================
    async function mainLoop() {
        initMiniTimerUI();

        while (true) {
            const url = window.location.href;
            
            if (url.includes('train-search') || url === 'https://www.irctc.co.in/nget/' || url.endsWith('nget/')) {
                let isLoggedIn = isUserLoggedIn(); 
                
                if (!isLoggedIn) {
                    if (!window.loginExecuted) {
                        await executeLoginPhase();
                    } else {
                        updateReqStatus("WAITING / SOLVE LOGIN CAPTCHA...");
                    }
                } else {
                    if (!window.journeyExecuted) {
                        await executeJourneyFillPhase();
                    } else {
                        updateReqStatus("JOURNEY DETAILS FILLED. WAITING...");
                    }
                }

                window.trainBooked = false; 
                window.passengerExecuted = false; 
                window.captchaSolved = false;
                window.paymentExecuted = false; 
            }
            else if (url.includes('booking/train-list')) {
                if (!window.trainBooked) {
                    if (BMW_CONFIG.trainNumber && BMW_CONFIG.classCode) {
                        await executeTrainListPhase();
                    }
                }
            }
            else if (url.includes('booking/psgninput') || url.includes('passenger')) {
                if (!window.passengerExecuted) {
                    await executePassengerPhase();
                }
            }
            else if (url.includes('booking/reviewBooking')) {
                if (!window.captchaSolved) {
                    await executeReviewPhase();
                }
            }
            else if (url.includes('payment/bkgPaymentOptions') || url.includes('payment')) {
                if (!window.paymentExecuted) {
                    await executePaymentPhase(); 
                }
            }
            
            await sleep(1000);
        }
    }

    mainLoop().catch(e => {
        console.error(e);
        log(`CRITICAL ERROR: ${e.message}`);
    });

})();
