(async function() {
    'use strict';

    if (window.__ext_init_chk__) return;
    window.__ext_init_chk__ = true;

    let SPEED_MULTIPLIER = 1;
    let REDSTAR_CONFIG = { passengers: [] };

    const STATE = {
        trainBooked: false,
        captchaSolved: false,
        paymentExecuted: false, 
        pgPhonePeExecuted: false, 
        loginSequenceDone: false, 
        passengerSequenceDone: false, 
        allPassengersFilled: false, 
        preferencesSequenceDone: false
    };

    async function loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['desiDaruCfg'], (res) => {
                if(res.desiDaruCfg) {
                    REDSTAR_CONFIG = res.desiDaruCfg;
                }
                resolve();
            });
        });
    }

    chrome.storage.onChanged.addListener((changes) => {
        if (changes.desiDaruCfg) {
            REDSTAR_CONFIG = changes.desiDaruCfg.newValue;
            STATE.loginSequenceDone = false;
            STATE.passengerSequenceDone = false;
            STATE.allPassengersFilled = false;
            STATE.preferencesSequenceDone = false;
            document.querySelectorAll('[data-rs-filled-complete]').forEach(el => delete el.dataset.rsFilledComplete);
            document.querySelectorAll('[data-rs-journey-filled]').forEach(el => delete el.dataset.rsJourneyFilled);
        }
    });

    let timerShadow = null;
    function initTimerUI() {
        if (document.getElementById('__rs_timer_host__')) return;
        const host = document.createElement('div');
        host.id = '__rs_timer_host__';
        host.style.cssText = "position: fixed; top: 15px; right: 15px; z-index: 2147483647; pointer-events: none;";
        document.documentElement.appendChild(host);

        timerShadow = host.attachShadow({ mode: 'open' });
        timerShadow.innerHTML = `
            <div id="redstar-timer-box" style="display: none; background: rgba(0, 0, 0, 0.9); padding: 12px; border-radius: 6px; border: 1px solid #00ff00; text-align: center; box-shadow: 0 0 8px rgba(0,255,0,0.4); min-width: 130px;">
                <div id="rs-timer-title" style="color: #fff; font-size: 11px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;"></div>
                <div id="rs-timer-time" style="color: #ff1744; font-size: 18px; font-weight: bold; letter-spacing: 1px; font-family: 'Courier New', monospace; text-shadow: 0 0 5px rgba(255,23,68,0.5);"></div>
            </div>
        `;
    }

    // ============================================================
    // 1. ADVANCED AI STEALTH EMULATORS (THE WAF BYPASS)
    // ============================================================
    const sleep = (ms) => new Promise(r => setTimeout(r, ms < 50 ? ms : (ms * SPEED_MULTIPLIER)));

    async function randomSleep(min, max) {
        const randomTime = Math.floor(Math.random() * (max - min + 1)) + min;
        await sleep(randomTime);
    }

    async function waitForSpinner() {
        const loaderSelectors =['div.ngx-spinner-overlay', 'div.loading-backdrop', '#loaderP'];
        let isLoading = true;
        let checkCount = 0;
        while (isLoading && checkCount < 100) { 
            isLoading = false;
            for (const sel of loaderSelectors) {
                const el = document.querySelector(sel);
                if (el && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden' && window.getComputedStyle(el).opacity !== '0') {
                    isLoading = true; break;
                }
            }
            if (isLoading) await sleep(50); 
            checkCount++;
        }
    }

    // Helper to get random points inside an element
    function getStealthCoords(el) {
        const rect = el.getBoundingClientRect();
        const x = rect.left + (rect.width * (0.4 + Math.random() * 0.2));
        const y = rect.top + (rect.height * (0.4 + Math.random() * 0.2));
        return { clientX: x, clientY: y, screenX: x, screenY: y, bubbles: true, cancelable: true, view: window };
    }

    // ✨ GHOST TYPER: This fakes the entire keyboard hardware layer ✨
    async function ghostType(element, text) {
        if (!element || typeof text === 'undefined') return;
        
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await randomSleep(100, 200);
        
        const coords = getStealthCoords(element);
        element.dispatchEvent(new PointerEvent('pointerdown', coords));
        element.dispatchEvent(new MouseEvent('mousedown', coords));
        element.focus();
        element.dispatchEvent(new PointerEvent('pointerup', coords));
        element.dispatchEvent(new MouseEvent('mouseup', coords));
        element.dispatchEvent(new MouseEvent('click', coords));

        await randomSleep(100, 200);

        // Native setter needed for Angular
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        let currentValue = "";

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const keyCode = char.charCodeAt(0);

            // Hardware keydown
            element.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: `Key${char.toUpperCase()}`, keyCode: keyCode, bubbles: true, cancelable: true }));
            element.dispatchEvent(new KeyboardEvent('keypress', { key: char, code: `Key${char.toUpperCase()}`, keyCode: keyCode, bubbles: true, cancelable: true }));

            currentValue += char;
            nativeSetter.call(element, currentValue);

            // The exact InputEvent structure Angular expects
            const inputEvent = new InputEvent('input', { data: char, inputType: 'insertText', bubbles: true, composed: true });
            element.dispatchEvent(inputEvent);

            // Hardware keyup
            element.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: `Key${char.toUpperCase()}`, keyCode: keyCode, bubbles: true, cancelable: true }));
            
            // Jittery typing speed like a real human
            await randomSleep(15, 60); 
        }

        await randomSleep(100, 300);
        element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        element.blur();
    }

    // ✨ STEALTH CLICKER: Emulates modern touch/mouse hybrid interactions ✨
    async function stealthClick(el) {
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await randomSleep(150, 300);

        const coords = getStealthCoords(el);
        
        // Approach
        el.dispatchEvent(new PointerEvent('pointerenter', coords));
        el.dispatchEvent(new MouseEvent('mouseenter', coords));
        el.dispatchEvent(new PointerEvent('pointermove', coords));
        el.dispatchEvent(new MouseEvent('mousemove', coords));
        
        await randomSleep(50, 150); 

        // Press
        coords.buttons = 1;
        el.dispatchEvent(new PointerEvent('pointerdown', coords));
        el.dispatchEvent(new MouseEvent('mousedown', coords));
        
        await randomSleep(40, 100); // Holding the click

        // Release
        coords.buttons = 0;
        el.dispatchEvent(new PointerEvent('pointerup', coords));
        el.dispatchEvent(new MouseEvent('mouseup', coords));
        
        // Final Execute
        el.click(); 
    }

    async function selectGender(element, genderValue) {
        if (!element) return;
        
        if (REDSTAR_CONFIG.manualGender) {
            // ... (Existing manual logic)
            return;
        }

        if (element.tagName === 'SELECT') {
            element.focus();
            await randomSleep(100, 300); 
            element.value = genderValue;
            element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            await randomSleep(100, 300);
            element.blur();
            return;
        }

        await stealthClick(element); 
        await randomSleep(200, 400); 
        const options = document.querySelectorAll('p-dropdownitem li span, .ui-dropdown-items li span');
        let targetText = genderValue === 'M' ? 'Male' : (genderValue === 'F' ? 'Female' : 'Transgender');

        for (let opt of options) {
            if (opt.innerText.trim().toLowerCase() === targetText.toLowerCase()) {
                await randomSleep(100, 250); 
                await stealthClick(opt);
                break;
            }
        }
    }

    async function selectDateInCalendar(dateInput, targetDateString) {
        if (!targetDateString) return;
        let parts = targetDateString.split('/');
        if (parts.length !== 3) { await ghostType(dateInput, targetDateString); return; }
        
        let tDay = parseInt(parts[0], 10);
        let tMonth = parseInt(parts[1], 10);
        let tYear = parseInt(parts[2], 10);

        await stealthClick(dateInput); 
        await randomSleep(100, 200);

        for (let loop = 0; loop < 15; loop++) {
            let monthEl = document.querySelector('.ui-datepicker-month, .p-datepicker-month');
            let yearEl = document.querySelector('.ui-datepicker-year, .p-datepicker-year');
            if (!monthEl || !yearEl) break; 

            let cMonthText = monthEl.innerText.trim().toLowerCase();
            let cYear = parseInt(yearEl.innerText.trim(), 10);
            let monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
            let cMonth = monthNames.findIndex(m => cMonthText.includes(m)) + 1;

            if (cYear === tYear && cMonth === tMonth) {
                let days = document.querySelectorAll('tbody td:not(.ui-datepicker-other-month):not(.p-datepicker-other-month):not(.ui-state-disabled):not(.p-disabled)');
                for (let d of days) {
                    if (parseInt(d.innerText.trim(), 10) === tDay) {
                        let clickTarget = d.querySelector('a') || d.querySelector('span') || d;
                        await stealthClick(clickTarget);
                        await randomSleep(100, 150);
                        return; 
                    }
                }
                break; 
            } else if ((cYear < tYear) || (cYear === tYear && cMonth < tMonth)) {
                let nextBtn = document.querySelector('.ui-datepicker-next, .p-datepicker-next');
                if (nextBtn && !nextBtn.className.includes('disabled')) {
                    await stealthClick(nextBtn);
                    await randomSleep(150, 250);
                } else break;
            } else {
                let prevBtn = document.querySelector('.ui-datepicker-prev, .p-datepicker-prev');
                if (prevBtn && !prevBtn.className.includes('disabled')) {
                    await stealthClick(prevBtn);
                    await randomSleep(150, 250);
                } else break;
            }
        }
        await ghostType(dateInput, targetDateString);
        document.body.click();
        dateInput.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', code: 'Escape', bubbles: true}));
    }

    async function fillAndSelectStation(inputEl, stationCode) {
        let success = false;
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await randomSleep(50, 100);
        
        const coords = getStealthCoords(inputEl);
        coords.buttons = 1;
        inputEl.dispatchEvent(new PointerEvent('pointerdown', coords));
        inputEl.dispatchEvent(new MouseEvent('mousedown', coords));
        inputEl.focus(); 
        await randomSleep(20, 50);

        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(inputEl, '');
        inputEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await randomSleep(50, 100);

        // Stealth type the station code
        let currentValue = "";
        for (let i = 0; i < stationCode.length; i++) {
            currentValue += stationCode[i];
            nativeSetter.call(inputEl, currentValue);
            inputEl.dispatchEvent(new InputEvent('input', { data: stationCode[i], inputType: 'insertText', bubbles: true, composed: true }));
            await randomSleep(20, 50);
        }
        
        inputEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, composed: true, key: stationCode[stationCode.length-1] }));

        let dropdownOpts = [];
        for (let wait = 1; wait <= 15; wait++) {
            let opts = document.querySelectorAll('li.ui-autocomplete-list-item, li.p-autocomplete-item');
            dropdownOpts = Array.from(opts).filter(el => el.offsetParent !== null && window.getComputedStyle(el).display !== 'none');
            if (dropdownOpts.length > 0) break; 
            if (wait === 5 || wait === 10) {
                currentValue += " ";
                nativeSetter.call(inputEl, currentValue);
                inputEl.dispatchEvent(new InputEvent('input', { data: " ", inputType: 'insertText', bubbles: true, composed: true }));
                inputEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, composed: true, key: ' ' }));
            }
            await randomSleep(100, 150); 
        }

        if (dropdownOpts.length > 0) {
            await randomSleep(50, 100);
            await stealthClick(dropdownOpts[0]); 
            await randomSleep(150, 300);
            success = true;
        } else {
            inputEl.blur(); 
            await randomSleep(300, 500);
        }
        return success;
    }

    // ========================================================
    // 3. STRICT AI SEQUENCE MANAGER
    // ========================================================
    async function runAutoSequence() {
        if (REDSTAR_CONFIG.manualAutofill) return;

        // --- A. LOGIN SEQUENCE ---
        if (!STATE.loginSequenceDone) {
            const userInp = document.querySelector('input[formcontrolname="userid"]');
            const passInp = document.querySelector('input[formcontrolname="password"]');
            const buttons = Array.from(document.querySelectorAll('button'));
            const signInBtn = buttons.find(b => b.innerText.toUpperCase().includes('SIGN IN'));

            if (userInp && passInp && signInBtn && REDSTAR_CONFIG.username && !userInp.dataset.rsFilledComplete) {
                userInp.dataset.rsFilledComplete = "true"; 
                await randomSleep(300, 500);
                await ghostType(userInp, REDSTAR_CONFIG.username); 
                await randomSleep(300, 500);
                await ghostType(passInp, REDSTAR_CONFIG.password); 
                await randomSleep(400, 600);
                await stealthClick(signInBtn);
                STATE.loginSequenceDone = true; 
            }
        }

        // --- A2. JOURNEY DETAILS SEQUENCE ---
        const isTrainSearchPage = window.location.href.includes('train-search');

        if (isTrainSearchPage) {
            const isLoginModalOpen = document.querySelector('app-login') !== null;
            const isLoggedOut = Array.from(document.querySelectorAll('a, button, span')).some(el => el.innerText.toUpperCase().includes('LOGIN'));
            
            let loginIsCompleted = false;
            if (REDSTAR_CONFIG.username && REDSTAR_CONFIG.username.trim() !== "") {
                if (!isLoggedOut && !isLoginModalOpen) loginIsCompleted = true;
            } else {
                if (!isLoginModalOpen) loginIsCompleted = true;
            }

            if (loginIsCompleted) {
                const fromInput = document.querySelector('p-autocomplete[formcontrolname="origin"] input');
                const toInput = document.querySelector('p-autocomplete[formcontrolname="destination"] input');
                const dateInput = document.querySelector('p-calendar[formcontrolname="journeyDate"] input');

                if (fromInput && toInput && dateInput && REDSTAR_CONFIG.fromStation && REDSTAR_CONFIG.toStation && !fromInput.dataset.rsJourneyFilled) {
                    fromInput.dataset.rsJourneyFilled = "true"; 
                    await randomSleep(300, 600);
                    await fillAndSelectStation(fromInput, REDSTAR_CONFIG.fromStation);
                    await randomSleep(200, 400);
                    await fillAndSelectStation(toInput, REDSTAR_CONFIG.toStation);
                    await randomSleep(200, 400);

                    if (REDSTAR_CONFIG.journeyDate) {
                        await selectDateInCalendar(dateInput, REDSTAR_CONFIG.journeyDate);
                        await randomSleep(200, 400);
                    }

                    const classDropdown = document.querySelector('p-dropdown[formcontrolname="journeyClass"] div[role="button"]');
                    if (classDropdown && REDSTAR_CONFIG.classCode) {
                        await stealthClick(classDropdown);
                        await randomSleep(200, 400);
                        const opts = document.querySelectorAll('p-dropdownitem li span');
                        for (let opt of opts) {
                            if (opt.innerText.trim().toUpperCase().includes(REDSTAR_CONFIG.classCode.toUpperCase())) {
                                await stealthClick(opt);
                                break;
                            }
                        }
                    }
                    await randomSleep(200, 400);

                    const quotaDropdown = document.querySelector('p-dropdown[formcontrolname="journeyQuota"] div[role="button"]');
                    if (quotaDropdown && REDSTAR_CONFIG.quota) {
                        await stealthClick(quotaDropdown);
                        await randomSleep(200, 400);
                        const opts = document.querySelectorAll('p-dropdownitem li span');
                        for (let opt of opts) {
                            if (opt.innerText.trim().toUpperCase() === REDSTAR_CONFIG.quota.toUpperCase()) {
                                await stealthClick(opt);
                                break;
                            }
                        }
                    }
                    await randomSleep(300, 500);

                    const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('search'));
                    if (searchBtn) {
                        await stealthClick(searchBtn);
                    }
                }
            }
        }

        // --- B. PASSENGER SEQUENCE ---
        if (!STATE.passengerSequenceDone && window.location.href.includes('reviewBooking') === false && window.location.href.includes('booking/train-list') === false) {
            let validPassengers = REDSTAR_CONFIG.passengers ? REDSTAR_CONFIG.passengers.filter(p => p.name && p.name.trim() !== "") : [];
            const allInputs = Array.from(document.querySelectorAll('input, select, p-dropdown'));
            const firstInput = allInputs.find(el => {
                const nameAttr = el.getAttribute('formcontrolname');
                const parentAttr = el.closest('[formcontrolname]')?.getAttribute('formcontrolname');
                const placeholder = (el.placeholder || '').toLowerCase();
                return nameAttr === 'passengerName' || parentAttr === 'passengerName' || placeholder.includes('name');
            });

            if (validPassengers.length > 0 && firstInput) {
                for (let i = 0; i < validPassengers.length; i++) {
                    let psgn = validPassengers[i];

                    let cAll = Array.from(document.querySelectorAll('input, select, p-dropdown'));
                    let cName = cAll.filter(el => {
                        let nAttr = el.getAttribute('formcontrolname');
                        let pAttr = el.closest('[formcontrolname]')?.getAttribute('formcontrolname');
                        let ph = (el.placeholder || '').toLowerCase();
                        return nAttr === 'passengerName' || pAttr === 'passengerName' || ph.includes('name');
                    });

                    if (!cName[i]) {
                        let cAddLinks = Array.from(document.querySelectorAll('span, a'));
                        let cAddBtn = cAddLinks.find(el => el.innerText.includes('Add Passenger') || el.innerText.includes('Add Infant With Berth'));
                        
                        if (cAddBtn) {
                            await randomSleep(300, 500); 
                            await stealthClick(cAddBtn);
                            await randomSleep(300, 500); 
                            
                            cAll = Array.from(document.querySelectorAll('input, select, p-dropdown'));
                            cName = cAll.filter(el => {
                                let nAttr = el.getAttribute('formcontrolname');
                                let pAttr = el.closest('[formcontrolname]')?.getAttribute('formcontrolname');
                                let ph = (el.placeholder || '').toLowerCase();
                                return nAttr === 'passengerName' || pAttr === 'passengerName' || ph.includes('name');
                            });
                        }
                    }

                    let cAge = cAll.filter(el => {
                        let nAttr = el.getAttribute('formcontrolname');
                        let pAttr = el.closest('[formcontrolname]')?.getAttribute('formcontrolname');
                        let ph = (el.placeholder || '').toLowerCase();
                        return nAttr === 'passengerAge' || pAttr === 'passengerAge' || ph === 'age';
                    });

                    let cGender = cAll.filter(el => {
                        let nAttr = (el.getAttribute('formcontrolname') || '').toLowerCase();
                        let pAttr = (el.closest('[formcontrolname]')?.getAttribute('formcontrolname') || '').toLowerCase();
                        return nAttr.includes('gender') || pAttr.includes('gender');
                    });

                    let nInp = cName[i];
                    let aInp = cAge[i];
                    let gDrop = cGender[i];

                    if (nInp && !nInp.dataset.rsFilledComplete) {
                        nInp.dataset.rsFilledComplete = "true";
                        await ghostType(nInp, psgn.name);
                        await randomSleep(200, 300); 
                    }
                    if (aInp && !aInp.dataset.rsFilledComplete) {
                        aInp.dataset.rsFilledComplete = "true";
                        await ghostType(aInp, psgn.age);
                        await randomSleep(200, 300); 
                    }
                    if (gDrop && !gDrop.dataset.rsFilledComplete) {
                        gDrop.dataset.rsFilledComplete = "true";
                        await selectGender(gDrop, psgn.gender);
                        await randomSleep(300, 500);
                    }
                }
                STATE.allPassengersFilled = true;
                STATE.passengerSequenceDone = true;
            }
        }

        // --- C. PREFERENCES SEQUENCE ---
        if (STATE.allPassengersFilled && !STATE.preferencesSequenceDone) {
            const buttons = Array.from(document.querySelectorAll('button'));
            const continueBtn = buttons.find(b => b.innerText.trim().toLowerCase() === 'continue');
            
            if (continueBtn && !continueBtn.dataset.rsFilledComplete) {
                continueBtn.dataset.rsFilledComplete = "true"; 

                await randomSleep(800, 1200); 

                const allLabels = Array.from(document.querySelectorAll('label'));
                const confirmBerthLabel = allLabels.find(l => l.innerText.toLowerCase().includes('confirm berths'));
                
                if (confirmBerthLabel) {
                    await randomSleep(200, 400);
                    let checkboxEl = confirmBerthLabel.parentElement.querySelector('.ui-chkbox-box');
                    if (checkboxEl) await stealthClick(checkboxEl);
                    else await stealthClick(confirmBerthLabel);
                }

                const allRadios = Array.from(document.querySelectorAll('p-radiobutton'));
                const upiWrapper = allRadios.find(r => r.parentElement && r.parentElement.innerText.includes('BHIM/UPI'));
                
                if (upiWrapper) {
                    await randomSleep(200, 400);
                    let radioBox = upiWrapper.querySelector('.ui-radiobutton-box');
                    if (radioBox) await stealthClick(radioBox);
                    else await stealthClick(upiWrapper);
                }

                await randomSleep(300, 500);
                await stealthClick(continueBtn);
                STATE.preferencesSequenceDone = true; 
            }
        }
    }

    // ============================================================
    // 4. PHASES (Timer, Train List, Review, Captcha)
    // ============================================================

    async function smartWaitWithDisplay(targetTimeStr, mainTitle) {
        if (!targetTimeStr || !timerShadow) return;
        const[tHour, tMin, tSec] = targetTimeStr.split(':').map(Number);
        const now = new Date();
        const targetDate = new Date();
        targetDate.setHours(tHour, tMin, tSec || 0, 0);

        if (now > targetDate) return;

        const timerBox = timerShadow.getElementById('redstar-timer-box');
        const timerTitle = timerShadow.getElementById('rs-timer-title');
        const timerTime = timerShadow.getElementById('rs-timer-time');

        if (timerBox && timerTitle) {
            timerBox.style.display = 'block';
            timerTitle.innerText = `${mainTitle} - ${targetTimeStr}`;
        }

        while (true) {
            const current = new Date();
            const diff = targetDate - current;
            
            if (diff <= 0) {
                if (timerBox) timerBox.style.display = 'none';
                break;
            }

            if (timerTime) {
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                const ms = Math.floor((diff % 1000) / 10); 
                
                const hStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
                timerTime.innerText = `${hStr}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
            }

            if (diff < 1000) await new Promise(r => setTimeout(r, 20));
            else await new Promise(r => setTimeout(r, 80)); 
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
                await ghostType(inputElement, resultText); 
                await sleep(200);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    async function executeTrainListPhase() {
        const { trainNumber, classCode, quota } = REDSTAR_CONFIG;

        async function waitForLoaderOff(timeoutMs = 8000) {
            const start = Date.now();
            return new Promise((resolve) => {
                const isOff = () => {
                    const el = document.querySelector('#loaderP');
                    if (!el) return true;
                    const cs = window.getComputedStyle(el);
                    if (!cs) return true;
                    return (cs.display === 'none') || (cs.visibility === 'hidden') || (el.offsetParent === null);
                };
                if (isOff()) return resolve(true);

                const iv = setInterval(() => {
                    if (isOff()) { clearInterval(iv); resolve(true); }
                    if (Date.now() - start > timeoutMs) { clearInterval(iv); resolve(false); }
                }, 50); 
            });
        }

        function isBookBtnReady(card) {
            const btn = card.querySelector("button.btnDefault.train_Search.ng-star-inserted") ||
                        Array.from(card.querySelectorAll("button")).find(b => b.innerText.toLowerCase().includes('book now'));
            if (!btn) return false;
            const cs = window.getComputedStyle(btn);
            const visible = cs && cs.display !== 'none' && cs.visibility !== 'hidden' && btn.offsetParent !== null;
            return visible && !btn.disabled && !btn.classList.contains('disable-book');
        }

        await waitForLoaderOff(3000);

        const trainBlocks = document.querySelectorAll('app-train-avl-enq');
        let targetTrainCard = null;
        for (const block of trainBlocks) {
            if (block.innerText.includes(`(${trainNumber})`)) {
                targetTrainCard = block;
                break;
            }
        }

        if (!targetTrainCard) return;

        targetTrainCard.scrollIntoView({ block: 'center', inline: 'center' });
        await sleep(100); 

        let aiExtractedDate = "";
        const dateRegex = /[A-Z]{3},\s\d{1,2}\s[A-Z]{3}/i;
        const dateMatch = targetTrainCard.innerText.match(dateRegex);
        
        if (dateMatch) aiExtractedDate = dateMatch[0].toUpperCase(); 

        const normQuota = (quota || '').toUpperCase().replace(/\s/g, '');
        const acCodes = ['3E', 'EC', '2A', 'CC', '3A', '1A'];
        const isAc = acCodes.includes((classCode || '').toUpperCase()) || (classCode || '').toUpperCase().includes('AC');

        let requiredTime = null;
        const currentHour = new Date().getHours();

        if (['TATKAL', 'PREMIUMTATKAL', 'PT', 'TQ'].includes(normQuota)) {
            if (isAc && currentHour === 9) requiredTime = '10:00:00';
            else if (!isAc && currentHour === 10) requiredTime = '10:00:00';
        } else if (['GENERAL', 'GN'].includes(normQuota)) {
            if (currentHour === 7) requiredTime = '08:00:00';
        }

        if (requiredTime) {
            await smartWaitWithDisplay(requiredTime, `GATE OPEN: ${normQuota}`);
        }

        window.__BMW_DATE_CLICKED = false;
        window.__BMW_BOOK_CLICKED = false;
        let lastClickTime = 0;

        for (let attempt = 1; attempt <= 40; attempt++) {

            if (isBookBtnReady(targetTrainCard)) {
                if (!window.__BMW_BOOK_CLICKED) {
                    const btn = targetTrainCard.querySelector("button.btnDefault.train_Search.ng-star-inserted") ||
                                Array.from(targetTrainCard.querySelectorAll("button")).find(b => b.innerText.toLowerCase().includes('book now'));
                    
                    await stealthClick(btn);
                    window.__BMW_BOOK_CLICKED = true;
                    
                    await randomSleep(200, 400); 
                    const confirmationBtn = document.querySelector('.ui-confirmdialog-acceptbutton');
                    if (confirmationBtn) await stealthClick(confirmationBtn);
                    
                    STATE.trainBooked = true;
                    return; 
                }
            }

            const currentTime = Date.now();
            if (currentTime - lastClickTime > 600) { 
                const wantClass = classCode.trim().toUpperCase();
                let classCell = null;
                let elements;

                elements = targetTrainCard.querySelectorAll('div.pre-avl');
                for (const el of elements) { if (el.innerText.toUpperCase().includes(wantClass)) { classCell = el; break; } }
                if (!classCell) {
                    elements = targetTrainCard.querySelectorAll('li[role="tab"]');
                    for (const el of elements) { if (el.innerText.toUpperCase().includes(wantClass)) { classCell = el; break; } }
                }

                if (classCell) {
                    await stealthClick(classCell);
                    lastClickTime = Date.now();
                    await waitForLoaderOff(8000);
                    await randomSleep(100, 200); 
                }

                if (!window.__BMW_DATE_CLICKED && aiExtractedDate) {
                    const dateCells = targetTrainCard.querySelectorAll('td div.pre-avl, div.pre-avl, div[tabindex="0"]');
                    for (const cell of dateCells) {
                        if (cell.innerText.toUpperCase().includes(aiExtractedDate)) {
                            await stealthClick(cell);
                            window.__BMW_DATE_CLICKED = true;
                            break;
                        }
                    }
                }
            }
            await sleep(100); 
        }
    }

    async function executeReviewPhase() {
        await waitForSpinner();
        
        let localCaptchaSolved = false;
        let lastCaptchaSrc = "";

        while (!localCaptchaSolved && window.location.href.includes('reviewBooking')) {
            if (document.querySelector('.bank-type') || window.location.href.includes('payment')) {
                localCaptchaSolved = true; break;
            }

            const captchaInput = document.querySelector('#captcha');
            const captchaImg = document.querySelector('.captcha-img');

            if (captchaInput && captchaImg) {
                captchaInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                let retries = 0;
                while (retries < 20 && captchaImg.src.length < 100) { await sleep(100); retries++; }

                if (lastCaptchaSrc && captchaImg.src === lastCaptchaSrc) { await sleep(200); continue; }
                lastCaptchaSrc = captchaImg.src;

                const solved = await solveTrueCaptcha(captchaImg, captchaInput);

                if (solved) {
                    const finalBtn = document.querySelector('.btnDefault.train_Search');
                    if (finalBtn) {
                        await sleep(100); 
                        await stealthClick(finalBtn);
                        
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
                            await sleep(100);
                            checkTimer += 100;
                        }

                        if (localCaptchaSolved) break;
                        if (errorFound) {
                            await ghostType(captchaInput, '');
                            await sleep(500);
                            continue;
                        }
                    } else await sleep(500);
                } else await sleep(500);
            } else await sleep(500);
        }

        if(localCaptchaSolved) STATE.captchaSolved = true;
    }

    function isAkamaiBlocked() {
        const bodyText = document.body.innerText || "";
        return (bodyText.includes('Unable to Process Request') && bodyText.includes('Client IP:'));
    }

    // ============================================================
    // MAIN LOOP
    // ============================================================
    async function mainLoop() {
        initTimerUI(); 
        await loadSettings(); 

        while (true) {
            if (isAkamaiBlocked()) {
                console.log("🛑 DETECTED! Waiting 10 seconds...");
                await sleep(10000); 
                continue; 
            }

            const url = window.location.href;
            await runAutoSequence(); 
            
            if (url.includes('train-search')) {
                STATE.trainBooked = false; 
                STATE.captchaSolved = false;
                STATE.paymentExecuted = false; 
                STATE.pgPhonePeExecuted = false;
                STATE.loginSequenceDone = false; 
                STATE.passengerSequenceDone = false;
                STATE.allPassengersFilled = false;
                STATE.preferencesSequenceDone = false;
            } 
            
            if (url.includes('booking/train-list')) {
                if (!STATE.trainBooked && REDSTAR_CONFIG.trainNumber && REDSTAR_CONFIG.classCode) {
                    await executeTrainListPhase();
                }
            }
            else if (url.includes('booking/reviewBooking')) {
                if (!STATE.captchaSolved) {
                    await executeReviewPhase();
                }
            }
            await sleep(200);
        }
    }

    mainLoop().catch(e => { });

})();
