document.addEventListener('DOMContentLoaded', () => {

    // --- State Variables ---
    let fontSize = 16;
    let history = [];
    let historyIndex = -1;
    let autoSaveInterval = null;
    let isAutoSaveOn = false;
    let footerTimeout;
    var customAiVariations = [];

    // --- DOM Element References ---
    const fountainInput = document.getElementById('fountain-input');
    const screenplayOutput = document.getElementById('screenplay-output');
    const newBtn = document.getElementById('new-btn');
    const openBtn = document.getElementById('open-btn');
    const fileInput = document.getElementById('file-input');
    const saveMenuBtn = document.getElementById('save-menu-btn');
    const saveMenu = document.getElementById('save-menu');
    const saveFountainBtn = document.getElementById('save-fountain-btn');
    const saveFdxBtn = document.getElementById('save-fdx-btn');
    const savePdfBtn = document.getElementById('save-pdf-btn');
    const shareBtn = document.getElementById('share-btn');
    const undoBtnSide = document.getElementById('undo-btn-side');
    const redoBtnSide = document.getElementById('redo-btn-side');
    const infoBtn = document.getElementById('info-btn');
    const infoModal = document.getElementById('info-modal');
    const closeModalBtn = document.getElementById('close-info-modal-btn');
    const writeView = document.getElementById('write-view');
    const scriptView = document.getElementById('script-view');
    const showScriptBtn = document.getElementById('show-script-btn');
    const showWriteBtn = document.getElementById('show-write-btn');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const menuPanel = document.getElementById('menu-panel');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const titlePageBtn = document.getElementById('title-page-btn');
    const titlePageModal = document.getElementById('title-page-modal');
    const closeTitleModalBtn = document.getElementById('close-title-modal-btn');
    const saveTitleBtn = document.getElementById('save-title-btn');
    const titleInput = document.getElementById('title-input');
    const authorInput = document.getElementById('author-input');
    const sceneNoBtn = document.getElementById('scene-no-btn');
    const sceneNoIndicator = document.getElementById('scene-no-indicator');
    const sceneNavigatorBtn = document.getElementById('scene-navigator-btn');
    const sceneNavigatorPanel = document.getElementById('scene-navigator-panel');
    const closeNavigatorBtn = document.getElementById('close-navigator-btn');
    const sceneList = document.getElementById('scene-list');
    const autoSaveBtn = document.getElementById('auto-save-btn');
    const autoSaveIndicator = document.getElementById('auto-save-indicator');
    const mobileToolbar = document.getElementById('mobile-bottom-toolbar');
    const fullscreenBtnInlineEditor = document.getElementById('fullscreen-btn-inline-editor');
    const goProBtn = document.getElementById('go-pro-btn');

    // --- Global State ---
    let scriptTitle = "Untitled";
    let scriptAuthor = "Your Name";
    let showSceneNumbers = true;
    let autoSaveIntervalId = null;

    // --- Universal Project Data Structure (for .filmproj compatibility with To Make) ---
    let projectData = {
        fileVersion: "1.0",
        projectInfo: {
            projectName: "Untitled Project",
            directorName: "",
            prodName: "",
            currency: "USD"
        },
        scenes: [],
        appSpecificData: {
            toScript: {
                fullScript: ""
            },
            toMake: { panelItems: [], activeItemId: null },
            toSched: { panelItems: [], activeItemId: null }
        }
    };

    // --- Placeholder Logic ---
    const placeholderText = `Sample Format...\n\nINT. ROOM – DAY\nFingers race across a glowing phone screen.\nSANTHOSH\n(focused)\nKeep going, this is worth it.\nFADE OUT:\n\nType screenplay here & click SCRIPT button to format it...`;

    function setPlaceholder() {
        if (fountainInput.value === '') {
            fountainInput.value = placeholderText;
            fountainInput.classList.add('text-gray-500', 'italic');
        }
    }

    function clearPlaceholder() {
        if (fountainInput.value === placeholderText) {
            fountainInput.value = '';
            fountainInput.classList.remove('text-gray-500', 'italic');
        }
    }

    fountainInput.addEventListener('focus', clearPlaceholder);
    fountainInput.addEventListener('blur', setPlaceholder);

    // --- Undo/Redo Manager ---
    const historyManager = {
        stack: [""],
        currentIndex: 0,
        add(value) {
            if (value === placeholderText || value === this.stack[this.currentIndex]) return;
            this.stack = this.stack.slice(0, this.currentIndex + 1);
            this.stack.push(value);
            this.currentIndex++;
            this.updateButtons();
        },
        undo() { if (this.canUndo()) { this.currentIndex--; this.updateInput(); } },
        redo() { if (this.canRedo()) { this.currentIndex++; this.updateInput(); } },
        canUndo: () => this.currentIndex > 0,
        canRedo: () => this.currentIndex < this.stack.length - 1,
        updateInput() {
            fountainInput.value = this.stack[this.currentIndex] || '';
            if(fountainInput.value === ''){
                setPlaceholder();
            } else {
                clearPlaceholder();
            }
            this.updateButtons();
        },
        updateButtons() {
            undoBtnSide.disabled = !this.canUndo();
            redoBtnSide.disabled = !this.canRedo();
        }
    };

    // --- Fountain Parser for .filmproj Export ---
    function parseFountainToScenes(input) {
        if (input === placeholderText) return [];
        const lines = input.split('\n');
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;
        let inDialogue = false;
        let currentCharacter = null;
        let castSet = new Set();

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Scene Heading: INT./EXT. LOCATION - TIME
            if (/^(INT\.|EXT\.|I\/E\.|INT\/EXT\.)/i.test(line)) {
                if (currentScene) {
                    currentScene.breakdownData.cast = Array.from(castSet).map(name => ({ id: Date.now() + Math.random(), name, cost: 0 }));
                    scenes.push(currentScene);
                    castSet.clear();
                }
                sceneNumber++;
                const parts = line.split(/ - /);
                const setting = parts[0].replace(/^(INT\.|EXT\.|I\/E\.|INT\/EXT\.)/i, '').trim();
                const dayNight = parts[1] ? parts[1].toUpperCase() : 'DAY';
                currentScene = {
                    sceneId: `s_${Date.now() + Math.random()}`,
                    sceneNumber: sceneNumber.toString(),
                    sceneSetting: setting,
                    dayNight: dayNight,
                    description: '',
                    breakdownData: { cast: [] },
                    budgetingData: {},
                    schedulingData: {}
                };
                inDialogue = false;
                continue;
            }

            // Character (for cast)
            if (currentScene && /^[A-Z0-9 ]+$/.test(line) && !inDialogue) {
                currentCharacter = line;
                castSet.add(currentCharacter);
                inDialogue = true;
                continue;
            }

            // Dialogue
            if (inDialogue && currentScene) {
                currentScene.description += line + '\n';
                inDialogue = false;
                continue;
            }

            // Action/Description
            if (currentScene) {
                currentScene.description += line + '\n';
            }
        }

        // Push the last scene
        if (currentScene) {
            currentScene.breakdownData.cast = Array.from(castSet).map(name => ({ id: Date.now() + Math.random(), name, cost: 0 }));
            scenes.push(currentScene);
        }

        return scenes;
    }

    // --- Save as .filmproj (New Function) ---
    function saveProjectFile() {
        // Update project info
        projectData.projectInfo.projectName = scriptTitle || "Untitled Project";
        projectData.projectInfo.directorName = scriptAuthor || "Your Name";

        // Parse scenes from Fountain input
        projectData.scenes = parseFountainToScenes(fountainInput.value);

        // Store full script for To Script
        projectData.appSpecificData.toScript.fullScript = fountainInput.value;

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.projectInfo.projectName}.filmproj`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // --- Core Editor & UI Functions ---

    function handleSave() {
        const choice = prompt('Save as:\n1. TXT\n2. Fountain\n3. PNG Image\n4. PDF (via Print)\n5. .filmproj');
        if (!choice) return;
        const text = fountainInput.innerText;  // Adjusted to match possible editor reference
        let data, fileName, mimeType;
        switch (choice) {
            case '1': data = text; fileName = `document-${Date.now()}.txt`; mimeType = 'text/plain'; break;
            case '2': data = text; fileName = `screenplay-${Date.now()}.fountain`; mimeType = 'text/plain'; break;
            case '3':
                const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'), lines = text.split('\n');
                const lineHeight = 20, padding = 20;
                canvas.width = 800; canvas.height = (lines.length * lineHeight) + (padding * 2);
                ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#333' : 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.font = '12pt Courier New';
                ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#ddd' : 'black';
                lines.forEach((line, i) => ctx.fillText(line, padding, (i * lineHeight) + padding + 15));
                data = canvas.toDataURL('image/png'); fileName = `image-${Date.now()}.png`; mimeType = 'image/png';
                break;
            case '4':
                try {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`<html><head><title>Print</title><style>body{font-family:"Courier New",monospace;white-space:pre-wrap;}</style></head><body>${text.replace(/\n/g, '<br>')}</body></html>`);
                    printWindow.document.close(); printWindow.focus(); printWindow.print();
                } catch (e) { alert("Could not open print dialog. Check popup blocker settings."); }
                return;
            case '5':
                saveProjectFile();
                return;
            default: alert('Invalid choice.'); return;
        }
        if (window.Android && typeof window.Android.saveFile === 'function') {
            window.Android.saveFile(data, fileName, mimeType);
        } else {
            const a = document.createElement('a');
            a.href = (mimeType.startsWith('image')) ? data : URL.createObjectURL(new Blob([data], { type: mimeType }));
            a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
    }

    function updateStats() {
        // Assuming statsDiv exists; adjust if needed
        const statsDiv = document.getElementById('stats-div');  // Placeholder; add if missing
        if (!fountainInput || !statsDiv) return;
        const text = fountainInput.value;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const chars = text.length;
        statsDiv.innerText = `Words: ${words} | Characters: ${chars}`;
    }

    function saveToHistory() {
        const text = fountainInput.value;
        if (history.length > 20) { history.shift(); }
        if (historyIndex < history.length - 1) { history = history.slice(0, historyIndex + 1); }
        history.push(text); historyIndex = history.length - 1;
    }

    function undo() {
        if (historyIndex > 0) { historyIndex--; fountainInput.value = history[historyIndex]; updateStats(); }
    }

    function redo() {
        if (historyIndex < history.length - 1) { historyIndex++; fountainInput.value = history[historyIndex]; updateStats(); }
    }

    function clearText() { fountainInput.value = ''; saveToHistory(); updateStats(); }
    function toggleMobileSliderMenu() { const mobileSliderMenu = document.getElementById('mobile-slider-menu'); if (mobileSliderMenu) mobileSliderMenu.classList.toggle('show'); }

    // --- START: MODIFIED openSidebar FUNCTION ---
    function openSidebar() {
        document.body.classList.add('sidebar-visible');
        // Automatically close the mobile hamburger menu if it's open
        const mobileSliderMenu = document.getElementById('mobile-slider-menu');
        if (mobileSliderMenu && mobileSliderMenu.classList.contains('show')) {
            mobileSliderMenu.classList.remove('show');
        }
    }
    // --- END: MODIFIED openSidebar FUNCTION ---

    function closeSidebar() { document.body.classList.remove('sidebar-visible'); }

    function getContextText() {
        const selection = window.getSelection();
        return (selection && selection.toString().trim()) ? selection.toString().trim() : fountainInput.value.trim();
    }

    function toggleDarkMode() { document.body.classList.toggle('dark-mode'); }
    function increaseFont() { fontSize += 2; fountainInput.style.fontSize = `${fontSize}px`; }
    function decreaseFont() { if (fontSize > 10) { fontSize -= 2; fountainInput.style.fontSize = `${fontSize}px`; }}
    function toggleFocusMode() { document.body.classList.toggle('focus-mode'); }

    function searchReplace() {
        const search = prompt('Enter text to search:');
        if (!search) return;
        const replace = prompt('Enter replacement text:');
        fountainInput.value = fountainInput.value.replace(new RegExp(search, 'g'), replace);
        saveToHistory(); updateStats();
    }

    function toggleFullScreen() {
        if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => console.error(err)); }
        else { document.exitFullscreen(); }
    }

    function toggleAutoSave() {
        isAutoSaveOn = !isAutoSaveOn;
        if (isAutoSaveOn) {
            autoSaveInterval = setInterval(() => { localStorage.setItem('savedText', fountainInput.value); }, 120000);
            alert('Auto-save enabled (every 2 minutes).');
        } else { clearInterval(autoSaveInterval); alert('Auto-save disabled.'); }
    }

    // --- AI Functions ---

    function showApiInstructions() { alert('To get a Gemini API key:\n1. Visit https://aistudio.google.com/app/apikey\n2. Generate an API key.\n3. Use the "API Key" button to save it.'); }
    function setApiKey() {
        const apiKey = prompt('Enter your Gemini API Key:');
        if (apiKey) { localStorage.setItem('geminiApiKey', apiKey); localStorage.setItem('useLocalAi', 'false'); alert('API Key saved!'); }
    }
    function setLocalApiUrl() {
        const apiUrl = prompt('Enter your Local AI Server URL:');
        if (apiUrl) { localStorage.setItem('localApiUrl', apiUrl); localStorage.setItem('useLocalAi', 'true'); alert('Local AI URL saved!'); }
    }

    async function callAiModel(promptText) {
        const suggestionDiv = document.getElementById('suggestion-div');  // Assuming this exists; add if needed
        if (suggestionDiv) suggestionDiv.innerHTML = '<div style="text-align:center; padding: 20px;">Loading...</div>';
        try {
            const useLocal = localStorage.getItem('useLocalAi') === 'true';
            if (useLocal) {
                const baseUrl = localStorage.getItem('localApiUrl');
                if (!baseUrl) throw new Error('Local AI Server URL is not set.');
                const response = await fetch(`${baseUrl}/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: "local-model", messages: [{ role: "user", content: promptText }], temperature: 0.7 }) });
                if (!response.ok) throw new Error(await response.text());
                const data = await response.json(); return data.choices[0].message.content.trim();
            } else {
                const apiKey = localStorage.getItem('geminiApiKey');
                if (!apiKey) throw new Error('Gemini API Key is not set.');
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }) });
                if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error.message); }
                const data = await response.json(); return data.candidates[0].content.parts[0].text.trim();
            }
        } catch (error) { if (suggestionDiv) suggestionDiv.innerHTML = `<strong>Error:</strong> ${error.message}<br><button class="sidebar-close-btn">Close</button>`; return null; }
    }

    async function getAiSuggestion() {
        openSidebar();
        const context = getContextText();
        if (!context) { alert('Editor is empty.'); closeSidebar(); return; }
        const fullSuggestion = await callAiModel(`Suggest 5 diverse options to continue the following text. Format as a simple numbered list:\n\n"${context}"`);
        if (!fullSuggestion) return;
        const suggestions = fullSuggestion.split('\n').map(l => l.replace(/^(\d+\.|-|\*)\s*/, '').trim()).filter(Boolean);
        const suggestionDiv = document.getElementById('suggestion-div');  // Assuming this exists
        if (suggestions.length === 0) { if (suggestionDiv) suggestionDiv.innerHTML = '<strong>Error:</strong> Could not parse AI response.<br><button class="sidebar-close-btn">Close</button>'; return; }
        let html = '<button class="sidebar-close-btn sidebar-close-btn-top">&times;</button><strong>AI Suggestions:</strong>';
        suggestions.forEach((text, i) => { html += `<div class="option"><strong>Option ${i + 1}:</strong> ${text}<br><button class="insert-suggestion-btn" data-suggestion="${text.replace(/"/g, '&quot;')}">Insert</button></div>`; });
        html += '<button class="sidebar-close-btn">Close</button>';
        if (suggestionDiv) suggestionDiv.innerHTML = html;
    }

    async function getAiProofread() {
        openSidebar();
        const textToProofread = getContextText();
        if (!textToProofread) { alert('Editor is empty.'); closeSidebar(); return; }
        const correctedText = await callAiModel(`Proofread and correct this text. Return only the corrected version:\n\n"${textToProofread}"`);
        if (!correctedText) return;
        const suggestionDiv = document.getElementById('suggestion-div');
        if (suggestionDiv) suggestionDiv.innerHTML = `<button class="sidebar-close-btn sidebar-close-btn-top">&times;</button><strong>Proofread Version:</strong><div style="white-space: pre-wrap; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 4px;">${correctedText}</div><br><button class="insert-proofread-btn" data-text="${correctedText.replace(/"/g, '&quot;')}">Replace</button> <button class="sidebar-close-btn">Close</button>`;
    }

    async function getAiCustom() {
        const customInstruction = prompt("Enter your custom instruction (e.g., 'make this more professional'):");
        if (!customInstruction) return;
        openSidebar();
        const context = getContextText();
        if (!context) { alert('Editor is empty.'); closeSidebar(); return; }
        const fullResponse = await callAiModel(`Instruction: "${customInstruction}".\n\nProvide 3 distinct variations for the following text. Separate each variation with "---" on a new line.\n\nText: "${context}"`);
        if (!fullResponse) return;
        customAiVariations = fullResponse.split(/\n---\n/).filter(v => v.trim());
        const suggestionDiv = document.getElementById('suggestion-div');
        if (customAiVariations.length === 0) { if (suggestionDiv) suggestionDiv.innerHTML = '<strong>Error:</strong> Could not parse AI response.<br><button class="sidebar-close-btn">Close</button>'; return; }
        let html = `<button class="sidebar-close-btn sidebar-close-btn-top">&times;</button><strong>Custom Suggestions:</strong><small>Instruction: "${customInstruction}"</small>`;
        customAiVariations.forEach((text, i) => { html += `<div class="option"><strong>Option ${i + 1}:</strong><div style="white-space: pre-wrap;">${text}</div><br><button class="insert-custom-btn" data-index="${i}">Insert</button></div>`; });
        html += '<button class="sidebar-close-btn">Close</button>';
        if (suggestionDiv) suggestionDiv.innerHTML = html;
    }

    function insertText(text) { fountainInput.focus(); document.execCommand('insertText', false, text); }

    function formatText(type) {
        let command = '', value = null;
        switch (type) {
            case 'bold': command = 'bold'; break; case 'italic': command = 'italic'; break; case 'heading1': command = 'formatBlock'; value = 'h1'; break;
            case 'heading2': command = 'formatBlock'; value = 'h2'; break; case 'numberedList': command = 'insertOrderedList'; break;
            case 'list': command = 'insertUnorderedList'; break; case 'quote': command = 'formatBlock'; value = 'blockquote'; break;
            case 'code': command = 'formatBlock'; value = 'pre'; break; case 'table': insertText('| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n'); return;
            case 'link': const url = prompt('Enter URL:'); if (url) document.execCommand('createLink', false, url); return;
            case 'image': const imgUrl = prompt('Enter image URL:'); if (imgUrl) document.execCommand('insertImage', false, imgUrl); return;
            case 'footnote': const note = prompt('Enter footnote text:'); if(note) insertText(`[^${note}]`); return;
        }
        if (command) document.execCommand(command, false, value);
    }

    // --- Event Listener Assignments ---
    const suggestionDiv = document.getElementById('suggestion-div');  // Assuming this exists
    if (suggestionDiv) {
        suggestionDiv.addEventListener('click', (event) => {
            if (event.target.classList.contains('sidebar-close-btn')) closeSidebar();
            if (event.target.classList.contains('insert-suggestion-btn')) insertText(event.target.dataset.suggestion);
            if (event.target.classList.contains('insert-proofread-btn')) insertText(event.target.dataset.text);
            if (event.target.classList.contains('insert-custom-btn')) {
                const index = parseInt(event.target.dataset.index, 10);
                if (customAiVariations[index]) insertText(customAiVariations[index]);
            }
        });
    }

    document.getElementById('mobile-ai-toggle')?.addEventListener('click', toggleMobileSliderMenu);
    const mobileSliderMenu = document.getElementById('mobile-slider-menu');
    if (mobileSliderMenu) {
        const menuActions = [showApiInstructions, setApiKey, setLocalApiUrl, getAiSuggestion, getAiProofread, getAiCustom];
        mobileSliderMenu.querySelectorAll('button').forEach((btn, index) => { if (menuActions[index]) btn.addEventListener('click', menuActions[index]); });
    }
    document.querySelectorAll('button').forEach(btn => {
        const title = btn.title || btn.textContent.trim();
        const actions = {
            'Save': handleSave, 'Clear': clearText, 'Increase Font Size': increaseFont, 'Decrease Font Size': decreaseFont,
            'Search and Replace': searchReplace, 'Toggle Focus Mode': toggleFocusMode, 'Undo': undo, 'Redo': redo,
            'Toggle Auto Save': toggleAutoSave, 'Gemini API Instructions': showApiInstructions, 'Set Gemini API Key': setApiKey,
            'Set Local AI URL': setLocalApiUrl, 'Get AI Suggestion': getAiSuggestion, 'Proofread': getAiProofread,
            'Custom AI Prompt': getAiCustom, 'Toggle Dark Mode': toggleDarkMode, 'Toggle Full Screen': toggleFullScreen,
            'Bold': () => formatText('bold'), 'Italic': () => formatText('italic'), 'Heading 1': () => formatText('heading1'),
            'Heading 2': () => formatText('heading2'), 'Insert Link': () => formatText('link'), 'Insert Image': () => formatText('image'),
            'Unordered List': () => formatText('list'), 'Numbered List': () => formatText('numberedList'), 'Blockquote': () => formatText('quote'),
            'Code': () => formatText('code'), 'Insert Table': () => formatText('table'), 'Insert Footnote': () => formatText('footnote')
        };
        if (actions[title]) btn.addEventListener('click', actions[title]);
    });

    document.addEventListener('fullscreenchange', () => document.body.classList.toggle('fullscreen', !!document.fullscreenElement));
    if (window.innerWidth > 768) {
        const footer = document.getElementById('footer');  // Assuming footer exists
        if (footer) footer.classList.add('visible');
        document.addEventListener('mousemove', (event) => { clearTimeout(footerTimeout); if (footer) footer.classList.toggle('hidden', event.clientY < window.innerHeight - 100); });
    }
    fountainInput.addEventListener('input', () => { saveToHistory(); updateStats(); });

    // Initial Setup
    saveToHistory();
    updateStats();
    setPlaceholder();
});
