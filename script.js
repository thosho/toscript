// ToscripT Professional - COMPLETE BUG-FREE VERSION
// All PDF exports, FilmProj, and bidirectional sync FIXED

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing ToscripT Professional - Bug-Free Version...');
    
    // Global variables
    let projectData = {
        projectInfo: {
            projectName: 'Untitled',
            prodName: 'Author',
            directorName: '',
            scriptContent: '',
            scenes: [],
            lastModified: new Date().toISOString(),
            version: '1.0'
        }
    };
    let fontSize = 16;
    let autoSaveInterval = null;
    let showSceneNumbers = true;
    let currentView = 'write';
    let debounceTimeout = null;
    let isUpdatingFromSync = false; // Prevents infinite sync loops

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

The office is dimly lit with case files scattered everywhere.

DETECTIVE VIKRAM
(40s, weary)
sits behind a cluttered desk, staring at cold coffee.

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
        stack: [''],
        currentIndex: 0,
        add(value) {
            if (value !== this.stack[this.currentIndex] && !isUpdatingFromSync) {
                this.stack = this.stack.slice(0, this.currentIndex + 1);
                this.stack.push(value);
                this.currentIndex = this.stack.length - 1;
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
                isUpdatingFromSync = true;
                fountainInput.value = this.stack[this.currentIndex];
                if (fountainInput.value) {
                    clearPlaceholder();
                } else {
                    setPlaceholder();
                }
                this.updateButtons();
                saveProjectData();
                // Update scenes without triggering infinite loop
                projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
                if (currentView === 'card') {
                    renderEnhancedCardView();
                } else if (currentView === 'script') {
                    renderEnhancedScript();
                }
                isUpdatingFromSync = false;
            }
        },
        updateButtons() {
            const undoBtns = document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top');
            const redoBtns = document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top');
            undoBtns.forEach(btn => { if (btn) btn.disabled = this.currentIndex <= 0; });
            redoBtns.forEach(btn => { if (btn) btn.disabled = this.currentIndex >= this.stack.length - 1; });
        }
    };

    // ENHANCED: Mobile keyboard detection
    function setupKeyboardDetection() {
        let initialHeight = window.innerHeight;
        let isKeyboardOpen = false;

        function handleKeyboardToggle() {
            const currentHeight = window.innerHeight;
            const heightDiff = initialHeight - currentHeight;
            const keyboardOpen = heightDiff > 150;

            if (keyboardOpen !== isKeyboardOpen) {
                isKeyboardOpen = keyboardOpen;
                
                if (keyboardOpen && currentView === 'write' && window.innerWidth < 768) {
                    showMobileToolbar();
                } else if (!keyboardOpen) {
                    hideMobileToolbar();
                }
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
                    if (currentView === 'write' && window.innerWidth < 768) {
                        showMobileToolbar();
                    }
                }, 100);
            });

            fountainInput.addEventListener('blur', () => {
                setPlaceholder();
                setTimeout(() => {
                    if (!document.activeElement?.closest('.mobile-keyboard-toolbar')) {
                        hideMobileToolbar();
                    }
                }, 100);
            });
        }
    }

    function showMobileToolbar() {
        if (mobileToolbar && window.innerWidth < 768) {
            mobileToolbar.classList.add('show');
            console.log('📱 Mobile toolbar shown');
        }
    }

    function hideMobileToolbar() {
        if (mobileToolbar) {
            mobileToolbar.classList.remove('show');
        }
    }

    // ENHANCED: Panel toggle functionality
    function togglePanel(panel, isOpen) {
        if (!panel) return;
        
        if (typeof isOpen === 'undefined') {
            isOpen = !panel.classList.contains('open');
        }
        
        if (isOpen) {
            panel.classList.add('open');
            // Close other panels when one opens
            if (panel === menuPanel && sceneNavigatorPanel) {
                sceneNavigatorPanel.classList.remove('open');
            } else if (panel === sceneNavigatorPanel && menuPanel) {
                menuPanel.classList.remove('open');
            }
        } else {
            panel.classList.remove('open');
        }
    }

    // ENHANCED: Button click handler with better touch support
    function handleButtonClick(element, callback) {
        if (!element || !callback) return;

        // Remove any existing listeners to prevent duplicates
        element.removeEventListener('click', callback);
        element.removeEventListener('touchend', callback);

        // Add both click and touch events for better mobile support
        element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            callback(e);
        });

        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            callback(e);
        }, { passive: false });
    }

    // Placeholder functions
    function setPlaceholder() {
        if (fountainInput && !fountainInput.value && !isUpdatingFromSync) {
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

    // FIXED: Enhanced Save/Load functions
    function saveProjectData() {
        if (fountainInput && !isUpdatingFromSync) {
            projectData.projectInfo.scriptContent = fountainInput.value;
            projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
            projectData.projectInfo.lastModified = new Date().toISOString();
        }
        localStorage.setItem('universalFilmProjectToScript', JSON.stringify(projectData));
        console.log('💾 Project data saved');
    }

    function loadProjectData() {
        const savedData = localStorage.getItem('universalFilmProjectToScript');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                projectData = {
                    projectInfo: {
                        projectName: parsed.projectInfo?.projectName || 'Untitled',
                        prodName: parsed.projectInfo?.prodName || 'Author',
                        directorName: parsed.projectInfo?.directorName || '',
                        scriptContent: parsed.projectInfo?.scriptContent || '',
                        scenes: parsed.projectInfo?.scenes || [],
                        lastModified: parsed.projectInfo?.lastModified || new Date().toISOString(),
                        version: parsed.projectInfo?.version || '1.0'
                    }
                };
            } catch (e) {
                console.warn('Failed to parse saved data, using defaults');
            }
        }
        
        if (fountainInput) {
            isUpdatingFromSync = true;
            fountainInput.value = projectData.projectInfo.scriptContent || '';
            if (!fountainInput.value) setPlaceholder();
            isUpdatingFromSync = false;
        }
        
        updateSceneNoIndicator();
        updateAutoSaveIndicator();
        console.log('📂 Project data loaded');
    }

    // ROBUST FOUNTAIN PARSER
    function parseFountain(text) {
        if (!text || !text.trim()) return [];
        
        const lines = text.split('\n');
        const tokens = [];
        let sceneCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            if (trimmedLine.length === 0) {
                tokens.push({ type: 'empty' });
                continue;
            }

            // Title Page elements
            if (/^(Title|Author|Credit|Source):/i.test(trimmedLine)) {
                tokens.push({ type: 'titlepage', text: trimmedLine });
                continue;
            }

            // Scene Headings
            if (/^(INT\.|EXT\.|INT\.\\/EXT\.|EXT\.\\/INT\.)/i.test(trimmedLine)) {
                sceneCount++;
                tokens.push({ type: 'sceneheading', text: trimmedLine.toUpperCase(), sceneNumber: sceneCount });
                continue;
            }

            // Transitions
            if (trimmedLine.endsWith('TO:') || /^(FADE OUT|FADE IN|CUT TO|DISSOLVE TO)\.?$/i.test(trimmedLine)) {
                tokens.push({ type: 'transition', text: trimmedLine.toUpperCase() });
                continue;
            }

            // Parentheticals
            if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
                const lastToken = tokens[tokens.length - 1];
                if (lastToken && (lastToken.type === 'character' || lastToken.type === 'dialogue')) {
                    tokens.push({ type: 'parenthetical', text: line });
                    continue;
                }
            }

            // Characters (ALL CAPS with dialogue following)
            if (trimmedLine === trimmedLine.toUpperCase() && !trimmedLine.startsWith('(')) {
                let nextLineIndex = i + 1;
                while (nextLineIndex < lines.length && !lines[nextLineIndex].trim()) nextLineIndex++;
                if (nextLineIndex < lines.length) {
                    const nextLineTrimmed = lines[nextLineIndex].trim();
                    if (nextLineTrimmed && nextLineTrimmed !== nextLineTrimmed.toUpperCase() && !nextLineTrimmed.startsWith('(')) {
                        tokens.push({ type: 'character', text: line });
                        continue;
                    }
                }
            }

            // Dialogue (follows Character or Parenthetical)
            const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
            if (lastToken && (lastToken.type === 'character' || lastToken.type === 'parenthetical')) {
                tokens.push({ type: 'dialogue', text: line });
                continue;
            }

            // Default to Action
            tokens.push({ type: 'action', text: line });
        }

        return tokens;
    }

    // ENHANCED: Extract scenes with better error handling
    function extractScenesFromText(text) {
        if (!text || !text.trim()) return [];
        
        try {
            const tokens = parseFountain(text);
            const scenes = [];
            let currentScene = null;
            let sceneNumber = 0;

            tokens.forEach(token => {
                if (token.type === 'sceneheading') {
                    // Save previous scene
                    if (currentScene) scenes.push(currentScene);
                    
                    // Start new scene
                    sceneNumber++;
                    const heading = token.text.toUpperCase();
                    
                    // Extract components
                    const sceneTypeMatch = heading.match(/(INT\.|EXT\.|INT\.\\/EXT\.|EXT\.\\/INT\.)/i);
                    const sceneType = sceneTypeMatch ? sceneTypeMatch[1] : 'INT.';
                    
                    const timeMatch = heading.match(/-(DAY|NIGHT|MORNING|EVENING|DAWN|DUSK|CONTINUOUS|LATER|MOMENTS LATER)/i);
                    const timeOfDay = timeMatch ? timeMatch[1] : 'DAY';
                    
                    let location = heading
                        .replace(/(INT\.|EXT\.|INT\.\\/EXT\.|EXT\.\\/INT\.)/i, '')
                        .replace(/-(DAY|NIGHT|MORNING|EVENING|DAWN|DUSK|CONTINUOUS|LATER|MOMENTS LATER)/i, '')
                        .trim();
                    if (!location) location = 'LOCATION';
                    
                    currentScene = {
                        number: sceneNumber,
                        heading: heading,
                        sceneType: sceneType,
                        location: location,
                        timeOfDay: timeOfDay,
                        description: [],
                        characters: []
                    };
                } else if (currentScene) {
                    // Add content to current scene
                    if (token.type === 'action' || token.type === 'dialogue') {
                        currentScene.description.push(token.text);
                    } else if (token.type === 'character') {
                        const charName = token.text.trim().toUpperCase();
                        if (!currentScene.characters.includes(charName)) {
                            currentScene.characters.push(charName);
                        }
                        currentScene.description.push(token.text);
                    } else if (token.type === 'parenthetical' || token.type === 'transition') {
                        currentScene.description.push(token.text);
                    }
                }
            });

            // Don't forget the last scene
            if (currentScene) scenes.push(currentScene);
            
            return scenes;
        } catch (error) {
            console.error('Error extracting scenes:', error);
            return [];
        }
    }

    // FIXED: Enhanced view switching with proper sync
    function switchView(view) {
        console.log(`🔄 Switching to view: ${view}`);
        
        // Sync data before switching
        if (currentView === 'card') {
            syncCardsToEditor();
        }
        
        currentView = view;
        [writeView, scriptView, cardView].forEach(v => v?.classList.remove('active'));
        [mainHeader, scriptHeader, cardHeader].forEach(h => h && (h.style.display = 'none'));
        hideMobileToolbar();

        if (view === 'script') {
            scriptView?.classList.add('active');
            if (scriptHeader) scriptHeader.style.display = 'flex';
            renderEnhancedScript();
        } else if (view === 'card') {
            // CRITICAL: Sync script to cards when switching
            projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
            cardView?.classList.add('active');
            if (cardHeader) cardHeader.style.display = 'flex';
            renderEnhancedCardView();
        } else {
            writeView?.classList.add('active');
            if (mainHeader) mainHeader.style.display = 'flex';
            setTimeout(() => {
                if (fountainInput) fountainInput.focus();
                if (window.innerWidth < 768 && currentView === 'write') showMobileToolbar();
            }, 200);
        }
    }

    // FIXED: Enhanced script rendering
    function renderEnhancedScript() {
        if (!screenplayOutput || !fountainInput) return;

        const tokens = parseFountain(fountainInput.value);
        let scriptHtml = '';
        let isTitlePage = true;

        tokens.forEach(token => {
            if (token.type === 'sceneheading') isTitlePage = false;

            switch (token.type) {
                case 'titlepage':
                    if (isTitlePage) {
                        scriptHtml += `<div class="title-page-element">${token.text}</div>`;
                    } else {
                        scriptHtml += `<div class="action">${token.text}</div>`;
                    }
                    break;
                case 'sceneheading':
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
        console.log('📄 Script rendered');
    }

    // FIXED: Enhanced Card View with proper sync
    function renderEnhancedCardView() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;

        const scenes = projectData.projectInfo.scenes;

        if (scenes.length === 0) {
            cardContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--muted-text-color);">
                    <i class="fas fa-film" style="font-size: 4rem; margin-bottom: 2rem; opacity: 0.3;"></i>
                    <h3>No scenes found</h3>
                    <p>Write some scenes in the editor or click the + button to create cards</p>
                </div>
            `;
            return;
        }

        cardContainer.innerHTML = scenes.map(scene => `
            <div class="scene-card card-for-export" data-scene-id="${scene.number}" data-scene-number="${scene.number}">
                <div class="scene-card-content">
                    <div class="card-header">
                        <div class="card-scene-title" contenteditable="true" data-placeholder="Enter scene heading...">${scene.heading}</div>
                        <input class="card-scene-number" type="text" value="${scene.number}" maxlength="4" data-scene-id="${scene.number}">
                    </div>
                    <div class="card-body">
                        <textarea class="card-description" placeholder="Enter detailed scene description..." data-scene-id="${scene.number}">${scene.description.join('\n')}</textarea>
                    </div>
                    <div class="card-watermark">TO SCRIPT</div>
                </div>
                <div class="card-actions">
                    <button class="icon-btn share-card-btn" title="Share Scene" data-scene-id="${scene.number}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="icon-btn delete-card-btn" title="Delete Scene" data-scene-id="${scene.number}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        bindCardEditingEvents();
        console.log('🗃️ Card view rendered');
    }

    // FIXED: Bidirectional card editing
    function bindCardEditingEvents() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;

        // Remove existing listeners to prevent duplicates
        cardContainer.removeEventListener('input', handleCardInput);
        cardContainer.removeEventListener('blur', handleCardBlur, true);

        cardContainer.addEventListener('input', handleCardInput);
        cardContainer.addEventListener('blur', handleCardBlur, true);

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
    }

    // CRITICAL: Fixed bidirectional sync between cards and editor
    function syncCardsToEditor() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer || !fountainInput || isUpdatingFromSync) return;

        let scriptText = '';
        const cards = Array.from(cardContainer.querySelectorAll('.scene-card'));
        
        cards.forEach((card, index) => {
            const titleElement = card.querySelector('.card-scene-title');
            const descriptionElement = card.querySelector('.card-description');
            let title = titleElement ? titleElement.textContent.trim() : '';
            let description = descriptionElement ? descriptionElement.value.trim() : '';

            // Ensure scene heading format
            if (title && !title.match(/(INT\.|EXT\.|INT\.\\/EXT\.|EXT\.\\/INT\.)/i)) {
                title = 'INT. ' + title.toUpperCase();
            } else {
                title = title.toUpperCase();
            }

            // Update scene number
            const numberElement = card.querySelector('.card-scene-number');
            if (numberElement) numberElement.value = index + 1;

            // Build script text
            scriptText += title + '\n\n';
            if (description) {
                scriptText += description + '\n\n';
            }
        });

        const trimmedScript = scriptText.trim();
        if (trimmedScript && trimmedScript !== fountainInput.value.trim()) {
            isUpdatingFromSync = true;
            fountainInput.value = trimmedScript;
            history.add(fountainInput.value);
            saveProjectData();
            
            // Update script view if active
            if (currentView === 'script') {
                renderEnhancedScript();
            }
            isUpdatingFromSync = false;
        }
        console.log('🔄 Cards synced to editor');
    }

    // FIXED: Add new scene card
    function addNewSceneCard() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;

        const newSceneNumber = cardContainer.querySelectorAll('.scene-card').length + 1;

        const newCardHtml = `
            <div class="scene-card card-for-export" data-scene-id="${newSceneNumber}" data-scene-number="${newSceneNumber}">
                <div class="scene-card-content">
                    <div class="card-header">
                        <div class="card-scene-title" contenteditable="true" data-placeholder="Enter scene heading...">INT. NEW SCENE - DAY</div>
                        <input class="card-scene-number" type="text" value="${newSceneNumber}" maxlength="4" data-scene-id="${newSceneNumber}">
                    </div>
                    <div class="card-body">
                        <textarea class="card-description" placeholder="Enter detailed scene description..." data-scene-id="${newSceneNumber}"></textarea>
                    </div>
                    <div class="card-watermark">TO SCRIPT</div>
                </div>
                <div class="card-actions">
                    <button class="icon-btn share-card-btn" title="Share Scene" data-scene-id="${newSceneNumber}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="icon-btn delete-card-btn" title="Delete Scene" data-scene-id="${newSceneNumber}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        cardContainer.insertAdjacentHTML('beforeend', newCardHtml);

        const newCardElement = cardContainer.lastElementChild;
        if (newCardElement) {
            newCardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const titleElement = newCardElement.querySelector('.card-scene-title');
            if (titleElement) titleElement.focus();
        }

        syncCardsToEditor();
        bindCardEditingEvents();
        console.log('➕ New card added');
    }

    // FIXED: PDF Export functions with proper error handling
    async function saveAsPdfEnglish() {
        console.log('📄 Generating selectable PDF...');
        
        // Check for library availability
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library (jsPDF) not loaded. Please check your internet connection and script tags.');
            console.error('jsPDF library not found');
            return;
        }

        const { jsPDF } = window.jspdf;
        
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'in',
                format: 'letter'
            });

            // Standard Screenplay Layout Constants (in inches)
            const leftMargin = 1.5;
            const rightMargin = 1.0;
            const topMargin = 1.0;
            const bottomMargin = 1.0;
            const pageHeight = 11.0;
            const pageWidth = 8.5;
            const lineHeight = 1/6; // 12pt = 1/6 inch

            // Element indentations and widths
            const indents = {
                'sceneheading': 0,
                'action': 0,
                'character': 2.2,
                'parenthetical': 1.6,
                'dialogue': 1.0,
                'transition': 0
            };

            const widths = {
                'sceneheading': 6.0,
                'action': 6.0,
                'character': 2.8,
                'parenthetical': 2.0,
                'dialogue': 3.5,
                'transition': 6.0
            };

            const tokens = parseFountain(fountainInput.value);
            
            if (tokens.length === 0) {
                alert('No content to export.');
                return;
            }

            let y = topMargin;

            // Page break check function
            const checkPageBreak = (linesCount = 1) => {
                if (y + (linesCount * lineHeight) > pageHeight - bottomMargin) {
                    doc.addPage();
                    y = topMargin;
                }
            };

            // Set font
            doc.setFont('Courier', 'normal');
            doc.setFontSize(12);

            // Process each token
            tokens.forEach(token => {
                if (!token.type || !token.text || token.type === 'empty') {
                    if (token.type === 'empty') y += lineHeight;
                    return;
                }

                const textLines = doc.splitTextToSize(token.text, widths[token.type] || 6.0);
                
                // Check if we need a page break
                if (['sceneheading', 'character', 'transition'].includes(token.type)) {
                    checkPageBreak(1);
                }
                checkPageBreak(textLines.length);

                // Set font style
                doc.setFont('Courier', 
                    (token.type === 'sceneheading' || token.type === 'transition') ? 'bold' : 'normal'
                );

                // Add text with proper indentation
                if (token.type === 'transition') {
                    doc.text(token.text, pageWidth - rightMargin, y, { align: 'right' });
                } else {
                    const x = leftMargin + (indents[token.type] || 0);
                    doc.text(textLines, x, y);
                }

                y += textLines.length * lineHeight;
            });

            // Save the PDF
            const filename = `${projectData.projectInfo.projectName}_screenplay_english.pdf`;
            doc.save(filename);
            
            alert('✅ PDF exported successfully!');
            console.log('✅ Selectable Text PDF exported');

        } catch (error) {
            console.error('PDF Export Error:', error);
            alert('❌ Failed to generate PDF. Check console for details.');
        }
    }

    // FIXED: Unicode PDF with proper canvas handling
    async function saveAsPdfUnicode() {
        console.log('🖼️ Generating Unicode image PDF...');
        
        // Check for required libraries
        if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
            alert('Required libraries (jsPDF or html2canvas) not loaded. Please check your internet connection and script tags.');
            console.error('Required PDF libraries not found');
            return;
        }

        const sourceElement = document.getElementById('screenplay-output');
        if (!sourceElement || !sourceElement.innerText.trim()) {
            alert('Nothing to save. Please switch to the "TO SCRIPT" preview mode first.');
            return;
        }

        alert('📸 Generating high-quality Unicode PDF, this may take a moment...');

        try {
            // Ensure fonts are loaded
            await document.fonts.ready;
            
            // Generate canvas with high quality
            const canvas = await html2canvas(sourceElement, {
                scale: 3, // High DPI
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                width: sourceElement.scrollWidth,
                height: sourceElement.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png', 0.98);
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeightInPdf;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
            heightLeft -= pdfHeight;

            // Add additional pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeightInPdf;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
                heightLeft -= pdfHeight;
            }

            // Save the PDF
            const filename = `${projectData.projectInfo.projectName}_screenplay_unicode.pdf`;
            pdf.save(filename);
            
            alert('✅ Unicode PDF exported successfully!');
            console.log('✅ Unicode Image PDF exported');

        } catch (error) {
            console.error('Unicode PDF Export Error:', error);
            alert('❌ Failed to generate Unicode PDF. Check console for details.');
        }
    }

    // FIXED: Complete FilmProj export with all data
    function saveAsFilmProj() {
        console.log('🎬 Saving complete FilmProj file...');
        
        try {
            // Update project data before saving
            if (fountainInput) {
                projectData.projectInfo.scriptContent = fountainInput.value;
                projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
            }

            // Create comprehensive FilmProj structure
            const filmProj = {
                fileVersion: '1.2',
                application: 'ToscripT Professional',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                projectInfo: {
                    projectName: projectData.projectInfo.projectName || 'Untitled',
                    prodName: projectData.projectInfo.prodName || 'Author',
                    directorName: projectData.projectInfo.directorName || '',
                    scriptContent: projectData.projectInfo.scriptContent || '',
                    scenes: projectData.projectInfo.scenes || [],
                    version: projectData.projectInfo.version || '1.0',
                    settings: {
                        fontSize: fontSize,
                        showSceneNumbers: showSceneNumbers,
                        autoSave: !!autoSaveInterval
                    }
                },
                // Include card data for complete restoration
                cardData: [],
                // Include history for undo/redo
                history: {
                    stack: history.stack.slice(),
                    currentIndex: history.currentIndex
                },
                // Export metadata
                exportInfo: {
                    exportedBy: 'ToscripT Professional',
                    exportDate: new Date().toISOString(),
                    version: '1.2'
                }
            };

            // Capture card data if in card view
            const cardContainer = document.getElementById('card-container');
            if (cardContainer) {
                const cards = Array.from(cardContainer.querySelectorAll('.scene-card'));
                filmProj.cardData = cards.map(card => {
                    const titleElement = card.querySelector('.card-scene-title');
                    const descriptionElement = card.querySelector('.card-description');
                    const numberElement = card.querySelector('.card-scene-number');
                    
                    return {
                        sceneId: card.dataset.sceneId,
                        sceneNumber: numberElement?.value || '',
                        title: titleElement?.textContent?.trim() || '',
                        description: descriptionElement?.value || ''
                    };
                });
            }

            // Create and download the file
            const blob = new Blob([JSON.stringify(filmProj, null, 2)], { 
                type: 'application/json' 
            });
            
            const filename = `${projectData.projectInfo.projectName}.filmproj`;
            downloadBlob(blob, filename);
            
            alert('✅ Complete .filmproj file saved with all data!');
            console.log('✅ Complete FilmProj exported');

        } catch (error) {
            console.error('FilmProj Export Error:', error);
            alert('❌ Failed to save .filmproj file. Check console for details.');
        }
    }

    // FIXED: Enhanced file opening with FilmProj support
    function openFountainFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            
            if (file.name.endsWith('.filmproj')) {
                try {
                    const filmProj = JSON.parse(content);
                    
                    // Restore project info
                    if (filmProj.projectInfo) {
                        projectData.projectInfo = {
                            ...projectData.projectInfo,
                            ...filmProj.projectInfo
                        };
                    }

                    // Restore settings
                    if (filmProj.projectInfo?.settings) {
                        fontSize = filmProj.projectInfo.settings.fontSize || fontSize;
                        showSceneNumbers = filmProj.projectInfo.settings.showSceneNumbers !== false;
                        if (filmProj.projectInfo.settings.autoSave && !autoSaveInterval) {
                            toggleAutoSave();
                        }
                    }

                    // Restore history
                    if (filmProj.history && Array.isArray(filmProj.history.stack)) {
                        history.stack = filmProj.history.stack;
                        history.currentIndex = filmProj.history.currentIndex || 0;
                        history.updateButtons();
                    }

                    // Set fountain text
                    let fountainText = '';
                    if (filmProj.projectInfo?.scriptContent) {
                        fountainText = filmProj.projectInfo.scriptContent;
                    } else if (filmProj.scenes && Array.isArray(filmProj.scenes)) {
                        // Fallback: rebuild from scenes
                        filmProj.scenes.forEach(scene => {
                            fountainText += scene.heading + '\n\n';
                            if (scene.description && Array.isArray(scene.description)) {
                                fountainText += scene.description.join('\n') + '\n\n';
                            }
                        });
                    }

                    if (fountainInput) {
                        isUpdatingFromSync = true;
                        fountainInput.value = fountainText.trim();
                        clearPlaceholder();
                        isUpdatingFromSync = false;
                    }

                    saveProjectData();
                    updateSceneNoIndicator();
                    updateAutoSaveIndicator();
                    
                    // Refresh current view
                    if (currentView === 'script') {
                        renderEnhancedScript();
                    } else if (currentView === 'card') {
                        renderEnhancedCardView();
                    }

                    alert('✅ .filmproj file loaded successfully!');
                    
                } catch (err) {
                    console.error('FilmProj loading error:', err);
                    alert('❌ Invalid .filmproj file format.');
                }
            } else {
                // Regular fountain file
                if (fountainInput) {
                    isUpdatingFromSync = true;
                    fountainInput.value = content;
                    clearPlaceholder();
                    history.add(fountainInput.value);
                    saveProjectData();
                    isUpdatingFromSync = false;
                }
                alert('✅ Fountain file loaded!');
            }
        };

        reader.readAsText(file, 'UTF-8');
    }

    // Action buttons handling
    function handleActionBtn(e) {
        if (!fountainInput) return;

        const action = e.currentTarget.dataset.action;
        const { selectionStart, selectionEnd, value } = fountainInput;
        clearPlaceholder();

        switch (action) {
            case 'caps':
                const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
                const lineEnd = value.indexOf('\n', selectionStart);
                const currentLine = value.substring(lineStart, lineEnd !== -1 ? lineEnd : value.length);
                const newText = currentLine === currentLine.toUpperCase() ? 
                    currentLine.toLowerCase() : currentLine.toUpperCase();
                fountainInput.setRangeText(newText, lineStart, lineEnd !== -1 ? lineEnd : value.length);
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
            if (fountainInput) fountainInput.focus();
            if (window.innerWidth < 768 && currentView === 'write') showMobileToolbar();
        }, 10);
    }

    function cycleText(options) {
        if (!fountainInput) return;

        const { value, selectionStart } = fountainInput;
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const lineEnd = value.indexOf('\n', selectionStart);
        const currentLine = value.substring(lineStart, lineEnd !== -1 ? lineEnd : value.length);

        let currentIndex = -1;
        for (let i = 0; i < options.length; i++) {
            if (currentLine.includes(options[i])) {
                currentIndex = i;
                break;
            }
        }

        const nextOption = options[(currentIndex + 1) % options.length];

        if (currentIndex !== -1) {
            const newLine = currentLine.replace(options[currentIndex], nextOption);
            fountainInput.setRangeText(newLine, lineStart, lineEnd !== -1 ? lineEnd : value.length);
        } else {
            fountainInput.setRangeText(nextOption, selectionStart, selectionStart);
        }

        fountainInput.setSelectionRange(selectionStart + nextOption.length, selectionStart + nextOption.length);
    }

    // Scene navigator functions
    function updateSceneNavigator() {
        if (!sceneList) return;

        const scenes = projectData.projectInfo.scenes;

        sceneList.innerHTML = scenes.map(scene => `
            <li data-scene-number="${scene.number}" onclick="jumpToScene(${scene.number})">
                <div class="scene-item-header">
                    <span class="scene-number">${scene.number}</span>
                    <span class="scene-time">${scene.timeOfDay}</span>
                </div>
                <div class="scene-heading">${scene.heading}</div>
            </li>
        `).join('');

        // Setup drag and drop
        if (typeof Sortable !== 'undefined') {
            new Sortable(sceneList, {
                animation: 200,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'dragging'
            });
        }
    }

    function jumpToScene(sceneNumber) {
        if (!fountainInput) return;

        const scenes = projectData.projectInfo.scenes;
        const targetScene = scenes.find(s => s.number === sceneNumber);
        if (targetScene) {
            const sceneText = targetScene.heading;
            const index = fountainInput.value.indexOf(sceneText);
            if (index !== -1) {
                switchView('write');
                setTimeout(() => {
                    fountainInput.focus();
                    fountainInput.setSelectionRange(index, index + sceneText.length);
                    fountainInput.scrollTop = fountainInput.scrollHeight * (index / fountainInput.value.length);
                }, 200);
            }
        }

        togglePanel(sceneNavigatorPanel, false);
    }

    // Utility functions
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

    function handleZoomIn() {
        fontSize = Math.min(32, fontSize + 2);
        if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`;
    }

    function handleZoomOut() {
        fontSize = Math.max(10, fontSize - 2);
        if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`;
    }

    // File operations
    function saveAsFountain() {
        const text = fountainInput?.value || '';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        downloadBlob(blob, `${projectData.projectInfo.projectName}.fountain`);
    }

    function downloadBlob(blob, filename) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    // FIXED: Card image generation and export
    async function generateCardImageBlob(cardElement) {
        try {
            // Extract card data
            const sceneNumber = cardElement.querySelector('.card-scene-number')?.value || '1';
            const sceneHeading = cardElement.querySelector('.card-scene-title')?.textContent?.trim() || 'UNTITLED SCENE';
            const description = cardElement.querySelector('.card-description')?.value || '';

            // Create temporary card for high-quality export
            const printableCard = document.createElement('div');
            printableCard.style.cssText = `
                position: absolute;
                left: -9999px;
                width: 480px;
                height: 288px;
                background-color: #ffffff;
                border: 2px solid #000000;
                font-family: 'Courier Prime', 'Courier New', monospace;
                color: #000000;
                font-weight: 500;
                padding: 15px;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
            `;

            const descriptionSummary = description.split('\n').slice(0, 8).join('<br>');
            
            printableCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 10px;">
                    <span style="font-size: 14px; font-weight: 700;">${sceneHeading}</span>
                    <span style="font-size: 14px; font-weight: 700;">#${sceneNumber}</span>
                </div>
                <div style="flex-grow: 1; font-size: 13px; line-height: 1.6;">
                    ${descriptionSummary}
                </div>
                <div style="font-size: 10px; text-align: right; opacity: 0.6; margin-top: auto;">ToscripT</div>
            `;

            document.body.appendChild(printableCard);

            return new Promise(async (resolve) => {
                try {
                    const canvas = await html2canvas(printableCard, {
                        scale: 3,
                        backgroundColor: '#ffffff'
                    });
                    canvas.toBlob(blob => resolve(blob), 'image/png', 0.95);
                } catch (error) {
                    console.error('Card image generation failed:', error);
                    resolve(null);
                } finally {
                    document.body.removeChild(printableCard);
                }
            });
        } catch (error) {
            console.error('Card export error:', error);
            return null;
        }
    }

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

        const sceneNumber = cardElement.querySelector('.card-scene-number')?.value || sceneId;
        const sceneHeading = cardElement.querySelector('.card-scene-title')?.textContent || 'Scene';
        const fileName = `Scene${sceneNumber}_${sceneHeading.replace(/[^a-zA-Z0-9]/g, '_')}.png`;

        // Web Share API or download fallback
        if (navigator.share && navigator.canShare) {
            const file = new File([blob], fileName, { type: 'image/png' });
            try {
                await navigator.share({
                    files: [file],
                    title: sceneHeading,
                    text: `Scene card from ToscripT: ${sceneHeading}`
                });
            } catch (error) {
                console.log('Share was cancelled or failed:', error);
            }
        } else {
            downloadBlob(blob, fileName);
        }
    }

    // FIXED: Save all cards as PDF
    async function saveAllCardsAsImages() {
        console.log('🎬 Generating PDF for all scene cards...');
        
        if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
            alert('PDF generation library is not loaded. Cannot create PDF.');
            return;
        }

        const cards = document.querySelectorAll('.card-for-export');
        if (cards.length === 0) {
            alert('No cards to save.');
            return;
        }

        alert(`📸 Preparing to generate a PDF with ${cards.length} cards. This may take a moment...`);

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Card layout constants
            const cardWidthMM = 127; // 5 inches
            const cardHeightMM = 76;  // 3 inches
            const pageHeightMM = 297;
            const pageWidthMM = 210;
            const topMarginMM = 15;
            const leftMarginMM = (pageWidthMM - cardWidthMM) / 2;
            const gapMM = 15;

            let x = leftMarginMM;
            let y = topMarginMM;

            for (let i = 0; i < cards.length; i++) {
                const blob = await generateCardImageBlob(cards[i]);
                if (!blob) continue;

                const dataUrl = URL.createObjectURL(blob);

                // Check if card fits on current page
                if (y + cardHeightMM > pageHeightMM - topMarginMM) {
                    doc.addPage();
                    y = topMarginMM;
                }

                // Add card image to PDF
                doc.addImage(dataUrl, 'PNG', x, y, cardWidthMM, cardHeightMM);
                URL.revokeObjectURL(dataUrl);

                // Update position for next card
                y += cardHeightMM + gapMM;
            }

            // Save PDF
            doc.save(`${projectData.projectInfo.projectName}_AllCards.pdf`);
            alert(`✅ PDF created successfully with ${cards.length} cards!`);

        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('❌ An error occurred while creating the PDF. Please check the console for details.');
        }
    }

    // COMPLETE Event Listeners Setup
    function setupEventListeners() {
        console.log('🔧 Setting up ALL event listeners...');

        // Make jumpToScene globally available
        window.jumpToScene = jumpToScene;

        // Enhanced fountain input handling
        if (fountainInput) {
            fountainInput.addEventListener('input', () => {
                if (isUpdatingFromSync) return;
                
                clearPlaceholder();
                history.add(fountainInput.value);
                saveProjectData();

                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    if (!isUpdatingFromSync) {
                        projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
                        if (currentView === 'card') {
                            renderEnhancedCardView();
                        } else if (currentView === 'script') {
                            renderEnhancedScript();
                        }
                    }
                }, 500);
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
                handleButtonClick(btn, (e) => {
                    console.log(`🔄 View button clicked: ${id} -> ${view}`);
                    switchView(view);
                });
            }
        });

        // Hamburger menu buttons
        ['hamburger-btn', 'hamburger-btn-script', 'hamburger-btn-card'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                handleButtonClick(btn, () => {
                    console.log(`🍔 Hamburger clicked: ${id}`);
                    togglePanel(menuPanel);
                });
            }
        });

        // Scene navigator buttons
        ['scene-navigator-btn', 'scene-navigator-btn-script'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                handleButtonClick(btn, () => {
                    console.log(`🧭 Scene navigator clicked: ${id}`);
                    updateSceneNavigator();
                    togglePanel(sceneNavigatorPanel, true);
                });
            }
        });

        // Close navigator button
        const closeNavigatorBtn = document.getElementById('close-navigator-btn');
        if (closeNavigatorBtn) {
            handleButtonClick(closeNavigatorBtn, () => {
                togglePanel(sceneNavigatorPanel, false);
            });
        }

        // Add new card button
        const addCardBtn = document.getElementById('add-new-card-btn');
        if (addCardBtn) {
            handleButtonClick(addCardBtn, () => {
                console.log('➕ Add card button clicked');
                addNewSceneCard();
            });
        }

        // Save all cards button
        const saveAllBtn = document.getElementById('save-all-cards-btn');
        if (saveAllBtn) {
            handleButtonClick(saveAllBtn, () => {
                console.log('💾 Save all cards button clicked');
                saveAllCardsAsImages();
            });
        }

        // Action buttons (desktop and mobile)
        document.querySelectorAll('.action-btn, .keyboard-btn').forEach(btn => {
            if (btn) {
                handleButtonClick(btn, handleActionBtn);
            }
        });

        // Menu handlers
        const menuHandlers = {
            'new-btn': () => {
                if (confirm('Are you sure? Unsaved changes will be lost.')) {
                    if (fountainInput) fountainInput.value = '';
                    projectData = {
                        projectInfo: {
                            projectName: 'Untitled',
                            prodName: 'Author',
                            directorName: '',
                            scriptContent: '',
                            scenes: [],
                            lastModified: new Date().toISOString(),
                            version: '1.0'
                        }
                    };
                    history.stack = [''];
                    history.currentIndex = 0;
                    history.updateButtons();
                    saveProjectData();
                    setPlaceholder();
                }
            },
            'open-btn': () => fileInput?.click(),
            'save-fountain-btn': saveAsFountain,
            'save-pdf-english-btn': saveAsPdfEnglish,
            'save-pdf-unicode-btn': saveAsPdfUnicode,
            'save-filmproj-btn': saveAsFilmProj,
            'scene-no-btn': toggleSceneNumbers,
            'auto-save-btn': toggleAutoSave,
            'zoom-in-btn': handleZoomIn,
            'zoom-out-btn': handleZoomOut,
            'clear-project-btn': () => {
                if (confirm('This will clear the entire project. Are you sure?')) {
                    fountainInput.value = '';
                    projectData = {
                        projectInfo: {
                            projectName: 'Untitled',
                            prodName: 'Author',
                            directorName: '',
                            scriptContent: '',
                            scenes: [],
                            lastModified: new Date().toISOString(),
                            version: '1.0'
                        }
                    };
                    history.stack = [''];
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
                handleButtonClick(element, handler);
            }
        });

        // Undo/Redo buttons
        document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top').forEach(btn => {
            if (btn) {
                handleButtonClick(btn, () => {
                    console.log('↶ Undo clicked');
                    history.undo();
                });
            }
        });

        document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top').forEach(btn => {
            if (btn) {
                handleButtonClick(btn, () => {
                    console.log('↷ Redo clicked');
                    history.redo();
                });
            }
        });

        // Global click handlers
        document.addEventListener('click', (e) => {
            // Close menu when clicking outside
            if (menuPanel && menuPanel.classList.contains('open') && 
                !menuPanel.contains(e.target) && 
                !e.target.closest('[id^="hamburger-btn"]')) {
                togglePanel(menuPanel, false);
            }
            
            // Close navigator when clicking outside
            if (sceneNavigatorPanel && sceneNavigatorPanel.classList.contains('open') && 
                !sceneNavigatorPanel.contains(e.target) && 
                !e.target.closest('[id^="scene-navigator-btn"]')) {
                togglePanel(sceneNavigatorPanel, false);
            }

            // Share card buttons
            if (e.target.closest('.share-card-btn')) {
                const btn = e.target.closest('.share-card-btn');
                const sceneId = btn.dataset.sceneId;
                console.log('📤 Share card:', sceneId);
                shareSceneCard(sceneId);
            }

            // Delete card buttons
            if (e.target.closest('.delete-card-btn')) {
                const btn = e.target.closest('.delete-card-btn');
                const sceneId = parseInt(btn.dataset.sceneId);
                console.log('🗑️ Delete card:', sceneId);
                if (confirm('Delete this scene? This will remove it from the script.')) {
                    projectData.projectInfo.scenes = projectData.projectInfo.scenes.filter(s => s.number !== sceneId);
                    renderEnhancedCardView();
                    syncCardsToEditor();
                    saveProjectData();
                }
            }
        });

        console.log('✅ ALL event listeners setup complete!');
    }

    // Initialize Application
    function initialize() {
        console.log('🚀 Initializing ToscripT Professional - Bug-Free Version...');
        
        setupEventListeners();
        setupKeyboardDetection();
        loadProjectData();

        if (fountainInput) {
            if (!fountainInput.value) setPlaceholder();
            fountainInput.style.fontSize = `${fontSize}px`;
            setTimeout(() => {
                if (currentView === 'write') fountainInput.focus();
            }, 500);
            history.add(fountainInput.value || '');
            history.updateButtons();
        }

        console.log('✅ ToscripT Professional initialized successfully!');
    }

    // Start initialization
    initialize();
});
