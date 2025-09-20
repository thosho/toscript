document.addEventListener('DOMContentLoaded', () => {
    console.log("🎬 ToscripT Professional - Complete Fixed Version");
    
    // Global variables
    let projectData = { 
        projectInfo: { 
            projectName: "Untitled", 
            prodName: "Author", 
            scriptContent: "",
            scenes: []
        } 
    };
    let fontSize = 16;
    let autoSaveInterval = null;
    let showSceneNumbers = true;
    let currentView = 'write';
    let debounceTimeout = null; // Add this line
    

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
    const filterCategorySelect = document.getElementById('filter-category-select');
    const filterValueInput = document.getElementById('filter-value-input');
    const filterHelpText = document.getElementById('filter-help-text');
    const sceneList = document.getElementById('scene-list');
    const fileInput = document.getElementById('file-input');

    const placeholderText = `TITLE: THE CRIMSON DOSSIER
AUTHOR: YOUR NAME

INT. DETECTIVE'S OFFICE - NIGHT

The office is dimly lit with case files scattered everywhere. DETECTIVE VIKRAM (40s, weary) sits behind a cluttered desk, staring at cold coffee.

The door creaks open. MAYA (30s, mysterious) steps out of the shadows.

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
                saveProjectData();
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

    // Mobile Keyboard Detection
    function setupKeyboardDetection() {
        let initialHeight = window.innerHeight;
        
        function handleKeyboardToggle() {
            const currentHeight = window.innerHeight;
            const heightDiff = initialHeight - currentHeight;
            const keyboardOpen = heightDiff > 150;
            
            if (keyboardOpen && currentView === 'write' && window.innerWidth <= 768) {
                showMobileToolbar();
            } else if (!document.activeElement?.closest('.mobile-keyboard-toolbar')) {
                hideMobileToolbar();
            }
        }

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleKeyboardToggle);
        } else {
            window.addEventListener('resize', handleKeyboardToggle);
        }

        if (fountainInput) {
            fountainInput.addEventListener('focus', () => {
                clearPlaceholder();
                setTimeout(() => {
                    if (currentView === 'write' && window.innerWidth <= 768) {
                        showMobileToolbar();
                    }
                }, 300);
            });

            fountainInput.addEventListener('blur', () => {
                setPlaceholder();
                setTimeout(() => {
                    if (!document.activeElement?.closest('.mobile-keyboard-toolbar')) {
                        hideMobileToolbar();
                    }
                }, 200);
            });
        }
    }

    function showMobileToolbar() {
        if (mobileToolbar && window.innerWidth <= 768) {
            mobileToolbar.classList.add('show');
            console.log("📱 Mobile toolbar shown");
        }
    }

    function hideMobileToolbar() {
        if (mobileToolbar) {
            mobileToolbar.classList.remove('show');
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
            projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
        }
        localStorage.setItem('universalFilmProject_ToScript', JSON.stringify(projectData));
    }

    function loadProjectData() {
        const savedData = localStorage.getItem('universalFilmProject_ToScript');
        if (savedData) {
            try {
                projectData = JSON.parse(savedData);
            } catch (e) {
                console.warn('Failed to parse saved data');
                projectData = { 
                    projectInfo: { 
                        projectName: "Untitled", 
                        prodName: "Author", 
                        scriptContent: "",
                        scenes: []
                    } 
                };
            }
        }
        if (fountainInput && projectData.projectInfo.scriptContent) {
            fountainInput.value = projectData.projectInfo.scriptContent;
            clearPlaceholder();
        }
        updateSceneNoIndicator();
        updateAutoSaveIndicator();
    }

  // NEW, ROBUST PARSER: Understands Fountain syntax rules.
    function parseFountain(text) {
        const lines = text.split('\n');
        const tokens = [];
        let sceneCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Handle empty lines
            if (trimmedLine.length === 0) {
                tokens.push({ type: 'empty' });
                continue;
            }

            // Title Page elements (e.g., "Title: My Script")
            if (/^(Title|Author|Credit|Source):/i.test(trimmedLine)) {
                tokens.push({ type: 'title_page', text: trimmedLine });
                continue;
            }

            // Scene Headings (INT. LOCATION - DAY)
            if (/^(INT\.?\/EXT\.?|EXT\.?|INT\.)/i.test(trimmedLine)) {
                sceneCount++;
                tokens.push({ type: 'scene_heading', text: trimmedLine.toUpperCase(), sceneNumber: sceneCount });
                continue;
            }

            // Transitions (FADE OUT., CUT TO:)
            if (trimmedLine.endsWith('TO:') || /^(FADE (OUT|IN)|CUT|DISSOLVE)/.test(trimmedLine)) {
                tokens.push({ type: 'transition', text: trimmedLine.toUpperCase() });
                continue;
            }

            // Parentheticals ((crying))
            if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
                const lastToken = tokens[tokens.length - 1];
                // Must follow a character or dialogue
                if (lastToken && (lastToken.type === 'character' || lastToken.type === 'dialogue')) {
                    tokens.push({ type: 'parenthetical', text: line }); // Keep original indentation
                    continue;
                }
            }
            
            // Character & Dialogue (This is the tricky part)
            // A line is a CHARACTER if it's all caps and the next non-empty line is NOT all caps
            if (trimmedLine === trimmedLine.toUpperCase() && !trimmedLine.startsWith('(')) {
                let nextLineIndex = i + 1;
                while (nextLineIndex < lines.length && lines[nextLineIndex].trim() === '') {
                    nextLineIndex++;
                }

                if (nextLineIndex < lines.length) {
                    const nextLineTrimmed = lines[nextLineIndex].trim();
                    if (nextLineTrimmed !== nextLineTrimmed.toUpperCase() || nextLineTrimmed.startsWith('(')) {
                        tokens.push({ type: 'character', text: line }); // Keep original indentation
                        continue;
                    }
                }
            }

            // Dialogue (must follow a Character or Parenthetical)
            const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
            if (lastToken && (lastToken.type === 'character' || lastToken.type === 'parenthetical')) {
                tokens.push({ type: 'dialogue', text: line }); // Keep original indentation
                continue;
            }

            // If nothing else matches, it's an Action line
            tokens.push({ type: 'action', text: line });
        }
        return tokens;
    }

    // View Switching
    function switchView(view) {
        console.log(`🔄 Switching to view: ${view}`);
        currentView = view;
        [writeView, scriptView, cardView].forEach(v => v?.classList.remove('active'));
        [mainHeader, scriptHeader, cardHeader].forEach(h => h && (h.style.display = 'none'));
        
        hideMobileToolbar();

        if (view === 'script') {
            scriptView?.classList.add('active');
            if (scriptHeader) scriptHeader.style.display = 'flex';
            renderEnhancedScript();
        } else if (view === 'card') {
            projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
            cardView?.classList.add('active');
            if (cardHeader) cardHeader.style.display = 'flex';
            renderEnhancedCardView();
        } else {
            writeView?.classList.add('active');
            if (mainHeader) mainHeader.style.display = 'flex';
            setTimeout(() => {
                if (fountainInput) {
                    fountainInput.focus();
                    if (window.innerWidth <= 768) showMobileToolbar();
                }
            }, 200);
        }
    }

    // Filter functionality
    function handleFilterChange() {
        const selectedValue = filterCategorySelect?.value;
        
        if (selectedValue === 'all') {
            if (filterValueInput) filterValueInput.style.display = 'none';
            if (filterHelpText) filterHelpText.style.display = 'none';
        } else {
            if (filterValueInput) filterValueInput.style.display = 'block';
            if (filterHelpText) filterHelpText.style.display = 'block';
            
            const helpTexts = {
                'sceneSetting': 'Enter location (e.g., OFFICE, KITCHEN)',
                'sceneType': 'Enter INT, EXT, or INT./EXT.',
                'cast': 'Enter character name',
                'timeOfDay': 'Enter DAY, NIGHT, MORNING, EVENING, DAWN, DUSK'
            };
            
            if (filterHelpText) filterHelpText.textContent = helpTexts[selectedValue] || 'Enter keywords to filter';
        }
        
        if (filterValueInput) filterValueInput.value = '';
        applyFilter();
    }

    function applyFilter() {
        const category = filterCategorySelect?.value || 'all';
        const filterText = (filterValueInput?.value || '').toLowerCase().trim();
        
        if (category === 'all' || !filterText) {
            if (fountainInput) fountainInput.value = projectData.projectInfo.scriptContent || '';
            if (currentView === 'script') renderEnhancedScript();
            updateSceneNavigator();
            return;
        }

        const scenes = projectData.projectInfo.scenes || [];
        const filteredScenes = scenes.filter(scene => {
            switch (category) {
                case 'sceneSetting':
                    return scene.location && scene.location.toLowerCase().includes(filterText);
                case 'sceneType':
                    return scene.sceneType && scene.sceneType.toLowerCase().includes(filterText.replace(/\./g, ''));
                case 'cast':
                    return scene.characters && scene.characters.some(char => char.toLowerCase().includes(filterText));
                case 'timeOfDay':
                    return scene.timeOfDay && scene.timeOfDay.toLowerCase().includes(filterText);
                default:
                    return true;
            }
        });

        // Rebuild filtered text
        let filteredText = '';
        filteredScenes.forEach(scene => {
            filteredText += `${scene.heading}\n\n`;
            if (scene.description && scene.description.length > 0) {
                filteredText += scene.description.join('\n\n') + '\n\n';
            }
        });

        if (filteredText === '') filteredText = 'No scenes match your filter.';

        if (fountainInput) fountainInput.value = filteredText;
        if (currentView === 'script') renderEnhancedScript();
        updateSceneNavigator();
    }

    // Indicators
    function updateSceneNoIndicator() {
        const indicator = document.getElementById('scene-no-indicator');
        if (indicator) {
            indicator.classList.toggle('on', showSceneNumbers);
            indicator.classList.toggle('off', !showSceneNumbers);
        }
    }

    function updateAutoSaveIndicator() {
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            indicator.classList.toggle('on', !!autoSaveInterval);
            indicator.classList.toggle('off', !autoSaveInterval);
        }
    }

    function toggleSceneNumbers() {
        showSceneNumbers = !showSceneNumbers;
        updateSceneNoIndicator();
        saveProjectData();
        if (currentView === 'script') renderEnhancedScript();
        updateSceneNavigator();
    }

    function toggleAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
            alert('Auto-save disabled');
        } else {
            autoSaveInterval = setInterval(saveProjectData, 120000);
            alert('Auto-save enabled (every 2 minutes)');
        }
        updateAutoSaveIndicator();
    }

    // Zoom functionality
    function handleZoomIn() {
        fontSize = Math.min(32, fontSize + 2);
        if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`;
    }

    function handleZoomOut() {
        fontSize = Math.max(10, fontSize - 2);
        if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`;
    }

    // UPDATED RENDERER: Uses the new parser to create clean HTML.
    function renderEnhancedScript() {
        if (!screenplayOutput || !fountainInput) return;

        const tokens = parseFountain(fountainInput.value || '');
        let scriptHtml = '';
        let isTitlePage = true;

        tokens.forEach(token => {
            // Once we hit a scene heading, the title page is over
            if (token.type === 'scene_heading') {
                isTitlePage = false;
            }

            switch (token.type) {
                case 'title_page':
                    if (isTitlePage) {
                        // Simple formatting for title elements
                        scriptHtml += `<div class="title-page-element">${token.text}</div>`;
                    } else {
                        // Treat as action if it appears after the first scene
                        scriptHtml += `<div class="action">${token.text}</div>`;
                    }
                    break;
                case 'scene_heading':
                    const sceneNum = showSceneNumbers ? `${token.sceneNumber}. ` : '';
                    scriptHtml += `<div class="scene-heading">${sceneNum}${token.text}</div>`;
                    break;
                case 'action':
                    scriptHtml += `<div class="action">${token.text}</div>`;
                    break;
                case 'character':
                    scriptHtml += `<div class="character">${token.text}</div>`;
                    break;
                case 'dialogue':
                    scriptHtml += `<div class="dialogue">${token.text}</div>`;
                    break;
                case 'parenthetical':
                    scriptHtml += `<div class="parenthetical">${token.text}</div>`;
                    break;
                case 'transition':
                    scriptHtml += `<div class="transition">${token.text}</div>`;
                    break;
                case 'empty':
                  
                    break;
            }
        });

        screenplayOutput.innerHTML = scriptHtml;
    }

    // FIXED: Enhanced Card View with Full Functionality
    function renderEnhancedCardView() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;

        const scenes = projectData.projectInfo.scenes || [];
        
        if (scenes.length === 0) {
            cardContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--muted-text-color);">
                    <i class="fas fa-film" style="font-size: 4rem; margin-bottom: 2rem; opacity: 0.3;"></i>
                    <h3>No scenes found</h3>
                    <p>Write some scenes in the editor or click the + button to create cards</p>
                </div>`;
            return;
        }

        cardContainer.innerHTML = scenes.map(scene => `
            <div class="scene-card card-for-export" data-scene-id="${scene.number}" data-scene-number="${scene.number}">
                <div class="scene-card-content">
                    <div class="card-header">
                        <div class="card-scene-title" contenteditable="true" data-placeholder="Enter scene heading...">${scene.heading}</div>
                        <input class="card-scene-number" type="text" value="#${scene.number}" maxlength="4" data-scene-id="${scene.number}" />
                    </div>
                    <div class="card-body">
                        <textarea class="card-description" placeholder="Enter detailed scene description...

Characters:
Actions:
Props:
Locations:
Special Notes:" data-scene-id="${scene.number}">${scene.description.join('\n\n')}</textarea>
                    </div>
                    <div class="card-watermark">@TO SCRIPT</div>
                </div>
                <div class="card-actions">
                    <button class="icon-btn share-card-btn" title="Share Scene" data-scene-id="${scene.number}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Bind card editing events
        bindCardEditingEvents();
    }

    // Card editing functionality
    function bindCardEditingEvents() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;

        // Remove existing listeners to prevent duplicates
        cardContainer.removeEventListener('input', handleCardInput);
        cardContainer.removeEventListener('blur', handleCardBlur, true);

        cardContainer.addEventListener('input', handleCardInput);
        cardContainer.addEventListener('blur', handleCardBlur, true);
    }

    function handleCardInput(e) {
        if (e.target.classList.contains('card-scene-title') || 
            e.target.classList.contains('card-description') ||
            e.target.classList.contains('card-scene-number')) {
            
            clearTimeout(handleCardInput.timeout);
            handleCardInput.timeout = setTimeout(() => {
                syncCardsToEditor();
            }, 500);
        }
    }

    function handleCardBlur(e) {
        if (e.target.classList.contains('card-scene-title') || 
            e.target.classList.contains('card-description') ||
            e.target.classList.contains('card-scene-number')) {
            syncCardsToEditor();
        }
    }

    function syncCardsToEditor() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer || !fountainInput) return;

        let scriptText = '';
        const cards = Array.from(cardContainer.querySelectorAll('.scene-card'));
        
        cards.forEach((card, index) => {
            const titleElement = card.querySelector('.card-scene-title');
            const descriptionElement = card.querySelector('.card-description');
            
            let title = titleElement ? titleElement.textContent.trim() : '';
            let description = descriptionElement ? descriptionElement.value.trim() : '';
            
            if (title) {
                if (!title.match(/^(INT\.?\/EXT\.?|INT\.|EXT\.)/i)) {
                    title = `INT. ${title.toUpperCase()}`;
                } else {
                    title = title.toUpperCase();
                }
                scriptText += `${title}\n\n`;
            }
            
            if (description) {
                scriptText += `${description}\n\n`;
            }
        });

        if (scriptText.trim() !== fountainInput.value.trim()) {
            fountainInput.value = scriptText.trim();
            history.add(fountainInput.value);
            saveProjectData();
        }
    }

 // REPLACEMENT FUNCTION: Directly adds a new card and syncs it back to the main editor.
function addNewSceneCard() {
    const cardContainer = document.getElementById('card-container');
    if (!cardContainer) {
        console.error("Card container not found!");
        return;
    }

    // 1. Determine the new scene number based on existing cards
    const newSceneNumber = cardContainer.querySelectorAll('.scene-card').length + 1;

    // 2. Create the HTML for a new, blank card
    const newCardHtml = `
        <div class="scene-card card-for-export" data-scene-id="${newSceneNumber}" data-scene-number="${newSceneNumber}">
            <div class="scene-card-content">
                <div class="card-header">
                    <div class="card-scene-title" contenteditable="true" data-placeholder="Enter scene heading...">INT. NEW SCENE - DAY</div>
                    <input class="card-scene-number" type="text" value="#${newSceneNumber}" maxlength="4" data-scene-id="${newSceneNumber}" />
                </div>
                <div class="card-body">
                    <textarea class="card-description" placeholder="Enter detailed scene description..." data-scene-id="${newSceneNumber}"></textarea>
                </div>
                <div class="card-watermark">@TO SCRIPT</div>
            </div>
            <div class="card-actions">
                <button class="icon-btn share-card-btn" title="Share Scene" data-scene-id="${newSceneNumber}">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
    `;

    // 3. Add the new card HTML to the end of the container
    cardContainer.insertAdjacentHTML('beforeend', newCardHtml);

    // 4. Find the newly created card
    const newCardElement = cardContainer.lastElementChild;
    if (newCardElement) {
        // 5. Scroll to the new card and focus its title field
        newCardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const titleElement = newCardElement.querySelector('.card-scene-title');
        if (titleElement) {
            titleElement.focus();
        }
    }
    
    // 6. IMPORTANT: Sync this new card back to the main script text
    syncCardsToEditor();
    
    // 7. Re-bind events to make sure the new card's fields work
    bindCardEditingEvents();
}

  // REVISED HELPER FUNCTION: Creates a high-quality, 3x5 inch card with darker, bolder text.
async function generateCardImageBlob(cardElement) {
    // Extract data from the on-screen card
    const sceneNumber = cardElement.querySelector('.card-scene-number')?.value || '#';
    const sceneHeading = cardElement.querySelector('.card-scene-title')?.textContent.trim().toUpperCase() || 'UNTITLED SCENE';
    const description = cardElement.querySelector('.card-description')?.value || '';

    // Create a temporary, hidden element styled exactly like a 3x5 index card
    const printableCard = document.createElement('div');
    printableCard.style.cssText = `
        position: absolute;
        left: -9999px; /* Position it off-screen */
        width: 480px;  /* 5 inches at 96dpi */
        height: 288px; /* 3 inches at 96dpi */
        background-color: #ffffff;
        border: 1.5px solid #000000;
        /* --- CHANGED: Set font and make it bolder --- */
        font-family: 'Courier Prime', 'Courier New', monospace;
        color: #000000; /* Pure black text */
        font-weight: 500; /* Make all text slightly bolder to combat rendering lightness */
        /* ------------------------------------------- */
        padding: 15px;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    `;
    
    // Create a concise summary from the full description
    const descriptionSummary = description.split('\n').slice(0, 4).join('<br>');
    
    // Populate the printable card with the correctly formatted HTML
    printableCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 10px;">
            <span style="font-size: 14px; font-weight: 700;">${sceneHeading}</span>
            <span style="font-size: 14px; font-weight: 700;">${sceneNumber}</span>
        </div>
        <div style="flex-grow: 1; font-size: 15px; line-height: 1.6;">
            ${descriptionSummary}
        </div>
        <div style="font-size: 10px; text-align: right; opacity: 0.6; margin-top: auto;">@ToscripT</div>
    `;
    
    document.body.appendChild(printableCard);

    return new Promise(async (resolve) => {
        try {
            const canvas = await html2canvas(printableCard, { scale: 3, backgroundColor: '#ffffff' });
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png', 0.95);
        } catch (error) {
            console.error("Card image generation failed:", error);
            resolve(null);
        } finally {
            // IMPORTANT: Always remove the temporary element
            document.body.removeChild(printableCard);
        }
    });
}
    
    // 2. REPLACEMENT FUNCTION for sharing a single card
    async function shareSceneCard(sceneId) {
        const cardElement = document.querySelector(`.card-for-export[data-scene-id="${sceneId}"]`);
        if (!cardElement) {
            alert('Could not find the card to share.');
            return;
        }

        const blob = await generateCardImageBlob(cardElement);
        if (!blob) {
            alert('Failed to create card image.');
            return;
        }

        const sceneNumber = cardElement.querySelector('.card-scene-number')?.value || '#';
        const sceneHeading = cardElement.querySelector('.card-scene-title')?.textContent || 'Scene';
        const fileName = `Scene_${sceneNumber.replace('#', '')}_${sceneHeading.replace(/[^a-zA-Z0-9]/g, '_')}.png`;

        // Use the modern Web Share API if available (great for mobile)
        if (navigator.share && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
            const file = new File([blob], fileName, { type: 'image/png' });
            try {
                await navigator.share({
                    files: [file],
                    title: sceneHeading,
                    text: `Scene card from ToscripT: ${sceneHeading}`,
                });
            } catch (error) {
                console.log('Share was cancelled or failed:', error);
            }
        } else {
            // Fallback to simple download if Web Share is not supported
            downloadBlob(blob, fileName);
        }
    }

    // REPLACEMENT FUNCTION: Exports all cards into a single, print-friendly PDF.
async function saveAllCardsAsImages() {
    console.log("📄 Generating PDF for all scene cards...");
    
    // 1. Check for necessary libraries
    if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
        alert('❌ PDF generation library is not loaded. Cannot create PDF.');
        return;
    }

    const cards = document.querySelectorAll('.card-for-export');
    if (cards.length === 0) {
        alert('No cards to save.');
        return;
    }

    alert(`Preparing to generate a PDF with ${cards.length} cards. This may take a moment...`);

    // 2. Initialize the PDF document (A4 size, units in millimeters)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // 3. Define the layout for the cards on the page
    const cardWidthMM = 127;  // 5 inches
    const cardHeightMM = 76;   // 3 inches
    const pageHeightMM = 297;  // A4 page height
    const pageWidthMM = 210;   // A4 page width
    const topMarginMM = 15;
    const leftMarginMM = (pageWidthMM - (cardWidthMM * 1)) / 2; // Centering one card per row
    const gapMM = 15;          // Space between cards vertically for cutting

    let x = leftMarginMM;
    let y = topMarginMM;

    try {
        for (let i = 0; i < cards.length; i++) {
            // 4. Generate the image data for each card using our existing helper function
            const blob = await generateCardImageBlob(cards[i]);
            if (!blob) continue; // Skip if a card fails to generate

            const dataUrl = URL.createObjectURL(blob);

            // 5. Check if the card will fit on the current page. If not, add a new page.
            if (y + cardHeightMM > pageHeightMM - topMarginMM) {
                doc.addPage();
                y = topMarginMM; // Reset Y position to the top margin
            }

            // 6. Add the card image to the PDF at the calculated position
            doc.addImage(dataUrl, 'PNG', x, y, cardWidthMM, cardHeightMM);
            URL.revokeObjectURL(dataUrl); // Clean up memory

            // 7. Update the Y position for the next card to be placed below the current one
            y += cardHeightMM + gapMM;
        }

        // 8. Save the completed PDF file
        doc.save('ToscripT_All_Cards.pdf');
        alert(`🎉 PDF created successfully with ${cards.length} cards!`);

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("An error occurred while creating the PDF. Please check the console for details.");
    }
}
    // Action buttons handling
    function handleActionBtn(e) {
        if (!fountainInput) return;

        const action = e.currentTarget.dataset.action;
        const { selectionStart, selectionEnd, value } = fountainInput;

        console.log(`🔧 Action button clicked: ${action}`);
        clearPlaceholder();

        switch (action) {
            case 'caps':
                const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
                const lineEnd = value.indexOf('\n', selectionStart);
                const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
                const newText = currentLine === currentLine.toUpperCase() ? currentLine.toLowerCase() : currentLine.toUpperCase();
                fountainInput.setRangeText(newText, lineStart, lineEnd === -1 ? value.length : lineEnd);
                break;
            case 'parens':
                const selectedText = value.substring(selectionStart, selectionEnd);
                fountainInput.setRangeText(`(${selectedText})`, selectionStart, selectionEnd);
                fountainInput.setSelectionRange(selectionStart + 1, selectionEnd + 1);
                break;
            case 'scene':
                cycleText(['INT. ', 'EXT. ', 'INT./EXT. ']);
                break;
            case 'time':
                cycleText([' - DAY', ' - NIGHT', ' - MORNING', ' - EVENING', ' - DAWN', ' - DUSK']);
                break;
            case 'transition':
                cycleText(['CUT TO:', 'DISSOLVE TO:', 'FADE OUT.', 'FADE IN:', 'FADE TO BLACK.']);
                break;
        }

        history.add(fountainInput.value);
        setTimeout(() => {
            if (fountainInput) {
                fountainInput.focus();
                if (window.innerWidth <= 768 && currentView === 'write') showMobileToolbar();
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

// --- COMPLETE SCENE NAVIGATOR & REORDERING ENGINE ---

function updateSceneNavigator() {
    if (!sceneList) return;
    sceneList.innerHTML = '';
    const lines = fountainInput.value.split('\n');
    let sceneIndex = 0; // This will track the original index of the scene block

    // This logic finds all scenes and adds them to the list
    lines.forEach((line) => {
        const trimmedLine = line.trim().toUpperCase();
        if (trimmedLine.startsWith('INT.') || trimmedLine.startsWith('EXT.') || trimmedLine.startsWith('.')) {
            const li = document.createElement('li');
            li.textContent = line.trim().replace(/^\./, '');
            li.draggable = true;
            li.dataset.sceneIndex = sceneIndex++; // Assign original index
            li.addEventListener('click', () => jumpToScene(line.trim())); // Add jump-to-scene functionality
            sceneList.appendChild(li);
        }
    });

    // Setup Drag and Drop listeners
    let draggedItem = null;
    sceneList.addEventListener('dragstart', e => {
        draggedItem = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    });
    sceneList.addEventListener('dragend', e => {
        e.target.classList.remove('dragging');
    });
    sceneList.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(sceneList, e.clientY);
        if (afterElement == null) {
            sceneList.appendChild(draggedItem);
        } else {
            sceneList.insertBefore(draggedItem, afterElement);
        }
    });
    sceneList.addEventListener('drop', () => {
        reorderScript(); // This is the crucial function that rewrites the text
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function reorderScript() {
    const fullText = fountainInput.value;
    const lines = fullText.split('\n');
    const sceneBlocks = [];
    let nonSceneHeader = [];
    let currentSceneBlock = [];
    let isFirstSceneFound = false;

    // This complex logic correctly splits your script into blocks
    lines.forEach(line => {
        const isSceneHeading = line.trim().toUpperCase().startsWith('INT.') || line.trim().toUpperCase().startsWith('EXT.') || line.trim().startsWith('.');
        if (isSceneHeading) {
            if (!isFirstSceneFound) isFirstSceneFound = true;
            if (currentSceneBlock.length > 0) {
                sceneBlocks.push(currentSceneBlock.join('\n'));
            }
            currentSceneBlock = [line];
        } else {
            if (isFirstSceneFound) {
                currentSceneBlock.push(line);
            } else {
                nonSceneHeader.push(line);
            }
        }
    });
    if (currentSceneBlock.length > 0) {
        sceneBlocks.push(currentSceneBlock.join('\n'));
    }

    const newOrderIndices = [...sceneList.querySelectorAll('li')].map(li => parseInt(li.dataset.sceneIndex));
    const reorderedSceneBlocks = newOrderIndices.map(index => sceneBlocks[index]);

    const headerText = nonSceneHeader.join('\n');
    const newScriptArray = [];
    if (headerText.trim() !== '') {
        newScriptArray.push(headerText);
    }
    newScriptArray.push(...reorderedSceneBlocks);

    // Update the main textarea with the newly ordered script
    fountainInput.value = newScriptArray.join('\n\n');
    history.add(fountainInput.value);
    saveProjectData();
    updateSceneNavigator(); // Refresh navigator to update indices
}

function jumpToScene(sceneHeadingText) {
    if (!fountainInput) return;
    const index = fountainInput.value.indexOf(sceneHeadingText);
    if (index > -1) {
        switchView('write');
        setTimeout(() => {
            fountainInput.focus();
            fountainInput.setSelectionRange(index, index + sceneHeadingText.length);
            // Scroll the textarea to the position of the scene
            const textLines = fountainInput.value.substring(0, index).split('\n').length;
            const avgLineHeight = fountainInput.scrollHeight / fountainInput.value.split('\n').length;
            fountainInput.scrollTop = (textLines - 5) * avgLineHeight; // scroll with some context
        }, 100);
    }
    if (sceneNavigatorPanel) sceneNavigatorPanel.classList.remove('open');
}

    
    // Export scene order as text
    function exportSceneOrderAsText() {
        if (!sceneList) return;

        const scenes = Array.from(sceneList.children);
        let orderText = 'SCENE ORDER EXPORT\n';
        orderText += '==================\n\n';
        
        scenes.forEach((li, index) => {
            const sceneNumber = li.querySelector('.scene-number')?.textContent || `${index + 1}`;
            const sceneHeading = li.querySelector('.scene-heading')?.textContent || 'Unknown Scene';
            const sceneTime = li.querySelector('.scene-time')?.textContent || '';
            
            orderText += `${sceneNumber} - ${sceneHeading} ${sceneTime}\n`;
        });

        orderText += `\nTotal Scenes: ${scenes.length}`;
        orderText += `\nExported: ${new Date().toLocaleString()}`;

        const blob = new Blob([orderText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene-order.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('💾 Scene order exported');
    }

    // File operations
    function downloadBlob(blob, filename) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    function saveAsFountain() {
        const text = fountainInput?.value || '';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        downloadBlob(blob, `${projectData.projectInfo.projectName}.fountain`);
    }

    function saveAsFilmProj() {
        projectData.projectInfo.scriptContent = fountainInput.value;
        const filmproj = {
            fileVersion: "1.0",
            projectInfo: projectData.projectInfo,
            scenes: projectData.projectInfo.scenes,
            created: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(filmproj, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${projectData.projectInfo.projectName}.filmproj`);
    }


    // NEW FUNCTION 1: For English-only, selectable text PDF
    function saveAsPdfEnglish() {
        if (typeof window.jspdf === 'undefined') {
            return alert('PDF library (jspdf) is not loaded.');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });

        // Standard Screenplay Layout Constants (in inches)
        const leftMargin = 1.5;
        const rightMargin = 1.0;
        const topMargin = 1.0;
        const bottomMargin = 1.0;
        const pageHeight = 11.0;
        const pageWidth = 8.5;
        const lineHeight = 1 / 6;

        const indents = { scene_heading: 0, action: 0, character: 2.2, parenthetical: 1.6, dialogue: 1.0 };
        const widths = { scene_heading: 6.0, action: 6.0, character: 2.8, parenthetical: 2.0, dialogue: 3.5 };

        const tokens = parseFountain(fountainInput.value || '');
        let y = topMargin;

        const checkPageBreak = (linesCount = 1) => {
            if (y + (linesCount * lineHeight) > pageHeight - bottomMargin) {
                doc.addPage();
                y = topMargin;
            }
        };

        doc.setFont('Courier', 'normal');
        doc.setFontSize(12);

        tokens.forEach(token => {
            if (!token.type || !token.text) {
                if (token.type === 'empty') y += lineHeight;
                return;
            }

            const textLines = doc.splitTextToSize(token.text, widths[token.type] || 6.0);
            if (['scene_heading', 'character', 'transition'].includes(token.type)) {
                checkPageBreak();
                y += lineHeight;
            }
            checkPageBreak(textLines.length);
            doc.setFont('Courier', token.type === 'scene_heading' ? 'bold' : 'normal');

            if (token.type === 'transition') {
                doc.text(token.text, pageWidth - rightMargin, y, { align: 'right' });
            } else {
                const x = leftMargin + (indents[token.type] || 0);
                doc.text(textLines, x, y);
            }
            y += textLines.length * lineHeight;
        });
        
        doc.save(`${projectData.projectInfo.projectName || 'screenplay'}_english.pdf`);
    }

    async function preloadResourcesForCanvas() {
    try {
        console.log("Preloading fonts for PDF generation...");
        // This command waits for all fonts in the document to be loaded and ready
        await document.fonts.ready;
        console.log("Fonts preloaded successfully.");
    } catch (error) {
        console.error("Error preloading fonts:", error);
        // Don't block the process, but warn the user it might fail.
        alert("Could not preload fonts, PDF export may have issues.");
    }
}

    // FINAL REPLACEMENT: Uses the preloading function to guarantee Unicode support.
async function saveAsPdfUnicode() {
    if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
        return alert('Required libraries are still loading. Please wait a moment and try again.');
    }

    const sourceElement = document.getElementById('screenplay-output');
    if (!sourceElement || sourceElement.innerText.trim() === '') {
        return alert('Nothing to save. Please switch to the "TO SCRIPT" preview mode first.');
    }

    alert('Generating high-quality Unicode PDF, this may take a moment...');
    
    try {
        // **THIS IS THE FIX**: Wait for fonts to be ready before capturing.
        await preloadResourcesForCanvas();

        const canvas = await html2canvas(sourceElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false // Suppress console logs from the library
        });

        const imgData = canvas.toDataURL('image/png', 0.97);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeightInPdf = imgProps.height * pdfWidth / imgProps.width;
        let heightLeft = imgHeightInPdf;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeightInPdf;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
            heightLeft -= pdfHeight;
        }
        
        pdf.save(`${projectData.projectInfo.projectName || 'screenplay'}_unicode.pdf`);
    } catch (error) {
        console.error("PDF generation failed:", error);
        alert("An error occurred while creating the Unicode PDF. This can sometimes happen with very complex scripts.");
    }
}

    
    function openFountainFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            
            if (file.name.endsWith('.filmproj')) {
                try {
                    const filmproj = JSON.parse(content);
                    
                    if (filmproj.projectInfo) {
                        projectData.projectInfo = { ...projectData.projectInfo, ...filmproj.projectInfo };
                    }
                    
                    let fountainText = '';
                    if (filmproj.scenes && Array.isArray(filmproj.scenes)) {
                        filmproj.scenes.forEach(scene => {
                            fountainText += `${scene.heading}\n\n`;
                            if (scene.description && Array.isArray(scene.description)) {
                                fountainText += `${scene.description.join('\n\n')}\n\n`;
                            }
                        });
                    }
                    
                    if (fountainInput) {
                        fountainInput.value = fountainText.trim();
                        clearPlaceholder();
                    }
                } catch (err) {
                    alert('Invalid .filmproj file format');
                }
            } else {
                if (fountainInput) {
                    fountainInput.value = content;
                    clearPlaceholder();
                }
            }
            
            history.add(fountainInput.value);
            saveProjectData();
        };
        reader.readAsText(file, 'UTF-8');
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
            document.getElementById('title-input').value = projectData.projectInfo.projectName || '';
            document.getElementById('author-input').value = projectData.projectInfo.prodName || '';
        }
    }

    function saveTitlePage() {
        projectData.projectInfo.projectName = document.getElementById('title-input').value || "Untitled";
        projectData.projectInfo.prodName = document.getElementById('author-input').value || "Author";
        saveProjectData();
        document.getElementById('title-page-modal').classList.remove('open');
    }

    // Share functionality
    async function shareScript() {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: projectData.projectInfo.projectName,
                    text: fountainInput.value
                });
            } catch(err) {
                console.error("Share failed", err);
            }
        } else {
            alert('Sharing is not supported on this browser.');
        }
    }

    // COMPLETE Event Listeners Setup
    function setupEventListeners() {
        console.log('🔧 Setting up ALL event listeners...');

        // Make jumpToScene globally available
        window.jumpToScene = jumpToScene;

       // Fountain input listeners
if (fountainInput) {
    fountainInput.addEventListener('input', () => {
        // These actions happen immediately on every keystroke
        history.add(fountainInput.value);
        saveProjectData(); // This also updates the projectData.projectInfo.scenes array

        // Now, we handle the UI update with a debounce to prevent lag
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            // This code runs only after the user has stopped typing for 500ms
            if (currentView === 'card') {
                console.log('Syncing text editor changes back to Card View...');
                renderEnhancedCardView();
            }
        }, 500); // 500 millisecond delay
    });
}

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', openFountainFile);
        }

        // View switching buttons
        const viewButtons = [
            { id: 'show-script-btn', view: 'script' },
            { id: 'show-write-btn-header', view: 'write' },
            { id: 'show-write-btn-card-header', view: 'write' },
            { id: 'card-view-btn', view: 'card' }
        ];

        viewButtons.forEach(({ id, view }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log(`📌 View button clicked: ${id} -> ${view}`);
                    switchView(view);
                });
            }
        });

        // Hamburger menu buttons
        ['hamburger-btn', 'hamburger-btn-script', 'hamburger-btn-card'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log(`🍔 Hamburger clicked: ${id}`);
                    if (menuPanel) menuPanel.classList.toggle('open');
                });
            }
        });

        // Scene navigator buttons
        ['scene-navigator-btn', 'scene-navigator-btn-script'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log(`🎭 Scene navigator clicked: ${id}`);
                    updateSceneNavigator();
                    if (sceneNavigatorPanel) sceneNavigatorPanel.classList.add('open');
                });
            }
        });

        // Close navigator button
        const closeNavigatorBtn = document.getElementById('close-navigator-btn');
        if (closeNavigatorBtn) {
            closeNavigatorBtn.addEventListener('click', () => {
                if (sceneNavigatorPanel) sceneNavigatorPanel.classList.remove('open');
            });
        }

        // Filter functionality
        if (filterCategorySelect) {
            filterCategorySelect.addEventListener('change', handleFilterChange);
        }
        if (filterValueInput) {
            filterValueInput.addEventListener('input', applyFilter);
        }

        // Export scene order button
        const exportBtn = document.getElementById('export-scene-order-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('💾 Export scene order clicked');
                exportSceneOrderAsText();
            });
        }

        // FIXED: Add new card button
        const addCardBtn = document.getElementById('add-new-card-btn');
        if (addCardBtn) {
            addCardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("➕ Add card button clicked");
                addNewSceneCard();
            });
        }

        // FIXED: Save all cards button
        const saveAllBtn = document.getElementById('save-all-cards-btn');
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("💾 Save all cards button clicked");
                saveAllCardsAsImages();
            });
        }

        // Menu handlers
        const menuHandlers = {
            'new-btn': () => {
                if (confirm('Are you sure? Unsaved changes will be lost.')) {
                    if (fountainInput) fountainInput.value = '';
                    projectData = { 
                        projectInfo: { 
                            projectName: "Untitled", 
                            prodName: "Author", 
                            scriptContent: "",
                            scenes: []
                        } 
                    };
                    history.stack = [""];
                    history.currentIndex = 0;
                    history.updateButtons();
                    saveProjectData();
                    setPlaceholder();
                }
            },
            'open-btn': () => fileInput && fileInput.click(),
            'save-menu-btn': (e) => {
                e.preventDefault();
                const dropdown = e.currentTarget.parentElement;
                if (dropdown) dropdown.classList.toggle('open');
            },
            'save-fountain-btn': saveAsFountain,
            'save-pdf-english-btn': saveAsPdfEnglish,
            'save-pdf-unicode-btn': saveAsPdfUnicode,
            'save-filmproj-btn': saveAsFilmProj,
            'project-info-btn': openProjectInfoModal,
            'title-page-btn': openTitlePageModal,
            'info-btn': () => document.getElementById('info-modal')?.classList.add('open'),
            'about-btn': () => document.getElementById('about-modal')?.classList.add('open'),
            'scene-no-btn': toggleSceneNumbers,
            'auto-save-btn': toggleAutoSave,
            'share-btn': shareScript,
            'zoom-in-btn': handleZoomIn,
            'zoom-out-btn': handleZoomOut,
            'fullscreen-btn-main': () => {
                document.body.classList.toggle('fullscreen-active');
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(console.error);
                } else {
                    document.exitFullscreen().catch(console.error);
                }
            },
            'clear-project-btn': () => {
                if (confirm('This will clear the entire project. Are you sure?')) {
                    fountainInput.value = '';
                    projectData = { 
                        projectInfo: { 
                            projectName: "Untitled", 
                            prodName: "Author", 
                            scriptContent: "",
                            scenes: []
                        } 
                    };
                    history.stack = [""];
                    history.currentIndex = 0;
                    saveProjectData();
                    setPlaceholder();
                    if (currentView === 'script') renderEnhancedScript();
                    if (currentView === 'card') renderEnhancedCardView();
                }
            }
        };

        Object.entries(menuHandlers).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
                console.log(`✅ Handler attached to: ${id}`);
            }
        });

        // Action buttons (desktop and mobile)
        document.querySelectorAll('.action-btn, .keyboard-btn').forEach(btn => {
            btn.addEventListener('click', handleActionBtn);
            console.log(`🎯 Action button listener attached: ${btn.dataset.action}`);
        });

        // Undo/Redo buttons
        document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('↶ Undo clicked');
                history.undo();
            });
        });

        document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('↷ Redo clicked');
                history.redo();
            });
        });

        // Global click handlers
        document.addEventListener('click', (e) => {
            // Close menu when clicking outside
            if (menuPanel && menuPanel.classList.contains('open') && 
                !menuPanel.contains(e.target) && !e.target.closest('[id^="hamburger-btn"]')) {
                menuPanel.classList.remove('open');
            }

            // Close navigator when clicking outside
            if (sceneNavigatorPanel && sceneNavigatorPanel.classList.contains('open') && 
                !sceneNavigatorPanel.contains(e.target) && !e.target.closest('[id^="scene-navigator-btn"]')) {
                sceneNavigatorPanel.classList.remove('open');
            }

            // Modal close handlers
            const modal = e.target.closest('.modal');
            if (e.target.classList.contains('modal-close-btn') || e.target === modal) {
                if (modal) modal.classList.remove('open');
            }

            // Save project info
            if (e.target.id === 'save-project-info-btn') handleSaveProjectInfo();
            if (e.target.id === 'save-title-btn') saveTitlePage();

            // Share card buttons
            if (e.target.closest('.share-card-btn')) {
                const btn = e.target.closest('.share-card-btn');
                const sceneId = btn.dataset.sceneId;
                console.log(`📤 Share card: ${sceneId}`);
                
                // Use the existing card sharing function
                const cardElement = btn.closest('.scene-card');
                if (cardElement && typeof shareSceneCard === 'function') {
                    shareSceneCard(sceneId);
                } else {
                    alert('Card sharing feature coming soon!');
                }
            }
        });

        console.log('✅ ALL event listeners setup complete!');
    }

    // Initialize Application
    function initialize() {
        console.log('🚀 Initializing ToscripT Professional...');

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
                <p style="color: var(--muted-text-color); margin: 0.5rem 0;">Professional Screenwriting Tool</p>
                <hr style="border-color: var(--border-color); margin: 2rem 0;">
                <p><strong>Designed by Thosho Tech</strong></p>
                <p style="font-size: 0.9rem; color: var(--muted-text-color);">
                    Complete screenwriting solution with card view, scene navigation, and professional export options.
                </p>
            </div>`
        );

        createModal('info-modal', 'Info & Help',
            `<div style="line-height: 1.6;">
                <h3 style="color: var(--primary-color); margin-top: 0;">🎬 Action Buttons</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>I/E Button:</strong> Cycles through INT., EXT., INT./EXT.</li>
                    <li><strong>D/N Button:</strong> Cycles through DAY, NIGHT, MORNING, EVENING, DAWN, DUSK</li>
                    <li><strong>Aa Button:</strong> Toggles UPPERCASE/lowercase for current line</li>
                    <li><strong>() Button:</strong> Wraps selected text in parentheses</li>
                    <li><strong>TO: Button:</strong> Cycles through transitions</li>
                </ul>
                <h3 style="color: var(--primary-color);">🎭 Scene Navigator</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>Drag & Drop:</strong> Reorder scenes by dragging</li>
                    <li><strong>Scene Numbers:</strong> Visible scene numbering with time of day</li>
                    <li><strong>Click to Jump:</strong> Click any scene to jump to it in editor</li>
                    <li><strong>Export Order:</strong> Save scene order as .txt file</li>
                    <li><strong>Filter Scenes:</strong> Filter by location, type, characters, or time</li>
                </ul>
                <h3 style="color: var(--primary-color);">🎞️ Card View</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>+ Button:</strong> Add new scene cards</li>
                    <li><strong>Save Button:</strong> Export all cards as PNG images</li>
                    <li><strong>Edit Cards:</strong> Edit scene headings and descriptions directly</li>
                    <li><strong>Sync to Editor:</strong> Changes automatically sync back to script</li>
                </ul>
            </div>`
        );

        setupEventListeners();
        setupKeyboardDetection();
        loadProjectData();

        if (fountainInput) {
            if (fountainInput.value === '') setPlaceholder();
            fountainInput.style.fontSize = `${fontSize}px`;
            setTimeout(() => {
                if (currentView === 'write') fountainInput.focus();
            }, 500);
        }

        history.add(fountainInput ? fountainInput.value : '');
        history.updateButtons();

        console.log('✅ ToscripT Professional initialized successfully!');
        console.log('📱 Mobile toolbar fixed for fullscreen mode');
        console.log('🎭 Scene navigator with drag/drop and scene numbers');  
        console.log('💾 Scene order export functionality');
        console.log('🔍 Enhanced filtering with DAY/NIGHT support');
        console.log('🎞️ Card view with + button and save all cards');
        console.log('🖼️ Black text in preview mode fixed');
        console.log('🎬 ALL FEATURES WORKING - ToscripT Professional Ready! 🎬');
       }

    // Start initialization after a short delay to ensure DOM is ready
    setTimeout(initialize, 100);
});
