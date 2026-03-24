(async function() {
    'use strict';

    if (window.BMW_RUNNING) return;
    window.BMW_RUNNING = true;

    console.log("BMW PRO Automation Started with Advanced Login Detection, Python Calendar Logic & Passenger Injector!");

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
    // 0. DYNAMIC CONFIGURATION (Login, Journey & Tatkal Setup)
    // ============================================================
    const DEFAULT_CONFIG = {
        // ---- LOGIN & JOURNEY DETAILS ----
        USERNAME: "Babu123s",
        PASSWORD: "g6gf77TN4tA54k#",
        FROM_CODE: "BSB",
        TO_CODE: "CSMT",
        DATE_DMY: "20/10/2025",
        CLASS_NAME: "Sleeper (SL)",
        // ---------------------------------
        trainNumber: "13307",
        classCode: "SL",
        quota: "TATKAL",
        ACTime: "09:59:00",
        SLTime: "10:59:00",
        GNTime: "07:59:00",
        passengers:[
            { name: "", age: "", gender: "M" }
        ],
        mobile: "",
        autoUpgrade: true,
        confirmBerths: true,
        insurance: "yes",
        paymentMethod: "UPI",
        noFood: false
    };

    let savedConfig = JSON.parse(localStorage.getItem('BMW_CONFIG')) || {};
    let BMW_CONFIG = { ...DEFAULT_CONFIG, ...savedConfig };
    
    if (!BMW_CONFIG.passengers || BMW_CONFIG.passengers.length === 0) {
        BMW_CONFIG.passengers =[{ name: "", age: "", gender: "M" }];
    }

    function saveConfig() {
        localStorage.setItem('BMW_CONFIG', JSON.stringify(BMW_CONFIG));
    }

    window.automationStarted = false; 
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
        log(`STATUS UPDATE: ${msg}`);
        const statusEl = document.getElementById('bmw-current-status');
        if (statusEl) {
            statusEl.innerText = msg;
        }
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
    // 2. UI CREATION 
    // ============================================================
    function initBMWUI() {
        if (document.getElementById('bmw-status-container')) return;
        const target = document.body || document.documentElement;
        if (!target) return;

        const container = document.createElement('div');
        container.id = 'bmw-status-container';
        container.innerHTML = `
            <div style="position: fixed; top: 15px; right: 15px; z-index: 9999998; background: rgba(0, 0, 0, 0.9); border-radius: 8px; font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #00ff00; width: 280px; box-shadow: 0px 4px 15px rgba(0,255,0,0.3); backdrop-filter: blur(5px); overflow: hidden;">
                <div style="display:flex; justify-content: space-between; align-items:center; background: #111; padding: 10px 15px; border-bottom: 1px solid #00ff00;">
                    <div style="font-size: 14px; font-weight: bold; color: #00ff00; letter-spacing: 1px;">BMW PRO</div>
                    <div style="display:flex; gap: 5px;">
                        <button id="bmw-start-btn" style="background: #007bff; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-weight: bold; cursor: pointer; box-shadow: 0 0 5px #007bff; font-size:12px; transition: 0.2s;">START</button>
                        <button id="bmw-save-btn" style="background: #28a745; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-weight: bold; cursor: pointer; box-shadow: 0 0 5px #28a745; font-size:12px; transition: 0.2s;">SAVE</button>
                        <button id="bmw-toggle-btn" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 4px 8px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size:12px; transition: 0.2s;" title="Toggle Inputs">▼</button>
                    </div>
                </div>
                <div id="bmw-inputs-section" style="display: none; padding: 10px; max-height: 450px; overflow-y: auto;">
                    <div style="margin-bottom: 10px; display:flex; justify-content: space-between; gap: 8px;">
                        <input type="text" id="bmw-status-train" placeholder="Train No" value="${BMW_CONFIG.trainNumber}" style="width:50%; background:#222; color:#0f0; border:1px solid #444; border-radius:4px; padding:6px; font-size:12px; font-weight:bold; text-align:center; outline:none;">
                        <select id="bmw-status-class" style="width:50%; background:#222; color:#0f0; border:1px solid #444; border-radius:4px; padding:6px; font-size:12px; font-weight:bold; outline:none;">
                            <option value="SL">SL</option><option value="1A">1A</option><option value="2A">2A</option>
                            <option value="3A">3A</option><option value="3E">3E</option><option value="CC">CC</option>
                            <option value="EC">EC</option><option value="2S">2S</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <select id="bmw-status-quota" style="width:100%; background:#222; color:#0f0; border:1px solid #444; border-radius:4px; padding:6px; font-size:12px; font-weight:bold; outline:none;">
                            <option value="GENERAL">GENERAL</option>
                            <option value="TATKAL">TATKAL</option>
                            <option value="PREMIUM TATKAL">PREMIUM TATKAL</option>
                        </select>
                    </div>
                    <div style="border-top: 1px dashed #00ff00; padding-top: 10px; margin-top: 5px;">
                        <div style="font-size:12px; font-weight:bold; color:#0f0; margin-bottom:5px;">PASSENGERS (Max 6)</div>
                        <div id="bmw-psgn-list"></div>
                        <button id="bmw-add-psgn-btn" style="width:100%; margin-top:5px; background:#444; color:#0f0; border:1px solid #0f0; padding:4px; font-size:11px; cursor:pointer;">+ ADD PASSENGER</button>
                    </div>
                    <div style="border-top: 1px dashed #00ff00; padding-top: 10px; margin-top: 10px; display:flex; flex-direction:column; gap:6px;">
                        <input id="bmw-psgn-mobile" type="text" placeholder="Mobile Number" value="${BMW_CONFIG.mobile}" style="width:100%; background:#222; color:#0f0; border:1px solid #444; padding:5px; font-size:11px;">
                        <label style="color:#fff; font-size:11px; display:flex; align-items:center; gap:5px;"><input type="checkbox" id="bmw-psgn-auto" ${BMW_CONFIG.autoUpgrade?'checked':''}> Auto Upgradation</label>
                        <label style="color:#fff; font-size:11px; display:flex; align-items:center; gap:5px;"><input type="checkbox" id="bmw-psgn-confirm" ${BMW_CONFIG.confirmBerths?'checked':''}> Confirm Berths Only</label>
                        <label style="color:#fff; font-size:11px; display:flex; align-items:center; gap:5px;"><input type="checkbox" id="bmw-psgn-nofood" ${BMW_CONFIG.noFood?'checked':''}> I don't want Food</label>
                        <select id="bmw-psgn-ins" style="width:100%; background:#222; color:#0f0; border:1px solid #444; padding:5px; font-size:11px;">
                            <option value="yes" ${BMW_CONFIG.insurance === 'yes' ? 'selected' : ''}>Travel Insurance: YES</option>
                            <option value="no" ${BMW_CONFIG.insurance === 'no' ? 'selected' : ''}>Travel Insurance: NO</option>
                        </select>
                        <select id="bmw-psgn-pay" style="width:100%; background:#222; color:#0f0; border:1px solid #444; padding:5px; font-size:11px;">
                            <option value="UPI" ${BMW_CONFIG.paymentMethod === 'UPI' ? 'selected' : ''}>Payment: BHIM/UPI</option>
                            <option value="Card" ${BMW_CONFIG.paymentMethod === 'Card' ? 'selected' : ''}>Payment: CARD/NET BANKING</option>
                        </select>
                    </div>
                </div>
                <div style="padding: 10px 15px; background: rgba(0, 20, 0, 0.6); border-top: 1px solid #00ff00; text-align: center; min-height: 55px; display: flex; flex-direction: column; justify-content: center;">
                    <div id="bmw-status-wrapper">
                        <div style="font-size: 11px; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">Current Process</div>
                        <div id="bmw-current-status" style="font-size: 13px; font-weight: bold; color: #ffeb3b; word-wrap: break-word;">Waiting to Start...</div>
                    </div>
                    <div id="bmw-timer-wrapper" style="display: none;">
                        <div id="bmw-countdown-title" style="font-size: 11px; color: #00e5ff; margin-bottom: 4px; font-weight: bold; text-transform: uppercase;"></div>
                        <div id="bmw-countdown-time" style="font-size: 22px; font-weight: bold; color: #ff1744; text-shadow: 0 0 8px rgba(255,23,68,0.6); letter-spacing: 2px; font-family: 'Courier New', monospace;"></div>
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

        document.getElementById('bmw-start-btn').addEventListener('click', () => {
            window.automationStarted = true;
            document.getElementById('bmw-start-btn').style.background = '#dc3545';
            document.getElementById('bmw-start-btn').innerText = 'RUNNING';
            updateReqStatus("AUTOMATION STARTED!");
        });

        function renderPsgnList() {
            const list = document.getElementById('bmw-psgn-list');
            list.innerHTML = '';
            BMW_CONFIG.passengers.forEach((p, idx) => {
                const row = document.createElement('div');
                row.style = "display:flex; gap:3px; margin-bottom:5px; width:100%;";
                row.innerHTML = `
                    <input class="p-name" type="text" placeholder="Name" value="${p.name}" style="width:45%; font-size:11px; padding:3px; background:#222; color:#0f0; border:1px solid #444; outline:none;">
                    <input class="p-age" type="number" placeholder="Age" value="${p.age}" style="width:20%; font-size:11px; padding:3px; background:#222; color:#0f0; border:1px solid #444; outline:none;">
                    <select class="p-gender" style="width:20%; font-size:11px; padding:3px; background:#222; color:#0f0; border:1px solid #444; outline:none;">
                        <option value="M" ${p.gender==='M'?'selected':''}>M</option>
                        <option value="F" ${p.gender==='F'?'selected':''}>F</option>
                        <option value="T" ${p.gender==='T'?'selected':''}>T</option>
                    </select>
                    <button class="p-remove" data-idx="${idx}" style="width:15%; background:#d32f2f; color:white; border:none; cursor:pointer; font-weight:bold; border-radius:2px;">X</button>
                `;
                list.appendChild(row);
            });

            document.querySelectorAll('.p-name').forEach((el, i) => el.addEventListener('input', e => { BMW_CONFIG.passengers[i].name = e.target.value; }));
            document.querySelectorAll('.p-age').forEach((el, i) => el.addEventListener('input', e => { BMW_CONFIG.passengers[i].age = e.target.value; }));
            document.querySelectorAll('.p-gender').forEach((el, i) => el.addEventListener('change', e => { BMW_CONFIG.passengers[i].gender = e.target.value; }));
            
            document.querySelectorAll('.p-remove').forEach(el => {
                el.addEventListener('click', e => {
                    const idx = parseInt(e.target.getAttribute('data-idx'));
                    BMW_CONFIG.passengers.splice(idx, 1);
                    renderPsgnList();
                });
            });
        }
        
        renderPsgnList();

        document.getElementById('bmw-add-psgn-btn').addEventListener('click', () => {
            if (BMW_CONFIG.passengers.length >= 6) {
                alert("Maximum 6 passengers allowed");
                return;
            }
            BMW_CONFIG.passengers.push({ name: "", age: "", gender: "M" });
            renderPsgnList();
        });

        document.getElementById('bmw-status-train').addEventListener('input', (e) => { BMW_CONFIG.trainNumber = e.target.value; });
        document.getElementById('bmw-status-class').addEventListener('change', (e) => { BMW_CONFIG.classCode = e.target.value; });
        document.getElementById('bmw-status-quota').addEventListener('change', (e) => { BMW_CONFIG.quota = e.target.value; });
        
        document.getElementById('bmw-save-btn').addEventListener('click', () => {
            BMW_CONFIG.trainNumber = document.getElementById('bmw-status-train').value.trim();
            BMW_CONFIG.classCode = document.getElementById('bmw-status-class').value;
            BMW_CONFIG.quota = document.getElementById('bmw-status-quota').value;
            BMW_CONFIG.mobile = document.getElementById('bmw-psgn-mobile').value.trim();
            BMW_CONFIG.autoUpgrade = document.getElementById('bmw-psgn-auto').checked;
            BMW_CONFIG.confirmBerths = document.getElementById('bmw-psgn-confirm').checked;
            BMW_CONFIG.noFood = document.getElementById('bmw-psgn-nofood').checked;
            BMW_CONFIG.insurance = document.getElementById('bmw-psgn-ins').value;
            BMW_CONFIG.paymentMethod = document.getElementById('bmw-psgn-pay').value;

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

    // ============================================================
    // 3. INJECTED PHASES (Login & Calendar Navigation Journey Auto-Fill)
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

        // 3. DATE - (Python Translation: Calendar Navigation -> Click -> Typing Tab Fallback)
        let dateBox = document.querySelector('p-calendar[formcontrolname="journeyDate"] input');
        if (dateBox) {
            dateBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await humanClick(dateBox);
            await sleep(400);

            let dateSet = false;
            try {
                const parts = BMW_CONFIG.DATE_DMY.split('/');
                if (parts.length === 3) {
                    const targetDay = parseInt(parts[0], 10).toString(); // "05" -> "5"
                    const targetMonthIdx = parseInt(parts[1], 10) - 1; // "10" -> 9 (October)
                    const targetYear = parseInt(parts[2], 10); // "2025"
                    const monthNames =["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    const targetMonthName = monthNames[targetMonthIdx];

                    // Loop to navigate months, just like python script (Max 24 steps)
                    for(let i=0; i<24; i++) {
                        let calRoot = document.querySelector('.ui-datepicker');
                        if(!calRoot) break;

                        let currentMonthEl = calRoot.querySelector('.ui-datepicker-month');
                        let currentYearEl = calRoot.querySelector('.ui-datepicker-year');
                        if(!currentMonthEl || !currentYearEl) break;

                        let currentMonth = currentMonthEl.innerText.trim();
                        let currentYear = parseInt(currentYearEl.innerText.trim(), 10);

                        // If we are on the target Month & Year
                        if(currentMonth.toLowerCase() === targetMonthName.toLowerCase() && currentYear === targetYear) {
                            // Find the specific Day cell and Click
                            let dayCells = calRoot.querySelectorAll('td:not(.ui-datepicker-other-month) > a.ui-state-default');
                            for(let dayCell of dayCells) {
                                if(dayCell.innerText.trim() === targetDay) {
                                    await humanClick(dayCell); // Perfect Calendar Date Click!
                                    await sleep(400);
                                    dateSet = true;
                                    break;
                                }
                            }
                            break;
                        } else {
                            // Navigate to target month
                            let currentDate = new Date(`${currentMonth} 1, ${currentYear}`);
                            let targetDate = new Date(`${targetMonthName} 1, ${targetYear}`);
                            let btn = targetDate > currentDate ? calRoot.querySelector('a.ui-datepicker-next') : calRoot.querySelector('a.ui-datepicker-prev');
                            if(btn) {
                                await humanClick(btn);
                                await sleep(300);
                            } else {
                                break;
                            }
                        }
                    }
                }
            } catch(e) {
                console.log("Calendar selection error:", e);
            }

            // Fallback: Agar kisi wajah se click fail ho jaye (Same as Python typing fallback)
            if (!dateSet) {
                updateReqStatus("TYPING DATE FALLBACK...");
                dateBox.value = '';
                dateBox.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(200);

                await typeAndTrigger(dateBox, BMW_CONFIG.DATE_DMY);
                await sleep(400);

                // CRUCIAL TAB PRESS FOR ANGULAR TO REGISTER IT
                dateBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
                await sleep(100);
                dateBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
                document.body.click(); 
                await sleep(400);
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
    // 5. MAIN ORCHESTRATOR LOOP (SPA Router)
    // ============================================================
    async function mainLoop() {
        initBMWUI();

        while (true) {
            const url = window.location.href;
            const uiContainer = document.getElementById('bmw-status-container');
            
            if (url.includes('payment/bkgPaymentOptions') || url.includes('payment')) {
                if (uiContainer) uiContainer.style.display = 'none';
            } else {
                if (uiContainer) uiContainer.style.display = 'block';
            }

            if (!window.automationStarted) {
                updateReqStatus("READY. CLICK 'START' TO BEGIN.");
                await sleep(1000);
                continue;
            }
            
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
                    } else {
                        updateReqStatus("ENTER TRAIN NUMBER!");
                    }
                } else {
                    updateReqStatus("BOOKED! WAITING NEXT PAGE...");
                }
            }
            else if (url.includes('booking/psgninput') || url.includes('passenger')) {
                if (!window.passengerExecuted) {
                    await executePassengerPhase();
                } else {
                    updateReqStatus("WAITING FOR REVIEW PAGE...");
                }
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
                    await executePaymentPhase(); 
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

    mainLoop().catch(e => {
        console.error(e);
        log(`CRITICAL ERROR: ${e.message}`);
    });

})();
