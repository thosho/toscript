document.addEventListener('DOMContentLoaded', () => {
    console.log("🎬 ToscripT Professional - Complete with Card Image Saving");
    
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
            } else {
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
                setTimeout(() => {
                    if (currentView === 'write' && window.innerWidth <= 768) {
                        showMobileToolbar();
                    }
                }, 300);
            });

            fountainInput.addEventListener('blur', () => {
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

    // View Switching
    function switchView(view) {
        currentView = view;
        [writeView, scriptView, cardView].forEach(v => v?.classList.remove('active'));
        [mainHeader, scriptHeader, cardHeader].forEach(h => h && (h.style.display = 'none'));
        
        const addBtn = document.getElementById('add-new-card-btn');
        if (addBtn) addBtn.style.display = 'none';
        
        hideMobileToolbar();

        if (view === 'script') {
            scriptView?.classList.add('active');
            if (scriptHeader) scriptHeader.style.display = 'flex';
            renderEnhancedScript();
        } else if (view === 'card') {
            cardView?.classList.add('active');
            if (cardHeader) cardHeader.style.display = 'flex';
            renderEnhancedCardView();
            setupAddNewCardButton();
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
                'timeOfDay': 'Enter DAY, NIGHT, MORNING, etc.'
            };
            
            if (filterHelpText) filterHelpText.textContent = helpTexts[selectedValue] || 'Enter keywords to filter';
        }
        
        if (filterValueInput) filterValueInput.value = '';
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

    // Screenplay Parsing
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

            if (index < 10 && (trimmed.startsWith('TITLE:') || trimmed.startsWith('AUTHOR:'))) {
                elements.push({ 
                    type: 'title', 
                    text: trimmed.replace(/^(TITLE:|AUTHOR:)\s*/, ''), 
                    original,
                    prefix: trimmed.startsWith('TITLE:') ? 'TITLE:' : 'AUTHOR:'
                });
                return;
            }

            if (/^(INT\.?\/EXT\.?|INT\.|EXT\.)\s+/i.test(trimmed)) {
                sceneCount++;
                elements.push({ 
                    type: 'scene_heading', 
                    text: trimmed.toUpperCase(), 
                    original,
                    sceneNumber: showSceneNumbers ? sceneCount : null,
                    sceneId: `scene_${sceneCount}`
                });
                return;
            }

            if (/^(CUT TO:|DISSOLVE TO:|FADE TO BLACK\.|FADE OUT\.|FADE IN:|SMASH CUT TO:)$/i.test(trimmed)) {
                elements.push({ type: 'transition', text: trimmed.toUpperCase(), original });
                return;
            }

            if (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && trimmed.length < 50 && 
                !trimmed.includes('.') && !trimmed.endsWith(':') &&
                !/^(FADE|CUT|DISSOLVE|INT|EXT)/.test(trimmed)) {
                
                let nextIndex = index + 1;
                while (nextIndex < lines.length && lines[nextIndex].trim() === '') nextIndex++;
                if (nextIndex < lines.length) {
                    const nextLine = lines[nextIndex].trim();
                    if (!(/^(INT\.?\/EXT\.?|INT\.|EXT\.)\s+/i.test(nextLine))) {
                        elements.push({ type: 'character', text: trimmed, original });
                        return;
                    }
                }
            }

            if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                elements.push({ type: 'parenthetical', text: trimmed, original });
                return;
            }

            if (elements.length > 0) {
                const prevElement = elements[elements.length - 1];
                if (prevElement.type === 'character' || 
                    (prevElement.type === 'parenthetical' && elements.length > 1 && elements[elements.length - 2].type === 'character')) {
                    elements.push({ type: 'dialogue', text: trimmed, original });
                    return;
                }
            }

            elements.push({ type: 'action', text: trimmed, original });
        });

        return elements;
    }

    // Script Rendering
    function renderEnhancedScript() {
        if (!screenplayOutput || !fountainInput) return;

        const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
        let scriptHtml = `<div class="title-page">
            <h1>${projectData.projectInfo.projectName || 'Untitled'}</h1>
            <p class="author">by ${projectData.projectInfo.prodName || 'Author'}</p>
        </div>`;

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
                    if (element.text) scriptHtml += `<div class="action">${element.text}</div>`;
            }
        });

        screenplayOutput.innerHTML = scriptHtml;
    }

    // Extract scenes
    function extractScenesFromText(text) {
        const elements = parseScriptWithIndustryStandards(text || '');
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;

        elements.forEach(element => {
            if (element.type === 'scene_heading') {
                if (currentScene) scenes.push(currentScene);
                sceneNumber++;
                currentScene = {
                    number: sceneNumber,
                    heading: element.text,
                    description: []
                };
            } else if (currentScene && element.type === 'action' && element.text) {
                currentScene.description.push(element.text);
            }
        });

        if (currentScene) scenes.push(currentScene);
        return scenes;
    }

    // FIXED: Card View Rendering with Image-Ready Format
    function renderEnhancedCardView() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer || !fountainInput) return;

        const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
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
                    description: []
                };
            } else if (currentScene && element.type === 'action' && element.text) {
                currentScene.description.push(element.text);
            }
        });

        if (currentScene) scenes.push(currentScene);

        if (scenes.length === 0) {
            cardContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--muted-text-color);">
                    <i class="fas fa-film" style="font-size: 4rem; margin-bottom: 2rem; opacity: 0.3;"></i>
                    <h3>No scenes found</h3>
                    <p>Click the + button to create your first scene card</p>
                </div>`;
            return;
        }

        // Create cards with image-ready format
        cardContainer.innerHTML = scenes.map(scene =>
            `<div class="scene-card card-for-export" data-scene-id="${scene.sceneId}" data-scene-number="${scene.sceneNumber}">
                <div class="scene-card-content">
                    <div class="card-header">
                        <div class="card-scene-title" contenteditable="true" data-placeholder="Enter scene heading...">${scene.heading}</div>
                        <input class="card-scene-number" type="text" value="#${scene.sceneNumber}" maxlength="5" data-scene-id="${scene.sceneId}" />
                    </div>
                    <div class="card-body">
                        <textarea class="card-description" placeholder="Enter detailed scene description...

