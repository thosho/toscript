document.addEventListener('DOMContentLoaded', () => {
    console.log("🎬 ToscripT Professional - Full Version Restored & Fixed");

    // --- GLOBAL STATE ---
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
    let debounceTimeout = null;

    // --- DOM ELEMENT CACHE ---
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
    const fileInput = document.getElementById('file-input');
    const sceneList = document.getElementById('scene-list');
    const filterCategorySelect = document.getElementById('filter-category-select');
    const filterValueInput = document.getElementById('filter-value-input');
    const filterHelpText = document.getElementById('filter-help-text');

    const placeholderText = `TITLE: THE CRIMSON DOSSIER
AUTHOR: YOUR NAME

INT. DETECTIVE'S OFFICE - NIGHT

The office is dimly lit with case files scattered everywhere. DETECTIVE VIKRAM (40s, weary) sits behind a cluttered desk, staring at cold coffee.

MAYA
(whispering)
Are you the one they call the Ghost of Bangalore?

VIKRAM
(cautious)
That depends on who's asking.

FADE OUT.`;

    // --- HISTORY MANAGER ---
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
        undo() { if (this.currentIndex > 0) { this.currentIndex--; this.updateInput(); } },
        redo() { if (this.currentIndex < this.stack.length - 1) { this.currentIndex++; this.updateInput(); } },
        updateInput() {
            if (fountainInput) {
                fountainInput.value = this.stack[this.currentIndex] || '';
                setPlaceholder();
                this.updateButtons();
            }
        },
        updateButtons() {
            document.querySelectorAll('#undo-btn-top').forEach(btn => btn.disabled = this.currentIndex <= 0);
            document.querySelectorAll('#redo-btn-top').forEach(btn => btn.disabled = this.currentIndex >= this.stack.length - 1);
        }
    };
    
    // --- CORE APP & VIEW LOGIC ---

    function setPlaceholder() {
        if (fountainInput && fountainInput.value.trim() === '') {
            fountainInput.value = placeholderText;
            fountainInput.classList.add('placeholder');
        } else if (fountainInput) {
            fountainInput.classList.remove('placeholder');
        }
    }

    function clearPlaceholder() {
        if (fountainInput && fountainInput.classList.contains('placeholder')) {
            fountainInput.value = '';
            fountainInput.classList.remove('placeholder');
        }
    }

    function switchView(view) {
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
        }
    }

    // --- PARSING & RENDERING (Using Fountain.js library) ---

    function renderEnhancedScript() {
        if (!screenplayOutput || !fountainInput) return;
        if (typeof fountain === 'undefined') {
            screenplayOutput.innerHTML = `<div class="action" style="color: red; padding: 2rem;">Error: Fountain.js formatting library did not load. Please check your internet connection and refresh.</div>`;
            return;
        }
        try {
            const parsedOutput = fountain.parse(fountainInput.value);
            screenplayOutput.innerHTML = parsedOutput.html.script;
        } catch (e) {
            console.error("Fountain.js parsing error:", e);
            screenplayOutput.innerHTML = `<div class="action" style="color: red; padding: 2rem;">Error parsing script. Please check your syntax.</div>`;
        }
    }
    
    function extractScenesFromText(text) {
        if (typeof fountain === 'undefined' || !text) return [];
        try {
            const parsed = fountain.parse(text);
            const scenes = [];
            let currentScene = null;
            let sceneNumber = 0;

            parsed.tokens.forEach(token => {
                if (token.type === 'scene_heading') {
                    if (currentScene) scenes.push(currentScene);
                    sceneNumber++;
                    const parts = token.text.split(' - ');
                    currentScene = {
                        number: sceneNumber,
                        heading: token.text,
                        description: [],
                        location: parts[0] || '',
                        timeOfDay: parts[1] || 'DAY',
                        characters: new Set()
                    };
                } else if (currentScene) {
                    if (token.type === 'character') {
                        currentScene.characters.add(token.text);
                    }
                    if (['action', 'dialogue', 'parenthetical'].includes(token.type)) {
                         if (token.text.trim()) currentScene.description.push(token.text.trim());
                    }
                }
            });
            if (currentScene) scenes.push(currentScene);
            scenes.forEach(scene => scene.characters = Array.from(scene.characters));
            return scenes;
        } catch (e) {
            console.error("Error extracting scenes:", e);
            return [];
        }
    }
    
    // --- PDF & IMAGE EXPORT ---

    async function preloadResourcesForCanvas() {
        try {
            console.log("Preloading fonts for PDF generation...");
            await document.fonts.ready;
            console.log("Fonts preloaded successfully.");
        } catch (error) {
            console.error("Error preloading fonts:", error);
            alert("Could not preload fonts, PDF export may have issues.");
        }
    }
    
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
            await preloadResourcesForCanvas();
            const canvas = await html2canvas(sourceElement, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png', 0.97);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeightInPdf = imgProps.height * pdfWidth / imgProps.width;
            let heightLeft = imgHeightInPdf, position = 0;
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
            alert("An error occurred while creating the Unicode PDF.");
        }
    }

    function saveAsPdfEnglish() {
        if (typeof window.jspdf === 'undefined' || typeof window.fountain === 'undefined') {
            return alert('Required libraries are still loading. Please wait a moment and try again.');
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
        const leftMargin = 1.5, rightMargin = 1.0, topMargin = 1.0, bottomMargin = 1.0;
        const pageHeight = 11.0, pageWidth = 8.5, lineHeight = 1 / 6;
        const indents = { scene_heading: 0, action: 0, character: 2.2, parenthetical: 1.6, dialogue: 1.0 };
        const widths = { scene_heading: 6.0, action: 6.0, character: 2.8, parenthetical: 2.0, dialogue: 3.5 };

        const tokens = fountain.parse(fountainInput.value).tokens;
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
            if (!token.type || !token.text || ['page_break', 'section', 'synopsis', 'boneyard_begin', 'boneyard_end'].includes(token.type)) return;

            const textLines = doc.splitTextToSize(token.text.trim(), widths[token.type] || 6.0);
            if (['scene_heading', 'character', 'transition'].includes(token.type)) {
                checkPageBreak();
                y += lineHeight;
            }
            checkPageBreak(textLines.length);
            doc.setFont('Courier', token.type === 'scene_heading' ? 'bold' : 'normal');

            if (token.type === 'transition') {
                doc.text(token.text.trim(), pageWidth - rightMargin, y, { align: 'right' });
            } else {
                const x = leftMargin + (indents[token.type] || 0);
                doc.text(textLines, x, y);
            }
            y += textLines.length * lineHeight;
        });
        
        doc.save(`${projectData.projectInfo.projectName || 'screenplay'}_english.pdf`);
    }

    // --- ALL ORIGINAL FUNCTIONS ---
    
    function saveProjectData() {
        if (fountainInput) {
            projectData.projectInfo.scriptContent = fountainInput.value;
        }
        localStorage.setItem('universalFilmProject_ToScript', JSON.stringify(projectData));
    }

    function loadProjectData() {
        const savedData = localStorage.getItem('universalFilmProject_ToScript');
        if (savedData) {
            try { projectData = JSON.parse(savedData); } catch (e) {}
        }
        if (fountainInput && projectData.projectInfo.scriptContent) {
            fountainInput.value = projectData.projectInfo.scriptContent;
        }
        updateSceneNoIndicator();
        updateAutoSaveIndicator();
    }
    
    function openFountainFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            fountainInput.value = e.target.result;
            clearPlaceholder();
            history.add(fountainInput.value);
            saveProjectData();
            switchView('write');
        };
        reader.readAsText(file);
    }

    function handleZoomIn() {
        fontSize = Math.min(32, fontSize + 2);
        if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`;
    }

    function handleZoomOut() {
        fontSize = Math.max(10, fontSize - 2);
        if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`;
    }

    function renderEnhancedCardView() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;
        const scenes = projectData.projectInfo.scenes;
        if (!scenes || scenes.length === 0) {
            cardContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--muted-text-color);"><i class="fas fa-film" style="font-size: 4rem; margin-bottom: 2rem; opacity: 0.3;"></i><h3>No scenes found</h3><p>Write some scenes in the editor to see them here.</p></div>`;
            return;
        }
        cardContainer.innerHTML = scenes.map(scene => `
            <div class="scene-card card-for-export" data-scene-id="${scene.number}" data-scene-number="${scene.number}">
                <div class="scene-card-content">
                    <div class="card-header">
                        <div class="card-scene-title" contenteditable="true" data-placeholder="Enter scene heading...">${scene.heading}</div>
                        <input class="card-scene-number" type="text" value="#${scene.number}" maxlength="4" />
                    </div>
                    <div class="card-body">
                        <textarea class="card-description" placeholder="Enter detailed scene description...">${scene.description.join('\n')}</textarea>
                    </div>
                    <div class="card-watermark">@TO SCRIPT</div>
                </div>
                <div class="card-actions">
                    <button class="icon-btn share-card-btn" title="Share Scene"><i class="fas fa-share-alt"></i></button>
                </div>
            </div>`).join('');
        bindCardEditingEvents();
    }

    function bindCardEditingEvents() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;
        cardContainer.removeEventListener('input', handleCardInput);
        cardContainer.removeEventListener('blur', handleCardBlur, true);
        cardContainer.addEventListener('input', handleCardInput);
        cardContainer.addEventListener('blur', handleCardBlur, true);
    }

    function handleCardInput(e) {
        if (e.target.matches('.card-scene-title, .card-description, .card-scene-number')) {
            clearTimeout(window.cardEditTimeout);
            window.cardEditTimeout = setTimeout(syncCardsToEditor, 500);
        }
    }

    function handleCardBlur(e) {
        if (e.target.matches('.card-scene-title, .card-description, .card-scene-number')) {
            syncCardsToEditor();
        }
    }

    function syncCardsToEditor() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer || !fountainInput) return;
        let scriptText = '';
        const cards = cardContainer.querySelectorAll('.scene-card');
        cards.forEach(card => {
            const title = card.querySelector('.card-scene-title')?.textContent.trim() || '';
            const description = card.querySelector('.card-description')?.value.trim() || '';
            if (title) { scriptText += `${title.toUpperCase()}\n\n`; }
            if (description) { scriptText += `${description}\n\n`; }
        });
        if (scriptText.trim() !== fountainInput.value.trim()) {
            fountainInput.value = scriptText.trim();
            history.add(fountainInput.value);
            saveProjectData();
        }
    }

    function addNewSceneCard() {
        if (!fountainInput) return;
        const newSceneText = `\n\nINT. NEW SCENE - DAY\n\nDescription for the new scene.\n`;
        fountainInput.value = (fountainInput.value.trim() + newSceneText).trim();
        history.add(fountainInput.value);
        saveProjectData();
        projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
        renderEnhancedCardView();
        const cardContainer = document.getElementById('card-container');
        if (cardContainer) {
            const lastCard = cardContainer.lastElementChild;
            if(lastCard) {
                lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                lastCard.querySelector('.card-scene-title')?.focus();
            }
        }
    }
    
    function hideMobileToolbar() { if (mobileToolbar) mobileToolbar.classList.remove('show'); }
    function showMobileToolbar() { if (mobileToolbar && window.innerWidth <= 768) { mobileToolbar.classList.add('show'); } }

    function updateSceneNoIndicator() {
        const indicator = document.getElementById('scene-no-indicator');
        if (indicator) indicator.classList.toggle('on', showSceneNumbers);
    }

    function updateAutoSaveIndicator() {
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) indicator.classList.toggle('on', !!autoSaveInterval);
    }

    function toggleSceneNumbers() {
        showSceneNumbers = !showSceneNumbers;
        updateSceneNoIndicator();
        renderEnhancedScript();
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

    function cycleText(textarea, options) {
        clearPlaceholder();
        const { value, selectionStart } = textarea;
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
            textarea.setRangeText(newLine, lineStart, lineEnd > -1 ? lineEnd : value.length);
        } else {
            textarea.setRangeText(nextOption, selectionStart, selectionStart);
        }
        textarea.focus();
        history.add(textarea.value);
    }

    function handleActionBtn(e) {
        const action = e.currentTarget.dataset.action;
        const sceneOptions = ['INT. ', 'EXT. ', 'INT./EXT. '];
        const timeOptions = [' - DAY', ' - NIGHT'];
        const transitionOptions = ['FADE IN:', 'FADE OUT.', 'CUT TO:'];
        
        switch(action) {
            case 'caps': 
                 const { selectionStart, selectionEnd, value } = fountainInput;
                 const targetText = value.substring(selectionStart, selectionEnd);
                 const newText = targetText === targetText.toUpperCase() ? targetText.toLowerCase() : targetText.toUpperCase();
                 fountainInput.setRangeText(newText, selectionStart, selectionEnd, 'select');
                 break;
            case 'parens':
                 fountainInput.setRangeText(`(${fountainInput.value.substring(fountainInput.selectionStart, fountainInput.selectionEnd)})`, fountainInput.selectionStart, fountainInput.selectionEnd, 'select');
                 break;
            case 'scene': cycleText(fountainInput, sceneOptions); break;
            case 'time': cycleText(fountainInput, timeOptions); break;
            case 'transition': cycleText(fountainInput, transitionOptions); break;
        }
        history.add(fountainInput.value);
    }

    // --- EVENT LISTENERS & INITIALIZATION ---

    function setupEventListeners() {
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('button[id], a[id]');
            if (!target) return;
            
            if (target.closest('.dropdown-content') || target.closest('.side-menu nav')) {
                const dropdown = document.querySelector('.dropdown-container.open');
                if(dropdown) dropdown.classList.remove('open');
                menuPanel.classList.remove('open');
            }

            const id = target.id;
            
            const actions = {
                'show-script-btn': () => switchView('script'),
                'show-write-btn-header': () => switchView('write'),
                'show-write-btn-card-header': () => switchView('write'),
                'card-view-btn': () => switchView('card'),
                'hamburger-btn': () => menuPanel.classList.toggle('open'),
                'hamburger-btn-script': () => menuPanel.classList.toggle('open'),
                'hamburger-btn-card': () => menuPanel.classList.toggle('open'),
                'scene-navigator-btn': () => { updateSceneNavigator(); sceneNavigatorPanel.classList.add('open'); },
                'scene-navigator-btn-script': () => { updateSceneNavigator(); sceneNavigatorPanel.classList.add('open'); },
                'close-navigator-btn': () => sceneNavigatorPanel.classList.remove('open'),
                'save-pdf-english-btn': saveAsPdfEnglish,
                'save-pdf-unicode-btn': saveAsPdfUnicode,
                'add-new-card-btn': addNewSceneCard,
                'undo-btn-top': () => history.undo(),
                'redo-btn-top': () => history.redo(),
                'zoom-in-btn': handleZoomIn,
                'zoom-out-btn': handleZoomOut,
                'open-btn': () => fileInput.click(),
                'new-btn': () => { if (confirm('Start new project? Unsaved changes will be lost.')) { fountainInput.value = ''; history.stack = [""]; history.currentIndex = 0; history.updateButtons(); saveProjectData(); setPlaceholder(); switchView('write'); } },
                'scene-no-btn': toggleSceneNumbers,
                'auto-save-btn': toggleAutoSave,
                'clear-project-btn': () => { if (confirm('This will clear the entire project. Are you sure?')) { fountainInput.value = ''; history.stack = [""]; history.currentIndex = 0; history.updateButtons(); saveProjectData(); setPlaceholder(); switchView('write'); } },
                'save-menu-btn': () => target.parentElement.classList.toggle('open')
            };

            if (actions[id]) {
                e.preventDefault();
                actions[id]();
            }
        });

        document.querySelectorAll('.action-btn, .keyboard-btn').forEach(btn => btn.addEventListener('click', handleActionBtn));
        fountainInput.addEventListener('focus', clearPlaceholder);
        fountainInput.addEventListener('blur', setPlaceholder);
        fountainInput.addEventListener('input', () => {
            history.add(fountainInput.value);
            saveProjectData();
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                if (currentView === 'card') {
                    projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
                    renderEnhancedCardView();
                }
            }, 500);
        });
        fileInput.addEventListener('change', openFountainFile);
    }

    function initialize() {
        loadProjectData();
        setPlaceholder();
        setupEventListeners();
        history.updateButtons();
        console.log('🚀 ToscripT Professional Initialized');
    }

    initialize();
});
