

document.addEventListener('DOMContentLoaded', () => {
    // Global variables
    let projectData = {
        projectInfo: {
            projectName: 'Untitled',
            prodName: 'Author',
            scriptContent: '',
            scenes: []
        }
    };
    let fontSize = 16;
    let autoSaveInterval = null;
    let showSceneNumbers = true;
    let currentView = 'write';
    let debounceTimeout = null;
    let isUpdatingFromSync = false;

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

    // History system
    const history = {
        stack: [],
        currentIndex: 0,
        add(value) {
            if (value !== this.stack[this.currentIndex]) {
                this.stack = this.stack.slice(0, this.currentIndex + 1);
                this.stack.push(value);
                this.currentIndex = this.stack.length - 1;
            }
            this.updateButtons();
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
                fountainInput.value = this.stack[this.currentIndex];
                if (fountainInput.value) clearPlaceholder();
                else setPlaceholder();
                this.updateButtons();
                saveProjectData();
            }
        },
        updateButtons() {
            const undoBtns = document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top');
            const redoBtns = document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top');
            undoBtns.forEach(btn => btn.disabled = this.currentIndex <= 0);
            redoBtns.forEach(btn => btn.disabled = this.currentIndex >= this.stack.length - 1);
        }
    };

    // Keyboard detection
    function setupKeyboardDetection() {
        let initialHeight = window.innerHeight;

        function handleKeyboardToggle() {
            const currentHeight = window.innerHeight;
            const heightDiff = initialHeight - currentHeight;
            const keyboardOpen = heightDiff > 150;

            if (keyboardOpen && currentView === 'write' && window.innerWidth < 768) showMobileToolbar();
            else if (!document.activeElement?.closest('.mobile-keyboard-toolbar')) hideMobileToolbar();
        }

        if (window.visualViewport) window.visualViewport.addEventListener('resize', handleKeyboardToggle);
        else window.addEventListener('resize', handleKeyboardToggle);

        fountainInput.addEventListener('focus', () => {
            clearPlaceholder();
            setTimeout(() => {
                if (currentView === 'write' && window.innerWidth < 768) showMobileToolbar();
            }, 300);
        });

        fountainInput.addEventListener('blur', () => {
            setPlaceholder();
            setTimeout(() => {
                if (!document.activeElement?.closest('.mobile-keyboard-toolbar')) hideMobileToolbar();
            }, 200);
        });
    }

    function showMobileToolbar() {
        if (mobileToolbar && window.innerWidth < 768) {
            mobileToolbar.classList.add('show');
            console.log('Mobile toolbar shown');
        }
    }

    function hideMobileToolbar() {
        if (mobileToolbar) mobileToolbar.classList.remove('show');
    }

    // Placeholder
    function setPlaceholder() {
        if (fountainInput && !fountainInput.value) {
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

    // Save/Load project data
    function saveProjectData() {
        if (fountainInput) {
            projectData.projectInfo.scriptContent = fountainInput.value;
            projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
        }
        localStorage.setItem('universalFilmProjectToScript', JSON.stringify(projectData));
    }

    function loadProjectData() {
        const savedData = localStorage.getItem('universalFilmProjectToScript');
        if (savedData) projectData = JSON.parse(savedData);
        fountainInput.value = projectData.projectInfo.scriptContent || '';
        if (!fountainInput.value) setPlaceholder();
        updateSceneNoIndicator();
        updateAutoSaveIndicator();
    }

    // Fountain parser from CODE ONE
    function parseFountain(input) {
        if (input === placeholderText || !input.trim()) return [];
        const lines = input.split('\n');
        const tokens = [];
        let inDialogue = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const nextLine = (i + 1 < lines.length) ? lines[i+1].trim() : null;

            if (!line) {
                tokens.push({ type: 'empty' });
                inDialogue = false;
                continue;
            }

            if (line.toUpperCase().startsWith('INT.') || line.toUpperCase().startsWith('EXT.')) {
                tokens.push({ type: 'sceneheading', text: line.toUpperCase() });
                inDialogue = false;
                continue;
            }

            if (line.toUpperCase().endsWith('TO:') || line.toUpperCase() === 'FADE OUT.' || line.toUpperCase() === 'FADE IN:' || line.toUpperCase() === 'FADE TO BLACK:') {
                tokens.push({ type: 'transition', text: line.toUpperCase() });
                inDialogue = false;
                continue;
            }

            if (line === line.toUpperCase() && !line.startsWith('!') && line.length > 0 && nextLine) {
                tokens.push({ type: 'character', text: line });
                inDialogue = true;
                continue;
            }

            if (inDialogue && line.startsWith('(')) {
                tokens.push({ type: 'parenthetical', text: line });
                continue;
            }

            if (inDialogue) {
                tokens.push({ type: 'dialogue', text: line });
                continue;
            }

            tokens.push({ type: 'action', text: line });
        }

        return tokens;
    }

    // Extract scenes
    function extractScenesFromText(text) {
        if (!text || !text.trim()) return [];
        const tokens = parseFountain(text);
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;

        tokens.forEach(token => {
            if (token.type === 'sceneheading') {
                if (currentScene) scenes.push(currentScene);
                sceneNumber++;
                const heading = token.text.toUpperCase();
                const sceneTypeMatch = heading.match(/(INT\.|EXT\.|INT\.\\/EXT\.|EXT\.\\/INT\.)/i);
                const sceneType = sceneTypeMatch ? sceneTypeMatch[1] : 'INT.';
                const timeMatch = heading.match(/-(DAY|NIGHT|MORNING|EVENING|DAWN|DUSK|CONTINUOUS|LATER|MOMENTS LATER)/i);
                const timeOfDay = timeMatch ? timeMatch[1] : 'DAY';
                let location = heading.replace(/(INT\.|EXT\.|INT\.\\/EXT\.|EXT\.\\/INT\.)/i, '').replace(/-(DAY|NIGHT|MORNING|EVENING|DAWN|DUSK|CONTINUOUS|LATER|MOMENTS LATER)/i, '').trim();
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
                if (token.type === 'action' || token.type === 'dialogue') {
                    currentScene.description.push(token.text);
                } else if (token.type === 'character') {
                    const charName = token.text.trim().toUpperCase();
                    if (!currentScene.characters.includes(charName)) currentScene.characters.push(charName);
                    currentScene.description.push(token.text);
                } else if (token.type === 'parenthetical' || token.type === 'transition') {
                    currentScene.description.push(token.text);
                }
            } else {
                sceneNumber++;
                currentScene = {
                    number: sceneNumber,
                    heading: 'UNTITLED SCENE',
                    sceneType: 'INT.',
                    location: 'UNKNOWN',
                    timeOfDay: 'DAY',
                    description: [token.text],
                    characters: []
                };
                if (token.type === 'character') {
                    const charName = token.text.trim().toUpperCase();
                    currentScene.characters.push(charName);
                }
            }
        });
        if (currentScene) scenes.push(currentScene);
        return scenes;
    }

    // (End of Part 1 - Paste Part 2 below this)

// Switch View with Sync
    function switchView(view) {
        console.log(`Switching to view: ${view}`);
        currentView = view;
        [writeView, scriptView, cardView].forEach(v => v?.classList.remove('active'));
        [mainHeader, scriptHeader, cardHeader].forEach(h => h && (h.style.display = 'none'));
        hideMobileToolbar();

        if (view === 'script') {
            scriptView?.classList.add('active');
            if (scriptHeader) scriptHeader.style.display = 'flex';
            renderEnhancedScript();
        } else if (view === 'card') {
            syncCardsToEditor();  // Card to script sync
            syncScriptToCards();  // Script to card sync
            cardView?.classList.add('active');
            if (cardHeader) cardHeader.style.display = 'flex';
        } else {
            writeView?.classList.add('active');
            if (mainHeader) mainHeader.style.display = 'flex';
            setTimeout(() => {
                if (fountainInput) fountainInput.focus();
                if (window.innerWidth < 768 && currentView === 'write') showMobileToolbar();
            }, 200);
        }
    }

    // Render Enhanced Script with Right-Side Scene Numbers
    function renderEnhancedScript() {
        if (!screenplayOutput || !fountainInput) return;

        const tokens = parseFountain(fountainInput.value);
        let scriptHtml = '';
        let sceneCount = 0;

        tokens.forEach(token => {
            switch (token.type) {
                case 'sceneheading':
                    sceneCount++;
                    const sceneNum = showSceneNumbers ? `<span class="scene-number">${sceneCount}</span>` : '';
                    scriptHtml += `<div class="scene-heading"><span>${token.text}</span>${sceneNum}</div>`;
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
                    scriptHtml += '<div class="empty-line"></div>';
                    break;
            }
        });

        screenplayOutput.innerHTML = scriptHtml;
    }

    // Render Enhanced Card View
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
    }

    // Sync Cards to Editor
    function syncCardsToEditor() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer || !fountainInput || isUpdatingFromSync) return;

        isUpdatingFromSync = true;
        let scriptText = '';
        const cards = Array.from(cardContainer.querySelectorAll('.scene-card'));
        cards.forEach((card, index) => {
            const title = card.querySelector('.card-scene-title')?.textContent?.trim() || '';
            const description = card.querySelector('.card-description')?.value || '';
            scriptText += title + '\n' + description + '\n\n';
        });

        fountainInput.value = scriptText.trim();
        history.add(fountainInput.value);
        saveProjectData();
        isUpdatingFromSync = false;
    }

    // Sync Script to Cards
    function syncScriptToCards() {
        if (currentView !== 'card') return;

        const scriptText = fountainInput.value;
        const scenes = extractScenesFromText(scriptText);
        projectData.projectInfo.scenes = scenes;
        renderEnhancedCardView();
    }

    // Add New Scene Card
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
        bindCardEditingEvents();
        syncCardsToEditor();
    }

    // Bind Card Editing Events
    function bindCardEditingEvents() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;

        cardContainer.removeEventListener('input', handleCardInput);
        cardContainer.removeEventListener('blur', handleCardBlur, true);

        cardContainer.addEventListener('input', handleCardInput);
        cardContainer.addEventListener('blur', handleCardBlur, true);

        function handleCardInput(e) {
            if (e.target.classList.contains('card-scene-title') || e.target.classList.contains('card-description') || e.target.classList.contains('card-scene-number')) {
                clearTimeout(handleCardInput.timeout);
                handleCardInput.timeout = setTimeout(() => {
                    syncCardsToEditor();
                }, 500);
            }
        }

        function handleCardBlur(e) {
            if (e.target.classList.contains('card-scene-title') || e.target.classList.contains('card-description') || e.target.classList.contains('card-scene-number')) {
                syncCardsToEditor();
            }
        }
    }

    // Action Button Handler
    function handleActionBtn(e) {
        if (!fountainInput) return;

        const action = e.currentTarget.dataset.action;
        const { selectionStart, selectionEnd, value } = fountainInput;
        console.log(`Action button clicked: ${action}`);
        clearPlaceholder();

        switch (action) {
            case 'caps':
                const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
                const lineEnd = value.indexOf('\n', selectionStart);
                const currentLine = value.substring(lineStart, lineEnd !== -1 ? lineEnd : value.length);
                const newText = currentLine === currentLine.toUpperCase() ? currentLine.toLowerCase() : currentLine.toUpperCase();
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
            fountainInput.focus();
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

    // Update Scene Navigator
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

        if (typeof Sortable !== 'undefined') {
            new Sortable(sceneList, {
                animation: 200,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'dragging'
            });
        }
    }

    // Jump to Scene
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

        sceneNavigatorPanel.classList.remove('open');
    }

    // Toggle Scene Numbers
    function toggleSceneNumbers() {
        showSceneNumbers = !showSceneNumbers;
        updateSceneNoIndicator();
        saveProjectData();
        if (currentView === 'script') renderEnhancedScript();
        updateSceneNavigator();
    }

    // Toggle Auto Save
    function toggleAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
            alert('Auto-save disabled');
        } else {
            autoSaveInterval = setInterval(saveProjectData, 120000);
            alert('Auto-save enabled every 2 minutes');
        }
        updateAutoSaveIndicator();
    }

    // Zoom In
    function handleZoomIn() {
        fontSize = Math.min(32, fontSize + 2);
        fountainInput.style.fontSize = `${fontSize}px`;
    }

    // Zoom Out
    function handleZoomOut() {
        fontSize = Math.max(10, fontSize - 2);
        fountainInput.style.fontSize = `${fontSize}px`;
    }

    // Download Blob
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
        const text = fountainInput.value;
        const blob = new Blob([text], { type: 'text/plain' });
        downloadBlob(blob, `${projectData.projectInfo.projectName}.fountain`);
    }

    // Save as PDF English
    function saveAsPdfEnglish() {
        console.log('📄 Generating selectable PDF...');
        
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

            // Standard screenplay formatting
            const leftMargin = 1.5;
            const rightMargin = 1.0;
            const topMargin = 1.0;
            const bottomMargin = 1.0;
            const pageHeight = 11.0;
            const lineHeight = 1/6;

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

            const checkPageBreak = (linesCount = 1) => {
                if (y + (linesCount * lineHeight) > pageHeight - bottomMargin) {
                    doc.addPage();
                    y = topMargin;
                }
            };

            doc.setFont('Courier', 'normal');
            doc.setFontSize(12);

            tokens.forEach(token => {
                if (!token.type || !token.text || token.type === 'empty') {
                    if (token.type === 'empty') y += lineHeight;
                    return;
                }

                const textLines = doc.splitTextToSize(token.text, widths[token.type] || 6.0);
                
                if (['sceneheading', 'character', 'transition'].includes(token.type)) {
                    checkPageBreak(1);
                }
                checkPageBreak(textLines.length);

                doc.setFont('Courier', 
                    (token.type === 'sceneheading' || token.type === 'transition') ? 'bold' : 'normal'
                );

                if (token.type === 'transition') {
                    doc.text(token.text, 8.5 - rightMargin, y, { align: 'right' });
                } else {
                    const x = leftMargin + (indents[token.type] || 0);
                    doc.text(textLines, x, y);
                }

                y += textLines.length * lineHeight;
            });

            const filename = `${projectData.projectInfo.projectName}_screenplay.pdf`;
            doc.save(filename);
            
            alert('✅ PDF exported successfully!');
            console.log('✅ Selectable Text PDF exported');

        } catch (error) {
            console.error('PDF Export Error:', error);
            alert('❌ Failed to generate PDF. Check console for details.');
        }
    }

    // Save as PDF Unicode
    async function saveAsPdfUnicode() {
        console.log('🖼️ Generating Unicode PDF...');
        
        if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
            alert('Required libraries not loaded. Please check your internet connection.');
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
            await document.fonts.ready;
            
            const canvas = await html2canvas(sourceElement, {
                scale: 3,
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

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeightInPdf;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
                heightLeft -= pdfHeight;
            }

            const filename = `${projectData.projectInfo.projectName}_unicode.pdf`;
            pdf.save(filename);
            
            alert('✅ Unicode PDF exported successfully!');
            console.log('✅ Unicode Image PDF exported');

        } catch (error) {
            console.error('Unicode PDF Export Error:', error);
            alert('❌ Failed to generate Unicode PDF. Check console for details.');
        }
    }

    // Event Listeners Setup
    function setupEventListeners() {
        console.log('Setting up ALL event listeners...');

        // Make jumpToScene globally available
        window.jumpToScene = jumpToScene;

        if (fountainInput) {
            fountainInput.addEventListener('input', () => {
                clearPlaceholder(); // Ensure placeholder doesn't interfere
                history.add(fountainInput.value);
                saveProjectData();

                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    // Only update scenes, don't overwrite the text
                    projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
                    if (currentView === 'card') {
                        renderEnhancedCardView();
                    }
                    console.log('Updated scenes from text input - no overwrite');
                }, 500);
            });
        }

        if (fileInput) fileInput.addEventListener('change', openFountainFile);

        const viewButtons = [
            { id: 'show-script-btn', view: 'script' },
            { id: 'show-write-btn-header', view: 'write' },
            { id: 'show-write-btn-card-header', view: 'write' },
            { id: 'card-view-btn', view: 'card' }
        ];

        viewButtons.forEach(({ id, view }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    console.log(`View button clicked: ${id} -> ${view}`);
                    switchView(view);
                });
            }
        });

        ['hamburger-btn', 'hamburger-btn-script', 'hamburger-btn-card'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    console.log(`Hamburger clicked: ${id}`);
                    if (menuPanel) menuPanel.classList.toggle('open');
                });
            }
        });

        ['scene-navigator-btn', 'scene-navigator-btn-script'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    console.log(`Scene navigator clicked: ${id}`);
                    updateSceneNavigator();
                    if (sceneNavigatorPanel) sceneNavigatorPanel.classList.toggle('open');
                });
            }
        });

        document.addEventListener('click', e => {
            if (menuPanel && menuPanel.classList.contains('open') && !menuPanel.contains(e.target) && !e.target.closest('[id^="hamburger-btn"]')) {
                menuPanel.classList.remove('open');
            }
            if (sceneNavigatorPanel && sceneNavigatorPanel.classList.contains('open') && !sceneNavigatorPanel.contains(e.target) && !e.target.closest('[id^="scene-navigator-btn"]')) {
                sceneNavigatorPanel.classList.remove('open');
            }
            if (e.target.closest('.share-card-btn')) {
                const btn = e.target.closest('.share-card-btn');
                const sceneId = btn.dataset.sceneId;
                shareSceneCard(sceneId);
            }
            if (e.target.closest('.delete-card-btn')) {
                const btn = e.target.closest('.delete-card-btn');
                const sceneId = parseInt(btn.dataset.sceneId);
                if (confirm('Delete this scene?')) {
                    projectData.projectInfo.scenes = projectData.projectInfo.scenes.filter(s => s.number !== sceneId);
                    renderEnhancedCardView();
                    syncCardsToEditor();
                    saveProjectData();
                }
            }
        });

        const addCardBtn = document.getElementById('add-new-card-btn');
        if (addCardBtn) addCardBtn.addEventListener('click', addNewSceneCard);

        const saveAllBtn = document.getElementById('save-all-cards-btn');
        if (saveAllBtn) saveAllBtn.addEventListener('click', saveAllCardsAsImages);

        document.querySelectorAll('.action-btn, .keyboard-btn').forEach(btn => {
            btn.addEventListener('click', handleActionBtn);
        });

        // Menu handlers
        const menuHandlers = {
            'new-btn': () => {
                if (confirm('Are you sure? Unsaved changes will be lost.')) {
                    fountainInput.value = '';
                    projectData = {
                        projectInfo: {
                            projectName: 'Untitled',
                            prodName: 'Author',
                            scriptContent: '',
                            scenes: []
                        }
                    };
                    history.stack = [];
                    history.currentIndex = 0;
                    history.updateButtons();
                    saveProjectData();
                    setPlaceholder();
                }
            },
            'open-btn': () => fileInput.click(),
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
                            scriptContent: '',
                            scenes: []
                        }
                    };
                    history.stack = [];
                    history.currentIndex = 0;
                    saveProjectData();
                    setPlaceholder();
                    if (currentView === 'script') renderEnhancedScript();
                    if (currentView === 'card') renderEnhancedCardView();
                }
            }
        };

        for (const [id, handler] in Object.entries(menuHandlers)) {
            const element = document.getElementById(id);
            if (element) element.addEventListener('click', handler);
        }

        // Undo/Redo buttons
        document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top').forEach(btn => btn.addEventListener('click', () => history.undo()));
        document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top').forEach(btn => btn.addEventListener('click', () => history.redo()));

        // Filter change
        if (filterCategorySelect) filterCategorySelect.addEventListener('change', handleFilterChange);

        // Filter input
        if (filterValueInput) filterValueInput.addEventListener('input', () => {
            clearTimeout(filterValueInput.timeout);
            filterValueInput.timeout = setTimeout(applyFilter, 300);
        });

        // Close navigator
        const closeNavigatorBtn = document.getElementById('close-navigator-btn');
        if (closeNavigatorBtn) closeNavigatorBtn.addEventListener('click', () => sceneNavigatorPanel.classList.remove('open'));
    }

    // Initialize
    function initialize() {
        setupEventListeners();
        setupKeyboardDetection();
        loadProjectData();
        fountainInput.style.fontSize = `${fontSize}px`;
        setTimeout(() => {
            if (currentView === 'write') fountainInput.focus();
        }, 500);
        history.add(fountainInput.value);
        history.updateButtons();
    }

    initialize();
});