Characters:
Actions:
Props:
Locations:
Special Notes:" data-scene-id="${scene.sceneId}">${scene.description.join('\n\n')}</textarea>
                    </div>
                    <div class="card-watermark">@TO SCRIPT</div>
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

        bindCardEditingEvents();

        if (typeof Sortable !== 'undefined') {
            new Sortable(cardContainer, {
                animation: 200,
                ghostClass: 'dragging',
                chosenClass: 'dragging',
                dragClass: 'dragging',
                onEnd: (evt) => {
                    syncCardsToEditor();
                }
            });
        }

        console.log(`🎞️ Rendered ${scenes.length} cards ready for image export`);
    }

    // Setup + Button
    function setupAddNewCardButton() {
        if (!cardHeader) return;

        let addBtn = document.getElementById('add-new-card-btn');
        if (!addBtn) {
            addBtn = document.createElement('button');
            addBtn.id = 'add-new-card-btn';
            addBtn.innerHTML = '<i class="fas fa-plus"></i>';
            addBtn.title = 'Add New Scene Card';
            addBtn.className = 'icon-btn';
            addBtn.style.marginRight = '1rem';
            
            const saveBtn = document.getElementById('save-all-cards-btn');
            if (saveBtn) {
                cardHeader.querySelector('.header-right').insertBefore(addBtn, saveBtn);
            } else {
                cardHeader.querySelector('.header-right').appendChild(addBtn);
            }

            addBtn.addEventListener('click', addNewSceneCard);
        }
        
        addBtn.style.display = 'inline-flex';
    }

    // Add New Card
    function addNewSceneCard() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;

        const newSceneNumber = cardContainer.children.length + 1;
        const newCardHtml = `
            <div class="scene-card card-for-export new-card" data-scene-id="scene_${newSceneNumber}" data-scene-number="${newSceneNumber}">
                <div class="scene-card-content">
                    <div class="card-header">
                        <div class="card-scene-title" contenteditable="true" data-placeholder="Enter scene heading...">INT. NEW LOCATION - DAY</div>
                        <input class="card-scene-number" type="text" value="#${newSceneNumber}" maxlength="5" data-scene-id="scene_${newSceneNumber}" />
                    </div>
                    <div class="card-body">
                        <textarea class="card-description" placeholder="Enter detailed scene description..." data-scene-id="scene_${newSceneNumber}"></textarea>
                    </div>
                    <div class="card-watermark">@TO SCRIPT</div>
                </div>
                <div class="card-actions">
                    <button class="icon-btn edit-card-btn" title="Edit Scene" data-scene-id="scene_${newSceneNumber}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn share-card-btn" title="Share Scene" data-scene-id="scene_${newSceneNumber}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>`;

        cardContainer.insertAdjacentHTML('beforeend', newCardHtml);
        
        const newCard = cardContainer.lastElementChild;
        const titleElement = newCard.querySelector('.card-scene-title');
        titleElement.focus();
        
        if (window.getSelection) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(titleElement);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        bindCardEditingEvents();
        syncCardsToEditor();
    }

    // Card Editing Events
    function bindCardEditingEvents() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;

        cardContainer.removeEventListener('input', handleCardInput);
        cardContainer.removeEventListener('blur', handleCardBlur);
        cardContainer.removeEventListener('keydown', handleCardKeydown);

        cardContainer.addEventListener('input', handleCardInput);
        cardContainer.addEventListener('blur', handleCardBlur);
        cardContainer.addEventListener('keydown', handleCardKeydown);
    }

    function handleCardKeydown(e) {
        if (e.target.classList.contains('card-description')) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const textarea = e.target;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 4;
                
                syncCardsToEditor();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                syncCardsToEditor();
                saveProjectData();
            }
        }
    }

    function handleCardInput(e) {
        if (e.target.classList.contains('card-scene-title') || 
            e.target.classList.contains('card-description') ||
            e.target.classList.contains('card-scene-number')) {
            
            clearTimeout(handleCardInput.timeout);
            handleCardInput.timeout = setTimeout(() => {
                syncCardsToEditor();
            }, 300);
        }
    }

    function handleCardBlur(e) {
        if (e.target.classList.contains('card-scene-title') || 
            e.target.classList.contains('card-description') ||
            e.target.classList.contains('card-scene-number')) {
            syncCardsToEditor();
        }
    }

    // Sync Cards to Editor
    function syncCardsToEditor() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer || !fountainInput) return;

        let scriptText = '';
        const cards = Array.from(cardContainer.querySelectorAll('.scene-card'));
        
        cards.forEach((card, index) => {
            const titleElement = card.querySelector('.card-scene-title');
            const descriptionElement = card.querySelector('.card-description');
            const numberElement = card.querySelector('.card-scene-number');
            
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
                const cleanDescription = description
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('\n\n');
                
                scriptText += `${cleanDescription}\n\n`;
            }
            
            if (numberElement) {
                const newNumber = index + 1;
                if (!numberElement.value.includes('#')) {
                    numberElement.value = `#${newNumber}`;
                }
                card.dataset.sceneNumber = newNumber;
            }
        });

        if (scriptText.trim() !== fountainInput.value.trim()) {
            const cursorPosition = fountainInput.selectionStart;
            fountainInput.value = scriptText.trim();
            fountainInput.setSelectionRange(cursorPosition, cursorPosition);
            history.add(fountainInput.value);
            saveProjectData();
        }
    }

    // Action buttons
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
                const newText = currentLine === currentLine.toUpperCase() ? currentLine.toLowerCase() : currentLine.toUpperCase();
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

    // Card functions
    function editSceneFromCard(sceneId) {
        const targetSceneNumber = parseInt(sceneId.replace('scene_', ''));
        const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
        let charPosition = 0;
        let sceneCount = 0;

        for (let element of elements) {
            if (element.type === 'scene_heading') {
                sceneCount++;
                if (sceneCount === targetSceneNumber) {
                    switchView('write');
                    setTimeout(() => {
                        if (fountainInput) {
                            fountainInput.focus();
                            fountainInput.setSelectionRange(charPosition, charPosition);
                        }
                    }, 300);
                    return;
                }
            }
            charPosition += element.original.length + 1;
        }
    }

    // Share single scene card
    async function shareSceneCard(sceneId) {
        const cardElement = document.querySelector(`[data-scene-id="${sceneId}"]`);
        if (!cardElement) {
            alert('Unable to find scene card.');
            return;
        }

        try {
            const actionsDiv = cardElement.querySelector('.card-actions');
            actionsDiv.style.opacity = '0';
            actionsDiv.style.visibility = 'hidden';

            let dataUrl;
            if (typeof htmlToImage !== 'undefined') {
                dataUrl = await htmlToImage.toPng(cardElement.querySelector('.scene-card-content'), {
                    backgroundColor: 'white',
                    pixelRatio: 3,
                    width: 380,
                    height: 320
                });
            } else if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(cardElement.querySelector('.scene-card-content'), {
                    backgroundColor: 'white',
                    scale: 3,
                    width: 380,
                    height: 320,
                    useCORS: true,
                    allowTaint: true
                });
                dataUrl = canvas.toDataURL('image/png', 1.0);
            }
            
            actionsDiv.style.opacity = '';
            actionsDiv.style.visibility = '';
            
            if (dataUrl) {
                const sceneNumber = cardElement.querySelector('.card-scene-number').value.replace('#', '');
                const sceneTitle = cardElement.querySelector('.card-scene-title').textContent.trim();
                const fileName = `Scene_${sceneNumber}_${sceneTitle.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                
                if (navigator.share) {
                    try {
                        const response = await fetch(dataUrl);
                        const blob = await response.blob();
                        const file = new File([blob], fileName, { type: 'image/png' });
                        await navigator.share({ 
                            title: `Scene ${sceneNumber}: ${sceneTitle}`,
                            files: [file] 
                        });
                    } catch {
                        downloadBlob(dataUrl, fileName);
                    }
                } else {
                    downloadBlob(dataUrl, fileName);
                }
            }
        } catch (err) {
            console.error('Share failed:', err);
            alert('Unable to share scene card.');
        }
    }

    function downloadBlob(dataUrl, fileName) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // FIXED: New function - Save All Cards as Images (replaces ZIP functionality)
    async function saveAllCardsAsImages() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) {
            alert('No cards to save.');
            return;
        }

        const cards = cardContainer.querySelectorAll('.card-for-export');
        if (cards.length === 0) {
            alert('No cards to save.');
            return;
        }

        console.log(`🖼️ Starting to save ${cards.length} cards as images...`);

        try {
            let successCount = 0;
            
            for (const [index, card] of Array.from(cards).entries()) {
                try {
                    // Hide action buttons for clean export
                    const actionsDiv = card.querySelector('.card-actions');
                    if (actionsDiv) {
                        actionsDiv.style.opacity = '0';
                        actionsDiv.style.visibility = 'hidden';
                    }

                    let dataUrl;
                    
                    // Try htmlToImage first (higher quality)
                    if (typeof htmlToImage !== 'undefined') {
                        dataUrl = await htmlToImage.toPng(card.querySelector('.scene-card-content'), {
                            backgroundColor: 'white',
                            pixelRatio: 3,
                            width: 380,
                            height: 320,
                            quality: 0.95
                        });
                    } else if (typeof html2canvas !== 'undefined') {
                        // Fallback to html2canvas
                        const canvas = await html2canvas(card.querySelector('.scene-card-content'), {
                            backgroundColor: 'white',
                            scale: 3,
                            width: 380,
                            height: 320,
                            useCORS: true,
                            allowTaint: true
                        });
                        dataUrl = canvas.toDataURL('image/png', 0.95);
                    }
                    
                    // Restore action buttons
                    if (actionsDiv) {
                        actionsDiv.style.opacity = '';
                        actionsDiv.style.visibility = '';
                    }

                    if (dataUrl) {
                        const sceneNumber = card.dataset.sceneNumber || (index + 1);
                        const sceneTitle = card.querySelector('.card-scene-title')?.textContent?.trim() || 'Scene';
                        const cleanTitle = sceneTitle.substring(0, 30).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
                        const fileName = `Scene_${sceneNumber}_${cleanTitle}.png`;
                        
                        // Download the image
                        const a = document.createElement('a');
                        a.href = dataUrl;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        successCount++;
                        
                        // Small delay between downloads to prevent overwhelming the browser
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                    
                } catch (cardError) {
                    console.error(`Failed to save card ${index + 1}:`, cardError);
                }
            }
            
            if (successCount > 0) {
                alert(`🎉 Successfully saved ${successCount} scene cards as PNG images!\n\nFiles saved to your Downloads folder.`);
                console.log(`✅ Successfully saved ${successCount}/${cards.length} cards as images`);
            } else {
                alert('❌ Failed to save any cards. Please try again.');
            }
            
        } catch (error) {
            console.error('Error saving cards as images:', error);
            alert('Failed to save cards as images. Please make sure you have the required libraries loaded.');
        }
    }

    // Enhanced PDF Export
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

            doc.setFont('courier');
            
            const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
            let y = 50;
            const lineHeight = 14;
            const pageHeight = 792;
            const margin = 72;
            const pageWidth = 612;

            doc.setFontSize(18);
            doc.text(projectData.projectInfo.projectName || 'Untitled', pageWidth/2, y, { align: 'center' });
            y += 30;

            doc.setFontSize(14);
            doc.text(`by ${projectData.projectInfo.prodName || 'Author'}`, pageWidth/2, y, { align: 'center' });
            y += 80;

            doc.setFontSize(12);

            elements.forEach(element => {
                if (element.type === 'title') return;

                if (y > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }

                let x = margin;

                switch (element.type) {
                    case 'scene_heading':
                        y += lineHeight;
                        if (element.sceneNumber && showSceneNumbers) {
                            doc.text(`${element.sceneNumber}.`, pageWidth - margin - 30, y, { align: 'right' });
                        }
                        doc.text(element.text, x, y);
                        break;
                    case 'character':
                        x = margin + 266;
                        doc.text(element.text, x, y);
                        break;
                    case 'dialogue':
                        x = margin + 180;
                        const dialogueText = doc.splitTextToSize(element.text, 252);
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
                        x = margin + 223;
                        doc.text(element.text, x, y);
                        break;
                    case 'transition':
                        doc.text(element.text, pageWidth - margin, y, { align: 'right' });
                        break;
                    case 'action':
                        const actionText = doc.splitTextToSize(element.text, 432);
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
            
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Error generating PDF. Please try again.');
        }
    }

    // File Operations
    function saveAsFountain() {
        const text = fountainInput.value || '';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        downloadBlob(blob, `${projectData.projectInfo.projectName}.fountain`);
    }

    function saveAsFilmproj() {
        const filmproj = {
            projectName: projectData.projectInfo.projectName,
            author: projectData.projectInfo.prodName,
            scenes: extractScenesFromText(fountainInput.value || ''),
            created: new Date().toISOString(),
            version: "1.0"
        };
        
        const blob = new Blob([JSON.stringify(filmproj, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${projectData.projectInfo.projectName}.filmproj`);
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
                    
                    if (filmproj.projectName) projectData.projectInfo.projectName = filmproj.projectName;
                    if (filmproj.author) projectData.projectInfo.prodName = filmproj.author;
                    
                    let fountainText = '';
                    if (filmproj.scenes && Array.isArray(filmproj.scenes)) {
                        filmproj.scenes.forEach(scene => {
                            fountainText += `${scene.heading}\n\n`;
                            if (scene.description && Array.isArray(scene.description)) {
                                fountainText += `${scene.description.join('\n')}\n\n`;
                            }
                        });
                    }
                    
                    if (fountainInput) {
                        fountainInput.value = fountainText.trim();
                        clearPlaceholder();
                    }
                    
                    console.log('📂 .filmproj file loaded successfully');
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

    // Scene navigator
    function updateSceneNavigator() {
        const sceneList = document.getElementById('scene-list');
        if (!sceneList || !fountainInput) return;

        const elements = parseScriptWithIndustryStandards(fountainInput.value || '');
        const scenes = elements.filter(el => el.type === 'scene_heading');

        sceneList.innerHTML = scenes.map((scene, index) =>
            `<li data-line="${index}">${scene.text}</li>`
        ).join('');
    }

    // Event Listeners Setup
    function setupEventListeners() {
        console.log('🔧 Setting up event listeners...');

        if (fountainInput) {
            fountainInput.addEventListener('focus', () => {
                clearPlaceholder();
                if (window.innerWidth <= 768 && currentView === 'write') {
                    setTimeout(showMobileToolbar, 300);
                }
            });
            
            fountainInput.addEventListener('blur', () => {
                setPlaceholder();
                setTimeout(() => {
                    if (!document.activeElement?.closest('.mobile-keyboard-toolbar')) {
                        hideMobileToolbar();
                    }
                }, 200);
            });
            
            fountainInput.addEventListener('input', () => {
                history.add(fountainInput.value);
                saveProjectData();
                if (currentView === 'card') {
                    setTimeout(renderEnhancedCardView, 100);
                }
            });
        }

        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.accept = '.fountain,.filmproj,.txt';
            fileInput.addEventListener('change', openFountainFile);
        }

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
                    switchView(view);
                });
            }
        });

        ['hamburger-btn', 'hamburger-btn-script', 'hamburger-btn-card'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (menuPanel) menuPanel.classList.toggle('open');
                });
            }
        });

        ['scene-navigator-btn', 'scene-navigator-btn-script'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
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

        if (filterCategorySelect) {
            filterCategorySelect.addEventListener('change', handleFilterChange);
        }

        // FIXED: Updated menu handlers with image saving functionality
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
            'save-pdf-btn': saveAsPdfWithUnicode,
            'save-filmproj-btn': saveAsFilmproj,
            'project-info-btn': openProjectInfoModal,
            'info-btn': () => document.getElementById('info-modal')?.classList.add('open'),
            'about-btn': () => document.getElementById('about-modal')?.classList.add('open'),
            'scene-no-btn': toggleSceneNumbers,
            'auto-save-btn': toggleAutoSave,
            // FIXED: Replace ZIP functionality with image saving
            'save-all-cards-btn': saveAllCardsAsImages,
            'zoom-in-btn': handleZoomIn,
            'zoom-out-btn': handleZoomOut,
            'fullscreen-btn-main': () => {
                document.body.classList.toggle('fullscreen-active');
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(console.error);
                } else {
                    document.exitFullscreen().catch(console.error);
                }
            }
        };

        Object.entries(menuHandlers).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });

        document.querySelectorAll('.action-btn, .keyboard-btn').forEach(btn => {
            btn.addEventListener('click', handleActionBtn);
        });

        document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top').forEach(btn => {
            btn.addEventListener('click', () => history.undo());
        });

        document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top').forEach(btn => {
            btn.addEventListener('click', () => history.redo());
        });

        // Event Delegation
        document.addEventListener('click', (e) => {
            if (menuPanel && menuPanel.classList.contains('open') && !menuPanel.contains(e.target) && 
                !e.target.closest('[id^="hamburger-btn"]')) {
                menuPanel.classList.remove('open');
            }

            if (sceneNavigatorPanel && sceneNavigatorPanel.classList.contains('open') && 
                !sceneNavigatorPanel.contains(e.target) && !e.target.closest('[id^="scene-navigator-btn"]')) {
                sceneNavigatorPanel.classList.remove('open');
            }

            const modal = e.target.closest('.modal');
            if (e.target.classList.contains('modal-close-btn') || e.target === modal) {
                if (modal) modal.classList.remove('open');
            }

            if (e.target.id === 'save-project-info-btn') handleSaveProjectInfo();

            if (e.target.closest('.edit-card-btn')) {
                const btn = e.target.closest('.edit-card-btn');
                const sceneId = btn.dataset.sceneId || btn.closest('.scene-card').dataset.sceneId;
                if (sceneId) {
                    editSceneFromCard(sceneId);
                }
            }

            if (e.target.closest('.share-card-btn')) {
                const btn = e.target.closest('.share-card-btn');
                const sceneId = btn.dataset.sceneId || btn.closest('.scene-card').dataset.sceneId;
                if (sceneId) {
                    shareSceneCard(sceneId);
                }
            }
        });

        console.log('✅ All event listeners setup complete');
    }

    // Initialize Application
    function initialize() {
        console.log('🎬 Initializing ToscripT Professional with Image Saving');

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

        createModal('about-modal', 'About ToscripT',
            `<div style="text-align: center; margin: 2rem 0;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎬</div>
                <h3 style="color: var(--primary-color); margin: 0;">ToscripT Professional</h3>
                <p style="color: var(--muted-text-color); margin: 0.5rem 0;">Professional Screenwriting with Image Export</p>
                <hr style="border-color: var(--border-color); margin: 2rem 0;">
                <p><strong>Designed by Thosho Tech</strong></p>
                <p style="font-size: 0.9rem; color: var(--muted-text-color);">
                    Professional screenwriting with high-quality card image export functionality.
                </p>
            </div>`
        );

        createModal('info-modal', 'Info & Help',
            `<div style="line-height: 1.6;">
                <h3 style="color: var(--primary-color); margin-top: 0;">🖼️ Image Export Feature</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>High Quality:</strong> Cards saved as PNG images at 3x resolution</li>
                    <li><strong>Clean Export:</strong> Action buttons hidden during image export</li>
                    <li><strong>Professional Format:</strong> Perfect 380x320 dimensions for printing</li>
                    <li><strong>Batch Save:</strong> Save all cards at once with sequential naming</li>
                    <li><strong>Watermark Included:</strong> @TO SCRIPT watermark on each card</li>
                </ul>
                <h3 style="color: var(--primary-color);">📱 Card Features</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>HUGE Description Area:</strong> Maximum space for scene content</li>
                    <li><strong>Left-Side Buttons:</strong> Edit and share buttons slide in from left</li>
                    <li><strong>Editable Numbers:</strong> Click scene numbers to edit</li>
                    <li><strong>Drag & Drop:</strong> Reorder scenes with smooth animations</li>
                    <li><strong>+ Button:</strong> Add new scenes easily in card view</li>
                    <li><strong>Bidirectional Sync:</strong> Changes sync between cards and editor</li>
                </ul>
                <h3 style="color: var(--primary-color);">💾 File Support</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>Open:</strong> .fountain, .filmproj, .txt files</li>
                    <li><strong>Save As:</strong> .fountain, .filmproj, .pdf formats</li>
                    <li><strong>Export:</strong> Individual scene cards as PNG images</li>
                    <li><strong>Share:</strong> Individual cards via native sharing</li>
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

        console.log('✅ ToscripT Professional initialized with image export!');
        console.log('🖼️ Save button now exports each card as high-quality PNG image');
        console.log('🎞️ Professional card format with huge description areas');
        console.log('📱 Perfect mobile experience with keyboard toolbar');
        console.log('🌍 Ready to create professional screenplay cards! 🎬');
    }

    setTimeout(initialize, 100);
});
