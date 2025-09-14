document.addEventListener('DOMContentLoaded', () => {
    console.log("ToscripT Initializing with Universal Project Logic...");

    // --- State Variables ---
    let fontSize = 16;
    let autoSaveInterval = null;
    let projectData = {}; // This will hold the universal project object
    let showSceneNumbers = true;
    let currentView = 'write'; // write, script, card

    // --- DOM Element References ---
    const fountainInput = document.getElementById('fountain-input');
    const screenplayOutput = document.getElementById('screenplay-output');
    const newBtn = document.getElementById('new-btn');
    const openBtn = document.getElementById('open-btn');
    const fileInput = document.getElementById('file-input');
    const saveMenuBtn = document.getElementById('save-menu-btn');
    const saveFountainBtn = document.getElementById('save-fountain-btn');
    const savePdfBtn = document.getElementById('save-pdf-btn');
    const saveFilmProjBtn = document.getElementById('save-filmproj-btn');
    const shareBtn = document.getElementById('share-btn');
    const infoBtn = document.getElementById('info-btn');
    const writeView = document.getElementById('write-view');
    const scriptView = document.getElementById('script-view');
    const cardView = document.getElementById('card-view');
    const showScriptBtn = document.getElementById('show-script-btn');
    const showWriteBtn = document.getElementById('show-write-btn');
    const showWriteBtnFromCard = document.getElementById('show-write-btn-from-card');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const menuPanel = document.getElementById('menu-panel');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const titlePageBtn = document.getElementById('title-page-btn');
    const sceneNoBtn = document.getElementById('scene-no-btn');
    const sceneNoIndicator = document.getElementById('scene-no-indicator');
    const sceneNavigatorBtn = document.getElementById('scene-navigator-btn');
    const sceneNavigatorPanel = document.getElementById('scene-navigator-panel');
    const closeNavigatorBtn = document.getElementById('close-navigator-btn');
    const sceneList = document.getElementById('scene-list');
    const autoSaveBtn = document.getElementById('auto-save-btn');
    const autoSaveIndicator = document.getElementById('auto-save-indicator');
    const fullscreenBtn = document.getElementById('fullscreen-btn-main');
    const cardViewBtn = document.getElementById('card-view-btn');
    const filterCategorySelect = document.getElementById('filter-category-select');
    const filterValueInput = document.getElementById('filter-value-input');

    const placeholderText = `TITLE: THE CRIMSON DOSSIER\nAUTHOR: YOUR NAME\n\nINT. DETECTIVE'S OFFICE - NIGHT\n\nThe office is a mess of old files. DETECTIVE VIKRAM (40s, tired) stares at a cold cup of coffee.\n\nA mysterious client, MAYA (30s, elegant), enters from the shadows.\n\nMAYA\n(softly)\nAre you the one they call the Ghost of Bangalore?\n\nVIKRAM\nThat depends on who's asking.\n\nFADE OUT.`;

    // --- Undo/Redo Manager ---
    const history = {
        stack: [""], currentIndex: 0,
        add(value) { if (value === placeholderText || value === this.stack[this.currentIndex]) return; this.stack = this.stack.slice(0, this.currentIndex + 1); this.stack.push(value); this.currentIndex++; this.updateButtons(); },
        undo() { if (this.canUndo()) { this.currentIndex--; this.updateInput(); } },
        redo() { if (this.canRedo()) { this.currentIndex++; this.updateInput(); } },
        canUndo() { return this.currentIndex > 0; },
        canRedo() { return this.currentIndex < this.stack.length - 1; },
        updateInput() { fountainInput.value = this.stack[this.currentIndex] || ''; if (fountainInput.value === '') setPlaceholder(); else clearPlaceholder(); this.updateButtons(); },
        updateButtons() { document.querySelectorAll('#undo-btn, #undo-btn-mobile').forEach(btn => btn.disabled = !this.canUndo()); document.querySelectorAll('#redo-btn, #redo-btn-mobile').forEach(btn => btn.disabled = !this.canRedo()); }
    };

    function setPlaceholder() { if (fountainInput.value === '') { fountainInput.value = placeholderText; fountainInput.classList.add('placeholder'); } }
    function clearPlaceholder() { if (fountainInput.value === placeholderText) { fountainInput.value = ''; fountainInput.classList.remove('placeholder'); } }

    function initialize() {
        loadProjectData();
        setupEventListeners();
        history.add(fountainInput.value);
        if (fountainInput.value === '') setPlaceholder();
    }

    function setupEventListeners() {
        fountainInput.addEventListener('focus', clearPlaceholder);
        fountainInput.addEventListener('blur', setPlaceholder);
        fountainInput.addEventListener('input', () => { history.add(fountainInput.value); saveProjectData(); });
        
        newBtn.addEventListener('click', () => { if (confirm('Are you sure? Unsaved changes will be lost.')) { fountainInput.value = ''; projectData = createNewProjectObject(); history.stack = [""]; history.currentIndex = 0; history.updateButtons(); saveProjectData(); setPlaceholder(); } });
        openBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', openFountainFile);
        saveMenuBtn.addEventListener('click', (e) => { e.preventDefault(); saveMenuBtn.parentElement.classList.toggle('open'); });
        saveFountainBtn.addEventListener('click', saveAsFountain);
        savePdfBtn.addEventListener('click', saveAsPdfWithUnicode);
        saveFilmProjBtn.addEventListener('click', saveAsFilmProj);
        shareBtn.addEventListener('click', shareScript);
        infoBtn.addEventListener('click', openInfoModal);
        titlePageBtn.addEventListener('click', openTitlePageModal);
        showScriptBtn.addEventListener('click', () => switchView('script'));
        showWriteBtn.addEventListener('click', () => switchView('write'));
        showWriteBtnFromCard.addEventListener('click', () => switchView('write'));
        cardViewBtn.addEventListener('click', () => switchView('card'));
        hamburgerBtn.addEventListener('click', () => menuPanel.classList.toggle('open'));
        document.addEventListener('click', (e) => { if (!menuPanel.contains(e.target) && e.target !== hamburgerBtn) { menuPanel.classList.remove('open'); } });
        zoomInBtn.addEventListener('click', () => { fontSize = Math.min(32, fontSize + 2); fountainInput.style.fontSize = `${fontSize}px`; });
        zoomOutBtn.addEventListener('click', () => { fontSize = Math.max(10, fontSize - 2); fountainInput.style.fontSize = `${fontSize}px`; });
        sceneNoBtn.addEventListener('click', toggleSceneNumbers);
        sceneNavigatorBtn.addEventListener('click', () => { updateSceneNavigator(); sceneNavigatorPanel.classList.add('open'); });
        closeNavigatorBtn.addEventListener('click', () => sceneNavigatorPanel.classList.remove('open'));
        autoSaveBtn.addEventListener('click', toggleAutoSave);
        document.querySelectorAll('.action-btn').forEach(btn => btn.addEventListener('click', handleActionBtn));
        document.querySelectorAll('#undo-btn, #undo-btn-mobile').forEach(btn => btn.addEventListener('click', () => history.undo()));
        document.querySelectorAll('#redo-btn, #redo-btn-mobile').forEach(btn => btn.addEventListener('click', () => history.redo()));
        fullscreenBtn.addEventListener('click', () => { document.body.classList.toggle('fullscreen-active'); if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { document.exitFullscreen(); } });
        filterCategorySelect.addEventListener('change', handleFilterChange);
        filterValueInput.addEventListener('input', applyFilter);

        // MODAL LISTENERS
        document.getElementById('project-info-btn').addEventListener('click', openProjectInfoModal);
        document.getElementById('about-btn').addEventListener('click', openAboutModal);
        document.body.addEventListener('click', (e) => { if (e.target.classList.contains('modal-close-btn') || e.target.classList.contains('modal')) e.target.closest('.modal').classList.remove('open'); });
    }

    // --- UNIVERSAL BINDER & FILE LOGIC ---
    function createNewProjectObject() { return { fileVersion: "1.0", projectInfo: { projectName: "Untitled", directorName: "", prodName: "Author", currency: "USD", scriptContent: "" }, scenes: [], appSpecificData: { toMake: { panelItems: [] }, toSched: { panelItems: [] } } }; }
    function saveProjectData() { if(projectData.projectInfo) projectData.projectInfo.scriptContent = fountainInput.value; localStorage.setItem('universalFilmProject', JSON.stringify(projectData)); }
    function loadProjectData() {
        const savedData = localStorage.getItem('universalFilmProject');
        projectData = savedData ? JSON.parse(savedData) : createNewProjectObject();
        fountainInput.value = projectData.projectInfo.scriptContent || '';
        updateSceneNoIndicator();
    }
    function openFountainFile(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { fountainInput.value = e.target.result; history.add(fountainInput.value); saveProjectData(); }; reader.readAsText(file); }
    function saveAsFountain() { const text = getFilteredScriptText(); const blob = new Blob([text], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${projectData.projectInfo.projectName}.fountain`; a.click(); URL.revokeObjectURL(url); }

    function saveAsFilmProj() {
        const universalProject = parseScriptToUniversalFormat(fountainInput.value, projectData.projectInfo);
        const dataStr = JSON.stringify(universalProject, null, 2);
        const blob = new Blob([dataStr], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${projectData.projectInfo.projectName}.filmproj`; a.click(); URL.revokeObjectURL(url);
        alert('.filmproj file saved! You can now open this in To Make or To Sched.');
    }
    
    function parseScriptToUniversalFormat(scriptText, projectInfo) {
        const output = fountain.parse(scriptText);
        const universalData = {
            fileVersion: "1.0", projectInfo: { ...projectInfo, scriptContent: scriptText }, scenes: [],
            appSpecificData: { toMake: { panelItems: [] }, toSched: { panelItems: [] } }
        };
        let currentScene = null;
        let sceneCounter = 0;
        output.tokens.forEach(token => {
            if (token.type === 'scene_heading') {
                if (currentScene) universalData.scenes.push(currentScene);
                sceneCounter++;
                const headingText = token.text.toUpperCase(); const headingParts = headingText.split(' - ');
                const typeAndSetting = headingParts[0].trim(); const time = (headingParts[1] || 'DAY').trim();
                let sceneType = "INT.";
                if (typeAndSetting.startsWith("EXT.")) sceneType = "EXT.";
                if (typeAndSetting.startsWith("INT./EXT.")) sceneType = "INT./EXT.";
                const sceneSetting = typeAndSetting.replace(/^(INT\.?\/EXT\.?|INT\.|EXT\.)\s*/, '').trim();
                currentScene = {
                    sceneId: `s_${Date.now()}_${sceneCounter}`, sceneNumber: token.scene_number || sceneCounter.toString(),
                    sceneType: sceneType, sceneSetting: sceneSetting, dayNight: time, description: "",
                    breakdownData: { cast: [] }, budgetingData: {}, schedulingData: {}
                };
            } else if (currentScene) {
                if (token.type === 'action') { currentScene.description += (currentScene.description ? "\n" : "") + token.text; } 
                else if (token.type === 'character') {
                    const characterName = token.text.replace(/\s*\(.*\)\s*$/, '').trim();
                    if (characterName && !currentScene.breakdownData.cast.some(c => c.name === characterName)) {
                        currentScene.breakdownData.cast.push({ id: Date.now() + Math.random(), name: characterName, cost: 0 });
                    }
                }
            }
        });
        if (currentScene) universalData.scenes.push(currentScene);
        const defaultSequence = { type: 'sequence', id: Date.now(), name: "Main Sequence", sceneIds: universalData.scenes.map(s => s.sceneId) };
        universalData.appSpecificData.toMake.panelItems.push(JSON.parse(JSON.stringify(defaultSequence)));
        universalData.appSpecificData.toSched.panelItems.push(JSON.parse(JSON.stringify(defaultSequence)));
        return universalData;
    }

    // --- VIEW MANAGEMENT ---
    function switchView(view) {
        currentView = view;
        [writeView, scriptView, cardView].forEach(v => v.classList.remove('active'));
        if (view === 'script') { renderScript(); scriptView.classList.add('active'); }
        else if (view === 'card') { renderCardView(); cardView.classList.add('active'); }
        else { writeView.classList.add('active'); }
    }

    function renderScript() {
        const text = getFilteredScriptText();
        const output = fountain.parse(text, true);
        const titleHtml = `<h1>${projectData.projectInfo.projectName || 'Untitled'}</h1><p class="author">by ${projectData.projectInfo.prodName || 'Author'}</p>`;
        let scriptHtml = output.html.body;
        if (showSceneNumbers) { let sceneCount = 0; scriptHtml = scriptHtml.replace(/<h3/g, () => { sceneCount++; return `<h3>${sceneCount}. `; }); }
        screenplayOutput.innerHTML = `<div class="title-page">${titleHtml}</div>${scriptHtml}`;
    }

    function renderCardView() {
        const container = document.getElementById('card-container');
        const scenes = parseScriptToUniversalFormat(fountainInput.value, projectData.projectInfo).scenes;
        if(scenes.length === 0) {
            container.innerHTML = `<p class="text-gray-500">No scenes found in the script to display as cards.</p>`;
            return;
        }
        container.innerHTML = scenes.map(scene => `
            <div class="scene-card" data-scene-id="${scene.sceneId}">
                <div class="card-header">#${scene.sceneNumber} ${scene.sceneType} ${scene.sceneSetting} - ${scene.dayNight}</div>
                <div class="card-body">${scene.description}</div>
                <div class="card-actions">
                    <button class="icon-btn edit-card-btn" title="Edit Scene"><i class="fas fa-pencil-alt"></i></button>
                    <button class="icon-btn share-card-btn" title="Share as Image"><i class="fas fa-share-alt"></i></button>
                </div>
            </div>
        `).join('');
        container.querySelectorAll('.edit-card-btn').forEach(btn => btn.addEventListener('click', (e) => editSceneFromCard(e.currentTarget.closest('.scene-card').dataset.sceneId)));
        container.querySelectorAll('.share-card-btn').forEach(btn => btn.addEventListener('click', (e) => shareSceneCardAsImage(e.currentTarget.closest('.scene-card').dataset.sceneId)));
    }

    // --- All other functions ---
    async function saveAsPdfWithUnicode() { const { jsPDF } = window.jspdf; const doc = new jsPDF(); try { const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/v27/o-0IIpQlx3QUlC5A4PNr5TRA.ttf'; const fontResponse = await fetch(fontUrl); if (!fontResponse.ok) throw new Error("Could not fetch font file."); const font = await fontResponse.arrayBuffer(); const fontBase64 = btoa(new Uint8Array(font).reduce((data, byte) => data + String.fromCharCode(byte), '')); doc.addFileToVFS('NotoSans-Regular.ttf', fontBase64); doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal'); doc.setFont('NotoSans'); } catch (e) { console.error("Font loading failed, falling back to default font.", e); } const output = fountain.parse(getFilteredScriptText(), true); screenplayOutput.innerHTML = `<div class="title-page"><h1>${projectData.projectInfo.projectName}</h1><p>${projectData.projectInfo.prodName}</p></div>${output.html.body}`; await doc.html(screenplayOutput, { callback: (doc) => { doc.save(`${projectData.projectInfo.projectName}.pdf`); }, x: 10, y: 10, width: 190, windowWidth: 800 }); }
    async function shareScript() { if (navigator.share) { try { await navigator.share({ title: projectData.projectInfo.projectName, text: fountainInput.value }); } catch(err) { console.error("Share failed", err); } } else { alert('Sharing is not supported on this browser.'); } }
    function saveTitlePage() { projectData.projectInfo.projectName = document.getElementById('title-input').value || "Untitled"; projectData.projectInfo.prodName = document.getElementById('author-input').value || "Author"; saveProjectData(); document.getElementById('title-page-modal').classList.remove('open'); }
    function toggleSceneNumbers() { showSceneNumbers = !showSceneNumbers; updateSceneNoIndicator(); saveProjectData(); if (scriptView.classList.contains('active')) { renderScript(); } }
    function updateSceneNoIndicator() { if (showSceneNumbers) { sceneNoIndicator.classList.add('on'); sceneNoIndicator.classList.remove('off'); } else { sceneNoIndicator.classList.add('off'); sceneNoIndicator.classList.remove('on'); } }
    function toggleAutoSave() { if (autoSaveInterval) { clearInterval(autoSaveInterval); autoSaveInterval = null; autoSaveIndicator.classList.add('off'); autoSaveIndicator.classList.remove('on'); alert('Auto-save disabled.'); } else { autoSaveInterval = setInterval(saveProjectData, 120000); autoSaveIndicator.classList.add('on'); autoSaveIndicator.classList.remove('off'); alert('Auto-save enabled (every 2 minutes).'); } }
    function updateSceneNavigator() { const output = fountain.parse(fountainInput.value); sceneList.innerHTML = output.tokens.filter(t => t.type === 'scene_heading').map((token) => `<li data-line="${token.line}">${token.text}</li>`).join(''); new Sortable(sceneList, { animation: 150, ghostClass: 'dragging', onEnd: (evt) => { /* Reordering logic can be enhanced here */ } }); }
    function handleActionBtn(e) { const action = e.currentTarget.dataset.action; const { selectionStart, selectionEnd, value } = fountainInput; const selectedText = value.substring(selectionStart, selectionEnd); let newText; switch(action) { case 'caps': const lineStart = value.lastIndexOf('\n', selectionStart -1) + 1; const currentLine = value.substring(lineStart, selectionStart); newText = (currentLine === currentLine.toUpperCase()) ? currentLine.toLowerCase() : currentLine.toUpperCase(); fountainInput.setRangeText(newText, lineStart, selectionStart); break; case 'parens': document.execCommand('insertText', false, `(${selectedText})`); break; case 'scene': cycleText(['INT. ', 'EXT. ', 'INT./EXT. ']); break; case 'time': cycleText([' - DAY', ' - NIGHT']); break; case 'transition': cycleText(['CUT TO:', 'FADE IN:', 'FADE OUT.', 'DISSOLVE TO:']); break; } history.add(fountainInput.value); }
    function cycleText(options) { document.execCommand('insertText', false, options[0]); }
    function openInfoModal() { document.getElementById('info-modal').classList.add('open'); }
    function openAboutModal() { document.getElementById('about-modal').classList.add('open'); }
    function openProjectInfoModal() { const info = projectData.projectInfo || {}; document.getElementById('prod-name-input').value = info.prodName || ''; document.getElementById('director-name-input').value = info.directorName || ''; document.getElementById('project-info-modal').classList.add('open'); }
    function handleSaveProjectInfo() { projectData.projectInfo.prodName = document.getElementById('prod-name-input').value; projectData.projectInfo.directorName = document.getElementById('director-name-input').value; projectData.projectInfo.projectName = projectData.projectInfo.prodName || "Untitled"; saveProjectData(); document.getElementById('project-info-modal').classList.remove('open'); }
    function getFilteredScriptText() { /* Logic for filtering */ return fountainInput.value; }
    function handleFilterChange() { const valueInput = document.getElementById('filter-value-input'); valueInput.style.display = filterCategorySelect.value === 'all' ? 'none' : 'block'; valueInput.value = ''; applyFilter(); }
    function applyFilter() { /* Logic to filter fountainInput.value */ }
    function editSceneFromCard(sceneId) { alert(`Editing scene: ${sceneId}`); }
    async function shareSceneCardAsImage(sceneId) { alert(`Sharing scene: ${sceneId}`); }

    // --- Dynamic Modal HTML ---
    function createModalHTML(id, title, body, footer) { const modal = document.createElement('div'); modal.id = id; modal.className = 'modal'; modal.innerHTML = `<div class="modal-content"><button class="modal-close-btn icon-btn" style="position: absolute; top: 0.5rem; right: 0.5rem;">&times;</button><div class="modal-header"><h2>${title}</h2></div><div class="modal-body">${body}</div><div class="modal-footer">${footer}</div></div>`; document.body.appendChild(modal); }
    createModalHTML('project-info-modal', 'Project Info', `<div class="form-group"><label for="prod-name-input">Production Name</label><input type="text" id="prod-name-input"></div><div class="form-group"><label for="director-name-input">Director</label><input type="text" id="director-name-input"></div>`, `<button id="save-project-info-btn" class="main-action-btn">Save</button>`);
    createModalHTML('about-modal', 'About ToscripT', `<p style="text-align: center;">Designed by Thosho Tech</p>`, '');
    createModalHTML('info-modal', 'Info & Help', `<h3>Fountain Syntax</h3><ul><li><strong>Scene Heading:</strong> Line starts with INT. or EXT.</li><li><strong>Character:</strong> Any line in all uppercase.</li><li><strong>Dialogue:</strong> Text following a Character.</li></ul><h3>Button Guide</h3><ul><li><strong>Aa:</strong> Toggles current line to UPPERCASE.</li><li><strong>():</strong> Wraps selected text in parentheses.</li></ul>`, '');
    createModalHTML('title-page-modal', 'Title Page', `<div class="form-group"><label for="title-input">Title</label><input type="text" id="title-input"></div><div class="form-group"><label for="author-input">Author</label><input type="text" id="author-input"></div>`, `<button id="save-title-btn" class="main-action-btn">Save</button>`);
    
    document.getElementById('save-project-info-btn').addEventListener('click', handleSaveProjectInfo);
    document.getElementById('save-title-btn').addEventListener('click', saveTitlePage);
    
    initialize();
});
