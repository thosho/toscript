document.addEventListener('DOMContentLoaded', () => {
    console.log("🎬 ToscripT Professional - Initializing for Filmmakers Worldwide");
    
    // Global variables
    let projectData = { projectInfo: { projectName: "Untitled", prodName: "Author", scriptContent: "" } };
    let fontSize = 16;
    let autoSaveInterval = null;
    let showSceneNumbers = true;
    let currentView = 'write';
    let isKeyboardOpen = false;
    let sceneOrder = [];

    // DOM elements
    const fountainInput = document.getElementById('fountain-input');
    const screenplayOutput = document.getElementById('screenplay-output');
    const menuPanel = document.getElementById('menu-panel');
    const sceneNavigatorPanel = document.getElementById('scene-navigator-panel');
    const writeView = document.getElementById('write-view');
    const scriptView = document.getElementById('script-view');
    const cardView = document.getElementById('card-view');
    const mainHeader = document.getElementById('main-header');
    const scriptHeader = document.getElementById('script-header');
    const cardHeader = document.getElementById('card-header');
    const mobileAccessory = document.getElementById('mobile-keyboard-accessory');

    const placeholderText = `TITLE: THE CRIMSON DOSSIER
AUTHOR: YOUR NAME

INT. DETECTIVE'S OFFICE - NIGHT

The office is dimly lit. DETECTIVE VIKRAM (40s, weary) sits behind a cluttered desk, staring at cold coffee.

The door opens. MAYA (30s, mysterious) steps out of the shadows.

MAYA
(whispering)
Are you the one they call the Ghost of Bangalore?

VIKRAM
(cautious)
That depends on who's asking.

FADE OUT.`;

    // Enhanced history system
    const history = {
        stack: [""],
        currentIndex: 0,
        add(value) {
            if (value !== this.stack[this.currentIndex]) {
                this.stack = this.stack.slice(0, this.currentIndex + 1);
                this.stack.push(value);
                this.currentIndex++;
                this.updateButtons();
            }
        },
        undo() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateInput();
            }
        },
        redo() {
            if (this.currentIndex < this.stack.length - 1) {
                this.currentIndex++;
                this.updateInput();
            }
        },
        updateInput() {
            if (fountainInput) {
                fountainInput.value = this.stack[this.currentIndex] || '';
                if (fountainInput.value === '') setPlaceholder();
                else clearPlaceholder();
                this.updateButtons();
            }
        },
        updateButtons() {
            const undoBtns = document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top');
            const redoBtns = document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top');
            
            undoBtns.forEach(btn => {
                if (btn) btn.disabled = this.currentIndex <= 0;
            });
            redoBtns.forEach(btn => {
                if (btn) btn.disabled = this.currentIndex >= this.stack.length - 1;
            });
        }
    };

    // Professional Mobile Keyboard Detection - Research-Based Implementation
    function setupAdvancedKeyboardDetection() {
        let initialViewportHeight = window.innerHeight;
        let keyboardTimeout = null;
        
        function handleViewportChange() {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            const wasKeyboardOpen = isKeyboardOpen;
            
            // Detect keyboard open (height reduced by more than 150px indicates keyboard)
            isKeyboardOpen = heightDifference > 150;
            
            if (isKeyboardOpen !== wasKeyboardOpen) {
                clearTimeout(keyboardTimeout);
                keyboardTimeout = setTimeout(() => {
                    updateMobileAccessoryPosition();
                }, 100);
            }
        }

        // Modern browsers - Visual Viewport API (most reliable)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            console.log('✅ Using Visual Viewport API for keyboard detection');
        } else {
            // Fallback for older browsers
            window.addEventListener('resize', handleViewportChange);
            console.log('⚠️ Using resize fallback for keyboard detection');
        }

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                initialViewportHeight = window.innerHeight;
                handleViewportChange();
            }, 500);
        });

        // Enhanced focus/blur detection for mobile
        if (fountainInput) {
            fountainInput.addEventListener('focus', () => {
                document.body.classList.add('input-focused');
                setTimeout(() => {
                    if (window.innerWidth <= 768 && currentView === 'write') {
                        showMobileAccessory();
                    }
                }, 300);
            });

            fountainInput.addEventListener('blur', () => {
                document.body.classList.remove('input-focused');
                // Delay hiding to prevent flickering when tapping buttons
                setTimeout(() => {
                    if (!document.activeElement?.closest('.mobile-keyboard-accessory')) {
                        hideMobileAccessory();
                    }
                }, 200);
            });
        }
    }

    function updateMobileAccessoryPosition() {
        if (window.innerWidth <= 768 && currentView === 'write') {
            if (isKeyboardOpen) {
                showMobileAccessory();
            } else {
                hideMobileAccessory();
            }
        } else {
            hideMobileAccessory();
        }
    }

    function showMobileAccessory() {
        if (mobileAccessory && window.innerWidth <= 768 && currentView === 'write') {
            mobileAccessory.classList.add('show');
            console.log('📱 Mobile keyboard accessory shown');
        }
    }

    function hideMobileAccessory() {
        if (mobileAccessory) {
            mobileAccessory.classList.remove('show');
        }
    }

    // Placeholder functions
    function setPlaceholder() {
        if (fountainInput && fountainInput.value === '') {
            fountainInput.value = placeholderText;
            fountainInput.classList.add('placeholder');
        }
    }

    function clearPlaceholder() {
        if (fountainInput && fountainInput.classList.contains('placeholder')) {
            fountainInput.value = '';
            fountainInput.classList.remove('placeholder');
        }
    }

    // Save/Load functions
    function saveProjectData() {
        if (fountainInput) {
            projectData.projectInfo.scriptContent = fountainInput.value;
        }
        localStorage.setItem('universalFilmProject_ToScript', JSON.stringify(projectData));
    }

    function loadProjectData() {
        const savedData = localStorage.getItem('universalFilmProject_ToScript');
        if (savedData) {
            try {
                projectData = JSON.parse(savedData);
            } catch (e) {
                console.error('Error loading saved data:', e);
                projectData = { projectInfo: { projectName: "Untitled", prodName: "Author", scriptContent: "" } };
            }
        }
        if (fountainInput && projectData.projectInfo.scriptContent) {
            fountainInput.value = projectData.projectInfo.scriptContent;
            clearPlaceholder();
        }
        updateSceneNoIndicator();
        updateAutoSaveIndicator();
    }

    // Enhanced View Switching with Mobile Support
    function switchView(view) {
        console.log(`🔄 Switching to ${view} view`);
        currentView = view;

        // Hide all views and headers
        [writeView, scriptView, cardView].forEach(v => {
            if (v) v.classList.remove('active');
        });
        [mainHeader, scriptHeader, cardHeader].forEach(h => {
            if (h) h.style.display = 'none';
        });

        // Hide mobile accessory by default
        hideMobileAccessory();

        if (view === 'script') {
            if (scriptView) {
                renderEnhancedScript();
                scriptView.classList.add('active');
            }
            if (scriptHeader) scriptHeader.style.display = 'flex';
        } else if (view === 'card') {
            if (cardView) {
                renderEnhancedCardView();
                cardView.classList.add('active');
            }
            if (cardHeader) cardHeader.style.display = 'flex';
        } else {
            // write view
            if (writeView) writeView.classList.add('active');
            if (mainHeader) mainHeader.style.display = 'flex';
            
            setTimeout(() => {
                if (fountainInput) {
                    fountainInput.focus();
                    if (window.innerWidth <= 768) {
                        showMobileAccessory();
                    }
                }
            }, 200);
        }
    }

    // Scene number and auto-save indicators
    function updateSceneNoIndicator() {
        const indicator = document.getElementById('scene-no-indicator');
        if (indicator) {
            if (showSceneNumbers) {
                indicator.classList.remove('off');
                indicator.classList.add('on');
            } else {
                indicator.classList.remove('on');
                indicator.classList.add('off');
            }
        }
    }

    function updateAutoSaveIndicator() {
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            if (autoSaveInterval) {
                indicator.classList.remove('off');
                indicator.classList.add('on');
            } else {
                indicator.classList.remove('on');
                indicator.classList.add('off');
            }
        }
    }

    function toggleSceneNumbers() {
        showSceneNumbers = !showSceneNumbers;
        updateSceneNoIndicator();
        saveProjectData();
        if (currentView === 'script') {
            renderEnhancedScript();
        }
        console.log(`📝 Scene numbers ${showSceneNumbers ? 'enabled' : 'disabled'}`);
    }

    function toggleAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
            alert('Auto-save disabled');
        } else {
            autoSaveInterval = setInterval(saveProjectData, 120000); // Save every 2 minutes
            alert('Auto-save enabled (every 2 minutes)');
        }
        updateAutoSaveIndicator();
    }

    // Industry Standard Screenplay Parsing Engine - Research-Based
    function parseScriptWithIndustryStandards(text) {
        const lines = text.split('\n');
        const elements = [];
        let sceneCount = 0;

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            const original = line;
            
            if (trimmed.length === 0) {
                elements.push({ type: 'empty', text: '', original });
                return;
            }

            // Title page elements (at the beginning)
            if (index < 10 && (trimmed.startsWith('TITLE:') || trimmed.startsWith('AUTHOR:'))) {
                elements.push({ 
                    type: 'title', 
                    text: trimmed.replace(/^(TITLE:|AUTHOR:)\s*/, ''), 
                    original,
                    prefix: trimmed.startsWith('TITLE:') ? 'TITLE:' : 'AUTHOR:'
                });
                return;
            }

            // Scene headings - Industry standard: INT., EXT., or INT./EXT.
            if (/^(INT\.?\/EXT\.?|INT\.|EXT\.)\s+/i.test(trimmed)) {
                sceneCount++;
                const sceneNumber = showSceneNumbers ? sceneCount : null;
                elements.push({ 
                    type: 'scene_heading', 
                    text: trimmed.toUpperCase(), 
                    original,
                    sceneNumber,
                    sceneId: `scene_${sceneCount}`
                });
                return;
            }

            // Transitions - Industry standard patterns
            if (/^(CUT TO:|DISSOLVE TO:|FADE TO BLACK\.|FADE OUT\.|FADE IN:|SMASH CUT TO:|MATCH CUT TO:|JUMP CUT TO:)$/i.test(trimmed) ||
                (trimmed === trimmed.toUpperCase() && trimmed.endsWith('TO:') && trimmed.length < 25)) {
                elements.push({ type: 'transition', text: trimmed.toUpperCase(), original });
                return;
            }

            // Character names - Industry standard: All caps, not too long, not scene heading
            if (trimmed === trimmed.toUpperCase() && 
                trimmed.length > 0 && 
                trimmed.length < 50 && 
                !trimmed.includes('.') && 
                !trimmed.endsWith(':') &&
                !/^(FADE|CUT|DISSOLVE|SMASH|MATCH|JUMP|INT|EXT)/.test(trimmed)) {
                
                // Look ahead to see if next non-empty line could be dialogue
                let nextIndex = index + 1;
                while (nextIndex < lines.length && lines[nextIndex].trim() === '') nextIndex++;
                if (nextIndex < lines.length) {
                    const nextLine = lines[nextIndex].trim();
                    // Character if next line is not another formatting element
                    if (!(/^(INT\.?\/EXT\.?|INT\.|EXT\.)\s+/i.test(nextLine)) &&
                        !(nextLine === nextLine.toUpperCase() && nextLine.endsWith('TO:')) &&
                        !(nextLine === nextLine.toUpperCase() && nextLine.length < 50 && !nextLine.includes('.'))) {
                        elements.push({ type: 'character', text: trimmed, original });
                        return;
                    }
                }
            }

            // Parentheticals - Industry standard: Enclosed in parentheses
            if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                elements.push({ type: 'parenthetical', text: trimmed, original });
                return;
            }

            // Check if this is dialogue (follows a character)
            if (elements.length > 0) {
                const prevElement = elements[elements.length - 1];
                if (prevElement.type === 'character' || 
                    (prevElement.type === 'parenthetical' && elements.length > 1 && elements[elements.length - 2].type === 'character')) {
                    elements.push({ type: 'dialogue', text: trimmed, original });
                    return;
                }
            }

            // Everything else is action/description
            elements.push({ type: 'action', text: trimmed, original });
        });

        return elements;
    }

    // Enhanced Script Rendering with Precise Industry Standards
    function renderEnhancedScript() {
        if (!screenplayOutput || !fountainInput) return;

        const text = fountainInput.value || '';
        const elements = parseScriptWithIndustryStandards(text);
        let scriptHtml = '';

        // Title page
        const titleElements = elements.filter(el => el.type === 'title');
        if (titleElements.length > 0) {
            scriptHtml += '<div class="title-page">';
            const titleEl = titleElements.find(el => el.prefix === 'TITLE:');
            const authorEl = titleElements.find(el => el.prefix === 'AUTHOR:');
            
            if (titleEl) {
                scriptHtml += `<h1>${titleEl.text || projectData.projectInfo.projectName || 'Untitled'}</h1>`;
            } else {
                scriptHtml += `<h1>${projectData.projectInfo.projectName || 'Untitled'}</h1>`;
            }
            
            if (authorEl) {
                scriptHtml += `<p class="author">by ${authorEl.text}</p>`;
            } else {
                scriptHtml += `<p class="author">by ${projectData.projectInfo.prodName || 'Author'}</p>`;
            }
            scriptHtml += '</div>';
        } else {
            scriptHtml += `<div class="title-page">
                <h1>${projectData.projectInfo.projectName || 'Untitled'}</h1>
                <p class="author">by ${projectData.projectInfo.prodName || 'Author'}</p>
            </div>`;
        }

        // Render script elements with precise formatting
        elements.forEach(element => {
            if (element.type === 'title') return;

            switch (element.type) {
                case 'empty':
                    scriptHtml += '<br>';
                    break;
                case 'scene_heading':
                    const sceneNum = element.sceneNumber && showSceneNumbers ? `${element.sceneNumber}. ` : '';
                    scriptHtml += `<div class="scene-heading">${sceneNum}${element.text}</div>`;
                    break;
                case 'character':
                    scriptHtml += `<div class="character">${element.text}</div>`;
                    break;
                case 'dialogue':
                    scriptHtml += `<div class="dialogue">${element.text}</div>`;
                    break;
                case 'parenthetical':
                    scriptHtml += `<div class="parenthetical">${element.text}</div>`;
                    break;
                case 'transition':
                    scriptHtml += `<div class="transition">${element.text}</div>`;
                    break;
                default:
                    if (element.text) {
                        scriptHtml += `<div class="action">${element.text}</div>`;
                    }
            }
        });

        screenplayOutput.innerHTML = scriptHtml;
        console.log('📄 Enhanced script rendered with industry standards');
    }

    // Professional Screenplay Cards - Research-Based Implementation
    function renderEnhancedCardView() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer || !fountainInput) return;

        const text = fountainInput.value || '';
        const elements = parseScriptWithIndustryStandards(text);
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;

        elements.forEach(element => {
            if (element.type === 'scene_heading') {
                if (currentScene) scenes.push(currentScene);
                sceneNumber++;
                currentScene = {
                    sceneId: `scene_${sceneNumber}`,
                    sceneNumber: sceneNumber,
                    heading: element.text,
                    description: [], // Only description/action - industry standard
                    elements: []
                };
            } else if (currentScene && element.type === 'action' && element.text) {
                // Cards only show scene heading and description (action) - never dialogue, characters, or transitions
                currentScene.description.push(element.text);
                currentScene.elements.push(element);
            }
        });

        if (currentScene) scenes.push(currentScene);

        if (scenes.length === 0) {
            cardContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--muted-text-color); grid-column: 1 / -1;">
                    <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No scenes found to display as cards.</p>
                    <p style="font-size: 0.9rem;">Start writing your screenplay to see scene cards here.</p>
                </div>`;
            return;
        }

        cardContainer.innerHTML = scenes.map(scene =>
            `<div class="scene-card" data-scene-id="${scene.sceneId}" data-scene-number="${scene.sceneNumber}">
                <div class="scene-card-content">
                    <div class="card-header">
                        <input class="card-scene-number" type="text" value="${scene.sceneNumber}" data-scene-id="${scene.sceneId}" />
                        <div class="card-scene-title">${scene.heading}</div>
                    </div>
                    <div class="card-body">${scene.description.join('\n')}</div>
                </div>
                <div class="card-actions">
                    <button class="icon-btn edit-card-btn" title="Edit Scene" data-scene-id="${scene.sceneId}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn share-card-btn" title="Share Scene" data-scene-id="${scene.sceneId}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>`
        ).join('');

        // Enable drag and drop sorting
        if (typeof Sortable !== 'undefined') {
            new Sortable(cardContainer, {
                animation: 150,
                ghostClass: 'dragging',
                onEnd: (evt) => {
                    handleCardReorder(evt);
                }
            });
        }

        console.log(`🎞️ Rendered ${scenes.length} professional screenplay cards`);
    }

    function handleCardReorder(evt) {
        const cards = Array.from(document.querySelectorAll('.scene-card'));
        const newOrder = cards.map(card => card.dataset.sceneId);
        sceneOrder = newOrder;
        
        // Update scene numbers based on new order
        cards.forEach((card, index) => {
            const sceneNumberInput = card.querySelector('.card-scene-number');
            sceneNumberInput.value = index + 1;
        });
        
        console.log('🔄 Cards reordered:', newOrder);
    }

    function handleEditSceneNumber(input, sceneId) {
        const newNumber = parseInt(input.value);
        if (!isNaN(newNumber) && newNumber > 0) {
            console.log(`📝 Scene ${sceneId} number changed to ${newNumber}`);
            // Additional logic to update script order could go here
        } else {
            // Reset to original if invalid
            const card = input.closest('.scene-card');
            input.value = card.dataset.sceneNumber;
        }
    }

    // Action button handler with enhanced mobile support
    function handleActionBtn(e) {
        if (!fountainInput) return;

        const action = e.currentTarget.dataset.action;
        const { selectionStart, selectionEnd, value } = fountainInput;
        const selectedText = value.substring(selectionStart, selectionEnd);

        clearPlaceholder();

        switch (action) {
            case 'caps':
                const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
                const lineEnd = value.indexOf('\n', selectionStart);
                const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
                const newText = (currentLine === currentLine.toUpperCase()) ? currentLine.toLowerCase() : currentLine.toUpperCase();
                fountainInput.setRangeText(newText, lineStart, lineEnd === -1 ? value.length : lineEnd);
                break;
            case 'parens':
                fountainInput.setRangeText(`(${selectedText})`, selectionStart, selectionEnd);
                fountainInput.setSelectionRange(selectionStart + 1, selectionEnd + 1);
                break;
            case 'scene':
                cycleText(['INT. ', 'EXT. ', 'INT./EXT. ']);
                break;
            case 'time':
                cycleText([' - DAY', ' - NIGHT', ' - MORNING', ' - EVENING', ' - DAWN', ' - DUSK', ' - CONTINUOUS']);
                break;
            case 'transition':
                cycleText(['CUT TO:', 'DISSOLVE TO:', 'FADE OUT.', 'FADE IN:', 'FADE TO BLACK.', 'SMASH CUT TO:']);
                break;
        }

        history.add(fountainInput.value);
        
        // Keep focus and maintain mobile toolbar
        setTimeout(() => {
            if (fountainInput) {
                fountainInput.focus();
                if (window.innerWidth <= 768 && currentView === 'write') {
                    showMobileAccessory();
                }
            }
        }, 10);
    }

    function cycleText(options) {
        if (!fountainInput) return;

        const { value, selectionStart } = fountainInput;
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const lineEnd = value.indexOf('\n', selectionStart);
        const currentLine = value.substring(lineStart, lineEnd > -1 ? lineEnd : value.length);
        let currentIndex = -1;

        for (let i = 0; i < options.length; i++) {
            if (currentLine.includes(options[i])) {
                currentIndex = i;
                break;
            }
        }

        const nextOption = options[(currentIndex + 1) % options.length];
        if (currentIndex > -1) {
            const newLine = currentLine.replace(options[currentIndex], nextOption);
            fountainInput.setRangeText(newLine, lineStart, lineEnd > -1 ? lineEnd : value.length);
        } else {
            fountainInput.setRangeText(nextOption, selectionStart, selectionStart);
            fountainInput.setSelectionRange(selectionStart + nextOption.length, selectionStart + nextOption.length);
        }
    }

    // Enhanced PDF with Industry Standards and Unicode
    async function saveAsPdfWithUnicode() {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library not loaded. Please try again.');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            // Enhanced Unicode font loading
            try {
                const fontUrl = 'https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNr5TRA.ttf';
                const fontResponse = await fetch(fontUrl);
                if (fontResponse.ok) {
                    const fontData = await fontResponse.arrayBuffer();
                    const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(fontData)));
                    doc.addFileToVFS('NotoSans-Regular.ttf', fontBase64);
                    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
                    doc.setFont('NotoSans');
                    console.log('✅ Unicode font loaded successfully');
                } else {
                    throw new Error('Font not loaded');
                }
            } catch (e) {
                console.warn('⚠️ Using fallback font:', e);
                doc.setFont('helvetica');
            }

            const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
            let y = 50;
            const lineHeight = 14;
            const pageHeight = 792;
            const margin = 72; // 1 inch margin
            const pageWidth = 612;

            // Title page
            doc.setFontSize(18);
            const title = projectData.projectInfo.projectName || 'Untitled';
            doc.text(title, pageWidth/2, y, { align: 'center' });
            y += 30;

            doc.setFontSize(14);
            const author = `by ${projectData.projectInfo.prodName || 'Author'}`;
            doc.text(author, pageWidth/2, y, { align: 'center' });
            y += 80;

            doc.setFontSize(12);

            // Process each element with industry-standard indentation
            elements.forEach(element => {
                if (element.type === 'title') return;

                if (y > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }

                let x = margin;
                let fontSize = 12;

                switch (element.type) {
                    case 'scene_heading':
                        // Scene heading: flush left
                        fontSize = 12;
                        y += lineHeight;
                        doc.setFontSize(fontSize);
                        const sceneText = element.sceneNumber && showSceneNumbers ? `${element.sceneNumber}. ${element.text}` : element.text;
                        doc.text(sceneText, x, y);
                        break;
                    case 'character':
                        // Character: 3.7" from left margin
                        x = margin + 266; // 3.7 inches = 266 points
                        doc.setFontSize(fontSize);
                        doc.text(element.text, x, y);
                        break;
                    case 'dialogue':
                        // Dialogue: 2.5" from left, 3.5" wide
                        x = margin + 180; // 2.5 inches = 180 points
                        doc.setFontSize(fontSize);
                        const dialogueText = doc.splitTextToSize(element.text, 252); // 3.5 inches = 252 points
                        if (Array.isArray(dialogueText)) {
                            dialogueText.forEach((line, index) => {
                                if (y > pageHeight - margin) {
                                    doc.addPage();
                                    y = margin;
                                }
                                doc.text(line, x, y);
                                if (index < dialogueText.length - 1) y += lineHeight;
                            });
                        } else {
                            doc.text(dialogueText, x, y);
                        }
                        break;
                    case 'parenthetical':
                        // Parenthetical: 3.1" from left margin
                        x = margin + 223; // 3.1 inches = 223 points
                        doc.setFontSize(fontSize);
                        doc.text(element.text, x, y);
                        break;
                    case 'transition':
                        // Transition: right-aligned
                        doc.setFontSize(fontSize);
                        doc.text(element.text, pageWidth - margin, y, { align: 'right' });
                        break;
                    case 'action':
                        // Action: flush left, max 6 inches wide
                        doc.setFontSize(fontSize);
                        const actionText = doc.splitTextToSize(element.text, 432); // 6 inches = 432 points
                        if (Array.isArray(actionText)) {
                            actionText.forEach((line, index) => {
                                if (y > pageHeight - margin) {
                                    doc.addPage();
                                    y = margin;
                                }
                                doc.text(line, x, y);
                                if (index < actionText.length - 1) y += lineHeight;
                            });
                        } else {
                            doc.text(actionText, x, y);
                        }
                        break;
                    case 'empty':
                        y += lineHeight / 2;
                        return;
                }

                y += lineHeight;
            });

            doc.save(`${projectData.projectInfo.projectName || 'screenplay'}.pdf`);
            console.log('📄 Enhanced PDF generated with Unicode support');
            
        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            alert('Error generating PDF. Please try again.');
        }
    }

    // File operations
    function saveAsFountain() {
        const text = fountainInput.value || '';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.projectInfo.projectName}.fountain`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function openFountainFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (fountainInput) {
                fountainInput.value = e.target.result;
                history.add(fountainInput.value);
                saveProjectData();
                clearPlaceholder();
            }
        };
        reader.readAsText(file, 'UTF-8');
    }

    // Enhanced Card functions
    function editSceneFromCard(sceneId) {
        const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
        let targetIndex = -1;
        let sceneCount = 0;
        let charPosition = 0;
        const targetSceneNumber = parseInt(sceneId.replace('scene_', ''));

        for (let i = 0; i < elements.length; i++) {
            if (elements[i].type === 'scene_heading') {
                sceneCount++;
                if (sceneCount === targetSceneNumber) {
                    targetIndex = i;
                    break;
                }
            }
            charPosition += elements[i].original.length + 1;
        }

        if (targetIndex >= 0) {
            switchView('write');
            setTimeout(() => {
                if (fountainInput) {
                    fountainInput.focus();
                    fountainInput.setSelectionRange(charPosition, charPosition);
                    fountainInput.scrollTop = (charPosition / fountainInput.value.length) * fountainInput.scrollHeight;
                }
            }, 300);
        }
    }

    async function shareSceneCard(sceneId) {
        const cardElement = document.querySelector(`[data-scene-id="${sceneId}"]`);
        if (!cardElement) return;

        try {
            if (typeof html2canvas !== 'undefined') {
                // Temporarily hide the action buttons for clean export
                const actionsDiv = cardElement.querySelector('.card-actions');
                const originalDisplay = actionsDiv.style.display;
                actionsDiv.style.display = 'none';

                const canvas = await html2canvas(cardElement.querySelector('.scene-card-content'), {
                    backgroundColor: '#1f2937',
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    height: cardElement.querySelector('.scene-card-content').offsetHeight,
                    width: cardElement.querySelector('.scene-card-content').offsetWidth
                });
                
                // Restore the action buttons
                actionsDiv.style.display = originalDisplay;
                
                canvas.toBlob(async (blob) => {
                    const fileName = `Scene_${cardElement.dataset.sceneNumber}.png`;
                    
                    if (navigator.share && navigator.canShare) {
                        try {
                            const file = new File([blob], fileName, { type: 'image/png' });
                            await navigator.share({
                                title: `Scene #${cardElement.dataset.sceneNumber}`,
                                files: [file]
                            });
                        } catch (err) {
                            downloadBlob(blob, fileName);
                        }
                    } else {
                        downloadBlob(blob, fileName);
                    }
                }, 'image/png');
            } else {
                alert('Image export not available. html2canvas library not loaded.');
            }
        } catch (err) {
            console.error('❌ Share failed:', err);
            alert('Unable to share scene. Please try again.');
        }
    }

    function downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function saveAllCardsAsZip() {
        try {
            const JSZip = window.JSZip;
            if (!JSZip) {
                alert('ZIP library not available. Please check your internet connection.');
                return;
            }

            const zip = new JSZip();
            const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
            const scenes = extractScenesFromElements(elements);

            // Add each scene card to ZIP (only heading and description)
            scenes.forEach(scene => {
                const sceneText = `${scene.heading}\n\n${scene.description.join('\n')}`;
                zip.file(`Scene_${scene.sceneNumber}.txt`, sceneText);
            });

            // Add project info
            const projectInfo = `Project: ${projectData.projectInfo.projectName}\nAuthor: ${projectData.projectInfo.prodName}\nTotal Scenes: ${scenes.length}\nGenerated: ${new Date().toLocaleString()}\n\nGenerated by ToscripT - Empowering Filmmakers Worldwide 🎬\n\nNote: These scene cards contain only scene headings and descriptions,\nfollowing professional screenplay card conventions.`;
            zip.file('Project_Info.txt', projectInfo);

            // Generate ZIP and download
            const content = await zip.generateAsync({ type: 'blob' });
            downloadBlob(content, `${projectData.projectInfo.projectName}_Scene_Cards.zip`);
            
            alert(`🎉 Successfully saved ${scenes.length} scene cards as a ZIP file!`);
        } catch (error) {
            console.error('❌ ZIP creation failed:', error);
            alert('Error creating ZIP file. Please try again.');
        }
    }

    function extractScenesFromElements(elements) {
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;

        elements.forEach(element => {
            if (element.type === 'scene_heading') {
                if (currentScene) scenes.push(currentScene);
                sceneNumber++;
                currentScene = {
                    sceneNumber: sceneNumber,
                    heading: element.text,
                    description: [] // Only description - industry standard for cards
                };
            } else if (currentScene && element.type === 'action' && element.text) {
                // Cards only include action/description, not dialogue, characters, or transitions
                currentScene.description.push(element.text);
            }
        });

        if (currentScene) scenes.push(currentScene);
        return scenes;
    }

    // Modal functions
    function createModal(id, title, body, footer = '') {
        let modal = document.getElementById(id);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = id;
            modal.className = 'modal mobile-modal';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close-btn icon-btn" style="position: absolute; top: 0.5rem; right: 0.5rem;">&times;</button>
                <div class="modal-header"><h2>${title}</h2></div>
                <div class="modal-body">${body}</div>
                <div class="modal-footer">${footer}</div>
            </div>`;
    }

    function openProjectInfoModal() {
        const modal = document.getElementById('project-info-modal');
        if (modal) {
            modal.classList.add('open');
            const prodNameInput = document.getElementById('prod-name-input');
            const directorNameInput = document.getElementById('director-name-input');
            if (prodNameInput) prodNameInput.value = projectData.projectInfo.prodName || '';
            if (directorNameInput) directorNameInput.value = projectData.projectInfo.directorName || '';
        }
    }

    function handleSaveProjectInfo() {
        const prodNameInput = document.getElementById('prod-name-input');
        const directorNameInput = document.getElementById('director-name-input');

        if (prodNameInput) projectData.projectInfo.prodName = prodNameInput.value;
        if (directorNameInput) projectData.projectInfo.directorName = directorNameInput.value;
        projectData.projectInfo.projectName = projectData.projectInfo.prodName || "Untitled";
        saveProjectData();

        const modal = document.getElementById('project-info-modal');
        if (modal) modal.classList.remove('open');
    }

    function openTitlePageModal() {
        const modal = document.getElementById('title-page-modal');
        if (modal) {
            modal.classList.add('open');
            const titleInput = document.getElementById('title-input');
            const authorInput = document.getElementById('author-input');
            if (titleInput) titleInput.value = projectData.projectInfo.projectName || '';
            if (authorInput) authorInput.value = projectData.projectInfo.prodName || '';
        }
    }

    function handleSaveTitlePage() {
        const titleInput = document.getElementById('title-input');
        const authorInput = document.getElementById('author-input');

        if (titleInput) projectData.projectInfo.projectName = titleInput.value || "Untitled";
        if (authorInput) projectData.projectInfo.prodName = authorInput.value || "Author";
        saveProjectData();

        const modal = document.getElementById('title-page-modal');
        if (modal) modal.classList.remove('open');
    }

    // Scene navigator functions
    function updateSceneNavigator() {
        const sceneList = document.getElementById('scene-list');
        if (!sceneList || !fountainInput) return;

        const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
        const scenes = elements.filter(el => el.type === 'scene_heading');

        sceneList.innerHTML = scenes.map((scene, index) =>
            `<li data-line="${index}">${scene.text}</li>`
        ).join('');

        console.log(`🗺️ Updated scene navigator with ${scenes.length} scenes`);
    }

    // Comprehensive Event Listeners Setup
    function setupEventListeners() {
        console.log('🔧 Setting up comprehensive event listeners...');

        // Fountain input with enhanced mobile support
        if (fountainInput) {
            fountainInput.addEventListener('focus', () => {
                clearPlaceholder();
                if (window.innerWidth <= 768 && currentView === 'write') {
                    setTimeout(showMobileAccessory, 300);
                }
            });
            
            fountainInput.addEventListener('blur', () => {
                setPlaceholder();
                setTimeout(() => {
                    if (!document.activeElement?.closest('.mobile-keyboard-accessory')) {
                        hideMobileAccessory();
                    }
                }, 200);
            });
            
            fountainInput.addEventListener('input', () => {
                history.add(fountainInput.value);
                saveProjectData();
            });
        }

        // File input
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', openFountainFile);
        }

        // View switching buttons
        const viewSwitchers = [
            { id: 'show-script-btn', view: 'script' },
            { id: 'show-write-btn-header', view: 'write' },
            { id: 'show-write-btn-card-header', view: 'write' },
            { id: 'card-view-btn', view: 'card' }
        ];

        viewSwitchers.forEach(({ id, view }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log(`🔄 ${id} clicked - switching to ${view}`);
                    switchView(view);
                });
            }
        });

        // Hamburger menus
        const hamburgerBtns = ['hamburger-btn', 'hamburger-btn-script', 'hamburger-btn-card'];
        hamburgerBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log(`🍔 ${id} clicked`);
                    if (menuPanel) menuPanel.classList.toggle('open');
                });
            }
        });

        // Scene navigator buttons
        const navigatorBtns = ['scene-navigator-btn', 'scene-navigator-btn-script'];
        navigatorBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log(`🗺️ ${id} clicked`);
                    updateSceneNavigator();
                    if (sceneNavigatorPanel) sceneNavigatorPanel.classList.add('open');
                });
            }
        });

        const closeNavigatorBtn = document.getElementById('close-navigator-btn');
        if (closeNavigatorBtn) {
            closeNavigatorBtn.addEventListener('click', () => {
                if (sceneNavigatorPanel) sceneNavigatorPanel.classList.remove('open');
            });
        }

        // Menu items with handlers
        const menuItems = [
            { id: 'new-btn', handler: () => {
                if (confirm('Are you sure? Unsaved changes will be lost.')) {
                    if (fountainInput) fountainInput.value = '';
                    projectData = { projectInfo: { projectName: "Untitled", prodName: "Author", scriptContent: "" } };
                    history.stack = [""];
                    history.currentIndex = 0;
                    history.updateButtons();
                    saveProjectData();
                    setPlaceholder();
                }
            }},
            { id: 'open-btn', handler: () => fileInput && fileInput.click() },
            { id: 'save-menu-btn', handler: (e) => {
                e.preventDefault();
                const dropdown = e.currentTarget.parentElement;
                if (dropdown) dropdown.classList.toggle('open');
            }},
            { id: 'save-pdf-btn', handler: saveAsPdfWithUnicode },
            { id: 'save-fountain-btn', handler: saveAsFountain },
            { id: 'project-info-btn', handler: openProjectInfoModal },
            { id: 'title-page-btn', handler: openTitlePageModal },
            { id: 'info-btn', handler: () => {
                const modal = document.getElementById('info-modal');
                if (modal) modal.classList.add('open');
            }},
            { id: 'about-btn', handler: () => {
                const modal = document.getElementById('about-modal');
                if (modal) modal.classList.add('open');
            }},
            { id: 'scene-no-btn', handler: toggleSceneNumbers },
            { id: 'auto-save-btn', handler: toggleAutoSave },
            { id: 'save-all-cards-btn', handler: saveAllCardsAsZip }
        ];

        menuItems.forEach(({ id, handler }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
                console.log(`✅ Attached ${id} handler`);
            }
        });

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreen-btn-main');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔳 Fullscreen toggle clicked');
                document.body.classList.toggle('fullscreen-active');
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(console.error);
                } else {
                    document.exitFullscreen().catch(console.error);
                }
            });
        }

        // Action buttons - both desktop and mobile
        document.querySelectorAll('.action-btn, .keyboard-accessory-btn').forEach(btn => {
            btn.addEventListener('click', handleActionBtn);
        });

        // Undo/Redo
        document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top').forEach(btn => {
            btn.addEventListener('click', () => history.undo());
        });

        document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top').forEach(btn => {
            btn.addEventListener('click', () => history.redo());
        });

        // Global click handler for dynamic elements
        document.addEventListener('click', (e) => {
            // Close panels when clicking outside
            if (menuPanel && menuPanel.classList.contains('open') && !menuPanel.contains(e.target) && 
                !e.target.closest('[id^="hamburger-btn"]')) {
                menuPanel.classList.remove('open');
            }

            if (sceneNavigatorPanel && sceneNavigatorPanel.classList.contains('open') && 
                !sceneNavigatorPanel.contains(e.target) && !e.target.closest('[id^="scene-navigator-btn"]')) {
                sceneNavigatorPanel.classList.remove('open');
            }

            // Modal close
            const modal = e.target.closest('.modal');
            if (e.target.classList.contains('modal-close-btn') || e.target === modal) {
                if (modal) modal.classList.remove('open');
            }

            // Dynamic save buttons
            if (e.target.id === 'save-project-info-btn') handleSaveProjectInfo();
            if (e.target.id === 'save-title-btn') handleSaveTitlePage();

            // Card view buttons
            if (e.target.closest('.edit-card-btn')) {
                const btn = e.target.closest('.edit-card-btn');
                const sceneId = btn.dataset.sceneId || btn.closest('.scene-card').dataset.sceneId;
                if (sceneId) editSceneFromCard(sceneId);
            }

            if (e.target.closest('.share-card-btn')) {
                const btn = e.target.closest('.share-card-btn');
                const sceneId = btn.dataset.sceneId || btn.closest('.scene-card').dataset.sceneId;
                if (sceneId) shareSceneCard(sceneId);
            }

            // Card scene number editing
            if (e.target.classList.contains('card-scene-number')) {
                const input = e.target;
                input.addEventListener('change', () => {
                    handleEditSceneNumber(input, input.dataset.sceneId);
                });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        input.blur();
                    }
                });
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (menuPanel) menuPanel.classList.remove('open');
                if (sceneNavigatorPanel) sceneNavigatorPanel.classList.remove('open');
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('open');
                });
            }
        });

        console.log('✅ All event listeners setup complete');
    }

    // Initialize Application
    function initialize() {
        console.log('🎬 Initializing ToscripT Professional - Empowering Filmmakers Worldwide...');

        // Create modals
        createModal('project-info-modal', 'Project Info',
            `<div class="form-group">
                <label for="prod-name-input">Production Name / Title</label>
                <input type="text" id="prod-name-input" placeholder="Enter project title">
            </div>
            <div class="form-group">
                <label for="director-name-input">Author / Writer</label>
                <input type="text" id="director-name-input" placeholder="Enter author name">
            </div>`,
            `<button id="save-project-info-btn" class="main-action-btn">Save Project Info</button>`
        );

        createModal('title-page-modal', 'Title Page',
            `<div class="form-group">
                <label for="title-input">Title</label>
                <input type="text" id="title-input" placeholder="Enter screenplay title">
            </div>
            <div class="form-group">
                <label for="author-input">Author</label>
                <input type="text" id="author-input" placeholder="Enter author name">
            </div>`,
            `<button id="save-title-btn" class="main-action-btn">Save Title Page</button>`
        );

        createModal('about-modal', 'About ToscripT',
            `<div style="text-align: center; margin: 2rem 0;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎬</div>
                <h3 style="color: var(--primary-color); margin: 0;">ToscripT Professional</h3>
                <p style="color: var(--muted-text-color); margin: 0.5rem 0;">Industry-Standard Screenwriting Tool</p>
                <hr style="border-color: var(--border-color); margin: 2rem 0;">
                <p><strong>Designed by Thosho Tech</strong></p>
                <p style="font-size: 0.9rem; color: var(--muted-text-color);">
                    Empowering scriptwriters worldwide with professional tools that work seamlessly on mobile devices.
                </p>
                <div style="margin-top: 2rem;">
                    <p style="font-size: 0.8rem; color: var(--muted-text-color);">
                        ✨ Professional screenplay formatting<br>
                        📱 Mobile keyboard accessory toolbar<br>
                        🎞️ Industry-standard scene cards<br>
                        🌍 Unicode support for all languages<br>
                        📄 Enhanced PDF export<br><br>
                        Bringing positive change to the film industry, one screenplay at a time.
                    </p>
                </div>
            </div>`
        );

        createModal('info-modal', 'Info & Help',
            `<div style="line-height: 1.6;">
                <h3 style="color: var(--primary-color); margin-top: 0;">📝 Fountain Syntax</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>Scene Heading:</strong> Line starts with INT. or EXT.</li>
                    <li><strong>Character:</strong> Any line in all uppercase.</li>
                    <li><strong>Dialogue:</strong> Text following a Character.</li>
                    <li><strong>Parenthetical:</strong> Text in (parentheses).</li>
                    <li><strong>Transition:</strong> CUT TO:, FADE IN:, etc.</li>
                </ul>
                <h3 style="color: var(--primary-color);">📱 Mobile Keyboard Accessory</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>I/E:</strong> Cycles INT./EXT./INT./EXT.</li>
                    <li><strong>D/N:</strong> Cycles DAY/NIGHT/MORNING/EVENING.</li>
                    <li><strong>Aa:</strong> Toggles line to UPPERCASE/lowercase.</li>
                    <li><strong>():</strong> Wraps selected text in parentheses.</li>
                    <li><strong>TO:</strong> Cycles transition types.</li>
                </ul>
                <h3 style="color: var(--primary-color);">🎞️ Scene Cards (Industry Standard)</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>Content:</strong> Scene heading + description only</li>
                    <li><strong>Edit Scene Numbers:</strong> Click number to change</li>
                    <li><strong>Drag & Drop:</strong> Reorder scenes by dragging</li>
                    <li><strong>Clean Export:</strong> Images exclude edit buttons</li>
                    <li><strong>ZIP Export:</strong> All cards as text files</li>
                </ul>
                <p style="margin-top: 2rem; font-size: 0.9rem; color: var(--muted-text-color); text-align: center;">
                    Professional screenplay formatting follows exact industry standards automatically.
                </p>
            </div>`
        );

        setupEventListeners();
        setupAdvancedKeyboardDetection();
        loadProjectData();

        if (fountainInput) {
            if (fountainInput.value === '') {
                setPlaceholder();
            }
            
            // Enhanced mobile focus
            setTimeout(() => {
                if (currentView === 'write') {
                    fountainInput.focus();
                }
            }, 500);
        }

        // Mobile toolbar management
        function updateMobileAccessoryVisibility() {
            if (window.innerWidth <= 768) {
                if (currentView === 'write' && (document.activeElement === fountainInput || document.body.classList.contains('input-focused'))) {
                    showMobileAccessory();
                } else {
                    hideMobileAccessory();
                }
            } else {
                hideMobileAccessory();
            }
        }

        window.addEventListener('resize', updateMobileAccessoryVisibility);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateMobileAccessoryVisibility, 500);
        });

        history.add(fountainInput ? fountainInput.value : '');

        console.log('✅ ToscripT Professional initialized successfully!');
        console.log('🎯 Ready to help screenwriters create amazing stories!');
        console.log('📱 Mobile keyboard accessory will appear above keyboard when typing');
        console.log('🎞️ Professional scene cards with drag-and-drop sorting enabled');
        console.log('🌍 Full Unicode support for international screenwriters');
    }

    // Start the application
    setTimeout(initialize, 100);
});
