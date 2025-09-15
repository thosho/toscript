document.addEventListener('DOMContentLoaded', () => {
    console.log("ToscripT Initializing for Filmmakers Worldwide 🎬");
    
    // Global variables
    let projectData = { projectInfo: { projectName: "Untitled", prodName: "Author", scriptContent: "" } };
    let fontSize = 16;
    let autoSaveInterval = null;
    let showSceneNumbers = true;
    let currentView = 'write';
    let isKeyboardOpen = false;
    let keyboardHeight = 0;

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
    const mobileToolbar = document.getElementById('mobile-keyboard-toolbar');

    const placeholderText = `TITLE: THE CRIMSON DOSSIER
AUTHOR: YOUR NAME

INT. DETECTIVE'S OFFICE - NIGHT

The office is a mess of old files. DETECTIVE VIKRAM (40s, tired) stares at a cold cup of coffee.

A mysterious client, MAYA (30s, elegant), enters from the shadows.

MAYA
(softly)
Are you the one they call the Ghost of Bangalore?

VIKRAM
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

    // Enhanced Mobile Keyboard Detection - Like in your reference image
    function setupAdvancedKeyboardDetection() {
        let initialViewportHeight = window.innerHeight;
        let previousHeight = initialViewportHeight;
        
        function handleKeyboardChange() {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            const wasKeyboardOpen = isKeyboardOpen;
            
            // Detect keyboard open (height reduced by more than 150px indicates keyboard)
            isKeyboardOpen = heightDifference > 150;
            keyboardHeight = isKeyboardOpen ? heightDifference : 0;
            
            if (isKeyboardOpen !== wasKeyboardOpen) {
                updateMobileToolbarPosition();
            }
            
            previousHeight = currentHeight;
        }

        // Modern browsers - Visual Viewport API
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleKeyboardChange);
            console.log('Using Visual Viewport API for keyboard detection');
        } else {
            // Fallback for older browsers
            window.addEventListener('resize', handleKeyboardChange);
            console.log('Using resize fallback for keyboard detection');
        }

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                initialViewportHeight = window.innerHeight;
                handleKeyboardChange();
            }, 500);
        });

        // Enhanced focus/blur detection
        if (fountainInput) {
            fountainInput.addEventListener('focus', () => {
                setTimeout(() => {
                    document.body.classList.add('keyboard-open');
                    showMobileToolbar();
                }, 300);
            });

            fountainInput.addEventListener('blur', () => {
                setTimeout(() => {
                    document.body.classList.remove('keyboard-open');
                    if (!isKeyboardOpen) {
                        hideMobileToolbar();
                    }
                }, 100);
            });
        }
    }

    function updateMobileToolbarPosition() {
        if (!mobileToolbar || window.innerWidth > 768) return;
        
        if (isKeyboardOpen && currentView === 'write') {
            showMobileToolbar();
        } else {
            hideMobileToolbar();
        }
    }

    function showMobileToolbar() {
        if (mobileToolbar && window.innerWidth <= 768 && currentView === 'write') {
            mobileToolbar.classList.add('show');
            mobileToolbar.style.display = 'block';
            mobileToolbar.style.opacity = '1';
            mobileToolbar.style.visibility = 'visible';
            mobileToolbar.style.transform = 'translateY(0)';
            console.log('Mobile toolbar shown above keyboard');
        }
    }

    function hideMobileToolbar() {
        if (mobileToolbar) {
            mobileToolbar.classList.remove('show');
            mobileToolbar.style.opacity = '0';
            mobileToolbar.style.visibility = 'hidden';
            mobileToolbar.style.transform = 'translateY(100%)';
            setTimeout(() => {
                if (!mobileToolbar.classList.contains('show')) {
                    mobileToolbar.style.display = 'none';
                }
            }, 300);
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

    // Enhanced View Switching with Proper Headers
    function switchView(view) {
        console.log(`Switching to ${view} view`);
        currentView = view;

        // Hide all views and headers
        [writeView, scriptView, cardView].forEach(v => {
            if (v) v.classList.remove('active');
        });
        [mainHeader, scriptHeader, cardHeader].forEach(h => {
            if (h) h.style.display = 'none';
        });

        // Hide mobile toolbar by default
        hideMobileToolbar();

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
            
            // Show mobile toolbar on mobile in write view
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    if (fountainInput && document.activeElement === fountainInput) {
                        showMobileToolbar();
                    }
                }, 100);
            }
            
            setTimeout(() => {
                if (fountainInput) fountainInput.focus();
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
        console.log(`Scene numbers ${showSceneNumbers ? 'enabled' : 'disabled'}`);
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

    // Industry Standard Screenplay Formatting Engine
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

            // Scene headings - Must start with INT., EXT., or INT./EXT.
            if (/^(INT\.?\/EXT\.?|INT\.|EXT\.)\s+/i.test(trimmed)) {
                sceneCount++;
                const sceneNumber = showSceneNumbers ? sceneCount : null;
                elements.push({ 
                    type: 'scene_heading', 
                    text: trimmed.toUpperCase(), 
                    original,
                    sceneNumber
                });
                return;
            }

            // Transitions - All caps, ends with TO:, or specific transition words
            if (/^(CUT TO:|DISSOLVE TO:|FADE TO BLACK\.|FADE OUT\.|FADE IN:|SMASH CUT TO:|MATCH CUT TO:|JUMP CUT TO:)$/i.test(trimmed) ||
                (trimmed === trimmed.toUpperCase() && trimmed.endsWith('TO:') && trimmed.length < 20)) {
                elements.push({ type: 'transition', text: trimmed.toUpperCase(), original });
                return;
            }

            // Character names - All caps, centered, less than 50 chars, not a scene heading
            if (trimmed === trimmed.toUpperCase() && 
                trimmed.length > 0 && 
                trimmed.length < 50 && 
                !trimmed.includes('.') && 
                !trimmed.endsWith(':') &&
                !/^(FADE|CUT|DISSOLVE|SMASH|MATCH|JUMP)/.test(trimmed)) {
                
                // Check if next non-empty line could be dialogue
                let nextIndex = index + 1;
                while (nextIndex < lines.length && lines[nextIndex].trim() === '') nextIndex++;
                if (nextIndex < lines.length) {
                    const nextLine = lines[nextIndex].trim();
                    // If next line is not a scene heading, transition, or another character, this is likely a character
                    if (!(/^(INT\.?\/EXT\.?|INT\.|EXT\.)\s+/i.test(nextLine)) &&
                        !(nextLine === nextLine.toUpperCase() && nextLine.endsWith('TO:')) &&
                        !(nextLine === nextLine.toUpperCase() && nextLine.length < 50 && !nextLine.includes('.'))) {
                        elements.push({ type: 'character', text: trimmed, original });
                        return;
                    }
                }
            }

            // Parentheticals - Enclosed in parentheses
            if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                elements.push({ type: 'parenthetical', text: trimmed, original });
                return;
            }

            // Everything else is action/description
            elements.push({ type: 'action', text: trimmed, original });
        });

        return elements;
    }

    // Enhanced Script Rendering with Industry Standards
    function renderEnhancedScript() {
        if (!screenplayOutput || !fountainInput) return;

        const text = fountainInput.value || '';
        const elements = parseScriptWithIndustryStandards(text);
        let scriptHtml = '';
        let hasTitlePage = false;

        // Check for title page elements
        const titleElements = elements.filter(el => el.type === 'title');
        if (titleElements.length > 0) {
            hasTitlePage = true;
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
            // Default title page
            scriptHtml += `<div class="title-page">
                <h1>${projectData.projectInfo.projectName || 'Untitled'}</h1>
                <p class="author">by ${projectData.projectInfo.prodName || 'Author'}</p>
            </div>`;
        }

        // Render script elements
        elements.forEach(element => {
            if (element.type === 'title') return; // Skip, already handled in title page

            switch (element.type) {
                case 'empty':
                    scriptHtml += '<br>';
                    break;
                case 'scene_heading':
                    const sceneNum = element.sceneNumber ? `${element.sceneNumber}. ` : '';
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
                default: // action
                    if (element.text) {
                        scriptHtml += `<div class="action">${element.text}</div>`;
                    }
            }
        });

        screenplayOutput.innerHTML = scriptHtml;
    }

    // Enhanced Card View with Better Export
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
                    content: [],
                    elements: []
                };
            } else if (currentScene && element.text && element.type !== 'title' && element.type !== 'empty') {
                currentScene.content.push(element.text);
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
                    <div class="card-header">#${scene.sceneNumber} ${scene.heading}</div>
                    <div class="card-body">${scene.content.join('\n')}</div>
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

        console.log(`Rendered ${scenes.length} scene cards`);
    }

    // Action button handler with enhanced functionality
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
                // Ensure toolbar stays visible
                if (window.innerWidth <= 768 && currentView === 'write') {
                    showMobileToolbar();
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

    // Enhanced PDF with Unicode support
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
                    console.log('Unicode font loaded successfully');
                } else {
                    throw new Error('Font not loaded');
                }
            } catch (e) {
                console.warn('Using fallback font:', e);
                doc.setFont('helvetica');
            }

            const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
            let y = 50;
            const lineHeight = 14;
            const pageHeight = 792;
            const margin = 72; // 1 inch margin

            // Title page
            doc.setFontSize(18);
            const title = projectData.projectInfo.projectName || 'Untitled';
            doc.text(title, 300, y, { align: 'center' });
            y += 30;

            doc.setFontSize(14);
            const author = `by ${projectData.projectInfo.prodName || 'Author'}`;
            doc.text(author, 300, y, { align: 'center' });
            y += 80;

            doc.setFontSize(12);

            // Process each element with proper indentation
            elements.forEach(element => {
                if (element.type === 'title') return; // Skip title elements

                if (y > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }

                let x = margin;
                let fontSize = 12;

                switch (element.type) {
                    case 'scene_heading':
                        fontSize = 12;
                        y += lineHeight;
                        doc.setFontSize(fontSize);
                        const sceneText = element.sceneNumber ? `${element.sceneNumber}. ${element.text}` : element.text;
                        doc.text(sceneText, x, y);
                        break;
                    case 'character':
                        x = margin + 158; // 2.2 inches from left
                        doc.setFontSize(fontSize);
                        doc.text(element.text, x, y);
                        break;
                    case 'dialogue':
                        x = margin + 72; // 1 inch from left
                        doc.setFontSize(fontSize);
                        const dialogueText = doc.splitTextToSize(element.text, 252); // 3.5 inch width
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
                        x = margin + 115; // 1.6 inches from left
                        doc.setFontSize(fontSize);
                        doc.text(element.text, x, y);
                        break;
                    case 'transition':
                        doc.setFontSize(fontSize);
                        doc.text(element.text, pageWidth - margin, y, { align: 'right' });
                        break;
                    case 'action':
                        doc.setFontSize(fontSize);
                        const actionText = doc.splitTextToSize(element.text, 432); // 6 inch width
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
            console.log('Enhanced PDF generated successfully');
            
        } catch (error) {
            console.error('PDF generation failed:', error);
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
            charPosition += elements[i].original.length + 1; // +1 for newline
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
                    allowTaint: true
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
                // Fallback: share text content
                const cardHeader = cardElement.querySelector('.card-header').textContent;
                const cardBody = cardElement.querySelector('.card-body').textContent;
                const content = `${cardHeader}\n\n${cardBody}`;
                
                if (navigator.share) {
                    await navigator.share({
                        title: cardHeader,
                        text: content
                    });
                } else {
                    await navigator.clipboard.writeText(content);
                    alert('Scene copied to clipboard!');
                }
            }
        } catch (err) {
            console.error('Share failed:', err);
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
                // Fallback: save individual text files
                alert('ZIP library not available. Saving individual scene files...');
                const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
                const scenes = extractScenesFromElements(elements);
                
                scenes.forEach(scene => {
                    const sceneText = `${scene.heading}\n\n${scene.content.join('\n')}`;
                    const blob = new Blob([sceneText], { type: 'text/plain;charset=utf-8' });
                    downloadBlob(blob, `Scene_${scene.sceneNumber}.txt`);
                });
                return;
            }

            const zip = new JSZip();
            const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
            const scenes = extractScenesFromElements(elements);

            // Add each scene to ZIP
            scenes.forEach(scene => {
                const sceneText = `${scene.heading}\n\n${scene.content.join('\n')}`;
                zip.file(`Scene_${scene.sceneNumber}.txt`, sceneText);
            });

            // Add project info
            const projectInfo = `Project: ${projectData.projectInfo.projectName}\nAuthor: ${projectData.projectInfo.prodName}\nTotal Scenes: ${scenes.length}\nGenerated: ${new Date().toLocaleString()}\n\nGenerated by ToscripT - Empowering Filmmakers Worldwide 🎬`;
            zip.file('Project_Info.txt', projectInfo);

            // Generate ZIP and download
            const content = await zip.generateAsync({ type: 'blob' });
            downloadBlob(content, `${projectData.projectInfo.projectName}_Scenes.zip`);
            
            alert(`Successfully saved ${scenes.length} scenes as a ZIP file!`);
        } catch (error) {
            console.error('ZIP creation failed:', error);
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
                    content: []
                };
            } else if (currentScene && element.text && element.type !== 'title' && element.type !== 'empty') {
                currentScene.content.push(element.text);
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

        console.log(`Updated scene navigator with ${scenes.length} scenes`);
    }

    // Comprehensive Event Listeners Setup
    function setupEventListeners() {
        console.log('Setting up comprehensive event listeners...');

        // Fountain input with enhanced mobile support
        if (fountainInput) {
            fountainInput.addEventListener('focus', () => {
                clearPlaceholder();
                // Enhanced mobile keyboard detection
                if (window.innerWidth <= 768 && currentView === 'write') {
                    setTimeout(() => {
                        showMobileToolbar();
                    }, 300);
                }
            });
            
            fountainInput.addEventListener('blur', () => {
                setPlaceholder();
                // Don't hide toolbar immediately on blur - user might be clicking a button
                setTimeout(() => {
                    if (document.activeElement !== fountainInput && !document.activeElement.closest('.mobile-keyboard-toolbar')) {
                        hideMobileToolbar();
                    }
                }, 100);
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

        // View switching buttons - ENHANCED
        const showScriptBtn = document.getElementById('show-script-btn');
        if (showScriptBtn) {
            showScriptBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('TO SCRIPT clicked');
                switchView('script');
            });
        }

        const showWriteBtnHeader = document.getElementById('show-write-btn-header');
        if (showWriteBtnHeader) {
            showWriteBtnHeader.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('TO WRITE clicked from script view');
                switchView('write');
            });
        }

        const showWriteBtnCardHeader = document.getElementById('show-write-btn-card-header');
        if (showWriteBtnCardHeader) {
            showWriteBtnCardHeader.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('TO WRITE clicked from card view');
                switchView('write');
            });
        }

        const cardViewBtn = document.getElementById('card-view-btn');
        if (cardViewBtn) {
            cardViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                switchView('card');
            });
        }

        // Hamburger menus - ALL VARIANTS
        const hamburgerBtns = ['hamburger-btn', 'hamburger-btn-script', 'hamburger-btn-card'];
        hamburgerBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log(`${id} clicked - toggling menu panel`);
                    if (menuPanel) menuPanel.classList.toggle('open');
                });
            }
        });

        // Scene navigator (RIGHT side button) - ALL VARIANTS
        const sceneNavigatorBtns = ['scene-navigator-btn', 'scene-navigator-btn-script'];
        sceneNavigatorBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log(`${id} clicked`);
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

        // Menu items - ENHANCED
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
                console.log(`Attached ${id} handler`);
            }
        });

        // Fullscreen button - FIXED
        const fullscreenBtn = document.getElementById('fullscreen-btn-main');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Fullscreen toggle clicked');
                document.body.classList.toggle('fullscreen-active');
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(console.error);
                } else {
                    document.exitFullscreen().catch(console.error);
                }
            });
        }

        // Action buttons - BOTH DESKTOP AND MOBILE
        document.querySelectorAll('.action-btn, .mobile-action-btn').forEach(btn => {
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
            // Close menu panel when clicking outside
            if (menuPanel && menuPanel.classList.contains('open') && !menuPanel.contains(e.target) && 
                !e.target.closest('[id^="hamburger-btn"]')) {
                menuPanel.classList.remove('open');
            }

            // Close scene navigator when clicking outside
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

            // Card view buttons (dynamically created)
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
        console.log('🎬 Initializing ToscripT - Empowering Filmmakers Worldwide...');

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
                <h3 style="color: var(--primary-color); margin: 0;">ToscripT</h3>
                <p style="color: var(--muted-text-color); margin: 0.5rem 0;">Professional Screenwriting Tool</p>
                <hr style="border-color: var(--border-color); margin: 2rem 0;">
                <p><strong>Designed by Thosho Tech</strong></p>
                <p style="font-size: 0.9rem; color: var(--muted-text-color);">
                    Empowering scriptwriters worldwide with professional tools that work seamlessly on mobile devices.
                </p>
                <div style="margin-top: 2rem;">
                    <p style="font-size: 0.8rem; color: var(--muted-text-color);">
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
                <h3 style="color: var(--primary-color);">📱 Mobile Buttons</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>I/E:</strong> Cycles INT./EXT./INT./EXT.</li>
                    <li><strong>D/N:</strong> Cycles DAY/NIGHT/MORNING/EVENING.</li>
                    <li><strong>Aa:</strong> Toggles line to UPPERCASE/lowercase.</li>
                    <li><strong>():</strong> Wraps selected text in parentheses.</li>
                    <li><strong>TO:</strong> Cycles transition types.</li>
                </ul>
                <h3 style="color: var(--primary-color);">🎞️ Card View Features</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>Edit:</strong> Jump to scene in editor</li>
                    <li><strong>Share:</strong> Share individual scene as clean image</li>
                    <li><strong>Save All Cards:</strong> Download all scenes as ZIP</li>
                </ul>
                <p style="margin-top: 2rem; font-size: 0.9rem; color: var(--muted-text-color); text-align: center;">
                    Professional screenplay formatting follows industry standards automatically.
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
        function updateMobileToolbarVisibility() {
            if (window.innerWidth <= 768) {
                if (currentView === 'write' && document.activeElement === fountainInput) {
                    showMobileToolbar();
                } else {
                    hideMobileToolbar();
                }
            } else {
                hideMobileToolbar();
            }
        }

        window.addEventListener('resize', updateMobileToolbarVisibility);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateMobileToolbarVisibility, 500);
        });

        history.add(fountainInput ? fountainInput.value : '');

        console.log('🌟 ToscripT initialized successfully!');
        console.log('🎯 Ready to help screenwriters create amazing stories!');
        console.log('📱 Mobile keyboard toolbar will appear above keyboard when typing');
    }

    // Start the application
    setTimeout(initialize, 100);
});
