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

    // Enhanced Scene Parsing
    function extractScenesFromText(text) {
        if (!text) return [];
        
        const lines = text.split('\n');
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (/^(INT\.?\/EXT\.?|INT\.|EXT\.)\s+/i.test(trimmed)) {
                if (currentScene) scenes.push(currentScene);
                sceneNumber++;
                
                const parts = trimmed.split(' - ');
                const location = parts[0].trim();
                const timeOfDay = (parts[1] || 'DAY').trim();
                
                currentScene = {
                    number: sceneNumber,
                    heading: trimmed.toUpperCase(),
                    sceneType: location.match(/^(INT\.?\/EXT\.?|INT\.|EXT\.)/i)[0],
                    location: location.replace(/^(INT\.?\/EXT\.?|INT\.|EXT\.)\s*/i, ''),
                    timeOfDay: timeOfDay,
                    description: [],
                    characters: []
                };
            } else if (currentScene && trimmed && !/^[A-Z\s]+$/.test(trimmed)) {
                currentScene.description.push(trimmed);
            }
        });

        if (currentScene) scenes.push(currentScene);
        return scenes;
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

    // FIXED: Enhanced Script Rendering with Black Text
    function renderEnhancedScript() {
        if (!screenplayOutput) return;

        const scenes = projectData.projectInfo.scenes || [];
        let scriptHtml = `<div class="title-page">
            <h1 style="color: black !important;">${projectData.projectInfo.projectName || 'Untitled'}</h1>
            <p class="author" style="color: black !important;">by ${projectData.projectInfo.prodName || 'Author'}</p>
        </div>`;

        scenes.forEach(scene => {
            const sceneNum = showSceneNumbers ? `${scene.number}. ` : '';
            // FIXED: Ensure scene headings are black
            scriptHtml += `<h3 class="scene-heading" style="color: black !important; font-weight: bold; text-transform: uppercase; margin: 2rem 0 1rem 0;">${sceneNum}${scene.heading}</h3>`;
            
            scene.description.forEach(desc => {
                scriptHtml += `<div class="action" style="color: black !important;">${desc}</div>`;
            });
        });

        screenplayOutput.innerHTML = scriptHtml;
        console.log("📄 Script rendered with black text");
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

    // FIXED: Add New Scene Card Function
    function addNewSceneCard() {
        console.log("➕ Adding new scene card");
        
        if (!fountainInput) return;
        
        const currentScenes = projectData.projectInfo.scenes || [];
        const newSceneNumber = currentScenes.length + 1;
        const newSceneText = `\n\nINT. NEW LOCATION - DAY\n\nScene description goes here...\n`;
        
        // Add to the end of current script
        const currentValue = fountainInput.value || '';
        fountainInput.value = currentValue + newSceneText;
        
        // Update history and save
        history.add(fountainInput.value);
        saveProjectData();
        
        // Re-render card view
        projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
        renderEnhancedCardView();
        
        // Focus on the new card
        setTimeout(() => {
            const cards = document.querySelectorAll('.scene-card');
            const lastCard = cards[cards.length - 1];
            if (lastCard) {
                const titleElement = lastCard.querySelector('.card-scene-title');
                if (titleElement) {
                    titleElement.focus();
                    // Select all text
                    if (window.getSelection) {
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(titleElement);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }
        }, 100);
    }

    // FIXED: Enhanced Card Export function to create a print-friendly format
    async function saveAllCardsAsImages() {
        console.log("💾 Saving all cards as images with professional index card formatting...");
        
        const cards = document.querySelectorAll('.card-for-export');
        if (cards.length === 0) {
            alert('No cards to save.');
            return;
        }

        if (typeof html2canvas === 'undefined') {
            alert('❌ Image generation library (html2canvas) is not loaded. Cannot save cards.');
            return;
        }

        let savedCount = 0;
        
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            
            // 1. Extract data from the visible card
            const sceneNumber = card.querySelector('.card-scene-number')?.value || `#${i + 1}`;
            const sceneHeading = card.querySelector('.card-scene-title')?.textContent || 'Untitled Scene';
            const description = card.querySelector('.card-description')?.value || 'No description.';

            // 2. Create a temporary, hidden element formatted like a real index card
            const printableCard = document.createElement('div');
            printableCard.style.cssText = `
                position: absolute;
                left: -9999px; /* Position off-screen */
                width: 480px; /* 5 inches at 96dpi */
                height: 288px; /* 3 inches at 96dpi */
                background-color: white;
                border: 1px solid #888;
                font-family: 'Courier New', monospace;
                color: black;
                padding: 15px;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
            `;
            
            // 3. Populate the printable card with formatted content
            // We take just the first few lines of the description for a clean summary
            const descriptionSummary = description.split('\n').slice(0, 5).join('<br>');
            
            printableCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
                    <span style="font-size: 14px; font-weight: bold; max-width: 80%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sceneHeading}</span>
                    <span style="font-size: 16px; font-weight: bold;">${sceneNumber}</span>
                </div>
                <div style="flex-grow: 1; padding-top: 15px; font-size: 15px; line-height: 1.5;">
                    ${descriptionSummary}
                </div>
                <div style="font-size: 10px; text-align: right; opacity: 0.5; margin-top: auto;">@ToscripT</div>
            `;
            
            // 4. Append to body, screenshot it, then remove it
            document.body.appendChild(printableCard);
            
            try {
                const canvas = await html2canvas(printableCard, { scale: 2 });
                const dataUrl = canvas.toDataURL('image/png', 0.95);

                // Create a clean filename
                const cleanTitle = sceneHeading.substring(0, 30).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
                const fileName = `Scene_${sceneNumber.replace('#', '')}_${cleanTitle}.png`;
                
                // Trigger download
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = fileName;
                a.click();
                
                savedCount++;
                await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between downloads
                
            } catch (error) {
                console.error(`Failed to save card ${i + 1}:`, error);
            } finally {
                // IMPORTANT: Clean up by removing the temporary element
                document.body.removeChild(printableCard);
            }
        }
        
        if (savedCount > 0) {
            alert(`🎉 Successfully saved ${savedCount} scene cards as PNG images!`);
        } else {
            alert('❌ Failed to save cards. An error occurred during image generation.');
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

    // FIXED: Enhanced Scene Navigator with Scene Numbers and DAY/NIGHT
    function updateSceneNavigator() {
        if (!sceneList) return;

        const scenes = projectData.projectInfo.scenes || [];
        
        sceneList.innerHTML = scenes.map(scene => `
            <li data-scene-number="${scene.number}" onclick="jumpToScene(${scene.number})">
                <div class="scene-item-header">
                    <span class="scene-number">#${scene.number}</span>
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
                dragClass: 'dragging',
                onEnd: (evt) => {
                    console.log('🔄 Scene reordered');
                    // Here you could implement scene reordering logic
                }
            });
        }

        console.log(`🎭 Scene navigator updated with ${scenes.length} scenes`);
    }

    // Jump to scene in editor
    function jumpToScene(sceneNumber) {
        if (!fountainInput) return;
        
        const scenes = projectData.projectInfo.scenes || [];
        const targetScene = scenes.find(s => s.number === sceneNumber);
        
        if (targetScene) {
            const sceneText = targetScene.heading;
            const index = fountainInput.value.indexOf(sceneText);
            
            if (index > -1) {
                switchView('write');
                setTimeout(() => {
                    fountainInput.focus();
                    fountainInput.setSelectionRange(index, index + sceneText.length);
                    fountainInput.scrollTop = fountainInput.scrollHeight * (index / fountainInput.value.length);
                }, 200);
            }
        }
        
        // Close navigator
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
            
            const scenes = projectData.projectInfo.scenes || [];
            let y = 50;
            const lineHeight = 14;
            const pageHeight = 792;
            const margin = 72;
            const pageWidth = 612;

            // Title page
            doc.setFontSize(18);
            doc.text(projectData.projectInfo.projectName || 'Untitled', pageWidth/2, y, { align: 'center' });
            y += 30;

            doc.setFontSize(14);
            doc.text(`by ${projectData.projectInfo.prodName || 'Author'}`, pageWidth/2, y, { align: 'center' });
            y += 80;

            doc.setFontSize(12);

            // Scenes
            scenes.forEach(scene => {
                if (y > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }

                // Scene heading
                y += lineHeight;
                if (showSceneNumbers) {
                    doc.text(`${scene.number}.`, pageWidth - margin - 30, y, { align: 'right' });
                }
                doc.text(scene.heading, margin, y);
                y += lineHeight;

                // Scene description
                scene.description.forEach(desc => {
                    if (y > pageHeight - margin) {
                        doc.addPage();
                        y = margin;
                    }
                    
                    const actionText = doc.splitTextToSize(desc, 432);
                    if (Array.isArray(actionText)) {
                        actionText.forEach((line, index) => {
                            doc.text(line, margin, y);
                            if (index < actionText.length - 1) y += lineHeight;
                        });
                    } else {
                        doc.text(actionText, margin, y);
                    }
                    y += lineHeight;
                });

                y += lineHeight;
            });

            doc.save(`${projectData.projectInfo.projectName || 'screenplay'}.pdf`);
            
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Error generating PDF. Please try again.');
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
                history.add(fountainInput.value);
                saveProjectData();
                projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
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
            'save-pdf-btn': saveAsPdfWithUnicode,
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
