document.addEventListener('DOMContentLoaded', () => {
    console.log("ToscripT Starting...");
    
    // Global variables
    let projectData = { projectInfo: { projectName: "Untitled", prodName: "Author", scriptContent: "" } };
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
    const mobileToolbar = document.getElementById('mobile-fixed-toolbar');

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

    // Simple history system
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
    }

    // View switching
    function switchView(view) {
        console.log('Switching to view:', view);
        currentView = view;

        // Hide all views
        [writeView, scriptView, cardView].forEach(v => {
            if (v) v.classList.remove('active');
        });

        if (view === 'script') {
            if (scriptView) {
                renderScript();
                scriptView.classList.add('active');
            }
            // Show script header, hide main header
            if (mainHeader) mainHeader.style.display = 'none';
            if (scriptHeader) scriptHeader.style.display = 'flex';
            // Hide mobile toolbar
            if (mobileToolbar) mobileToolbar.style.display = 'none';
        } else if (view === 'card') {
            if (cardView) {
                renderCardView();
                cardView.classList.add('active');
            }
            if (mainHeader) mainHeader.style.display = 'flex';
            if (scriptHeader) scriptHeader.style.display = 'none';
            if (mobileToolbar) mobileToolbar.style.display = 'none';
        } else {
            // write view
            if (writeView) writeView.classList.add('active');
            if (mainHeader) mainHeader.style.display = 'flex';
            if (scriptHeader) scriptHeader.style.display = 'none';
            // Show mobile toolbar on mobile
            if (mobileToolbar && window.innerWidth <= 768) {
                mobileToolbar.style.display = 'block';
            }
            setTimeout(() => {
                if (fountainInput) fountainInput.focus();
            }, 100);
        }
    }

    // Render functions
    function renderScript() {
        if (!screenplayOutput || !fountainInput) return;

        const text = fountainInput.value || '';
        const lines = text.split('\n');
        let scriptHtml = '';
        let sceneCount = 0;

        // Title page
        scriptHtml += `<div class="title-page">
            <h1>${projectData.projectInfo.projectName || 'Untitled'}</h1>
            <p class="author">by ${projectData.projectInfo.prodName || 'Author'}</p>
        </div>`;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.length === 0) {
                scriptHtml += '<br>';
                return;
            }

            if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.') || trimmed.startsWith('INT./EXT.')) {
                sceneCount++;
                const sceneNum = showSceneNumbers ? `${sceneCount}. ` : '';
                scriptHtml += `<h3 class="scene-heading">${sceneNum}${trimmed}</h3>`;
            } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && !trimmed.includes('.') && trimmed.length < 50) {
                scriptHtml += `<div class="character">${trimmed}</div>`;
            } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                scriptHtml += `<div class="parenthetical">${trimmed}</div>`;
            } else if (/^(CUT TO:|FADE IN:|FADE OUT\.|DISSOLVE TO:)/.test(trimmed)) {
                scriptHtml += `<div class="transition">${trimmed}</div>`;
            } else {
                scriptHtml += `<div class="action">${trimmed}</div>`;
            }
        });

        screenplayOutput.innerHTML = scriptHtml;
    }

    function renderCardView() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer || !fountainInput) return;

        const text = fountainInput.value || '';
        const lines = text.split('\n');
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.') || trimmed.startsWith('INT./EXT.')) {
                if (currentScene) scenes.push(currentScene);
                sceneNumber++;
                currentScene = {
                    sceneId: `scene_${sceneNumber}`,
                    sceneNumber: sceneNumber,
                    heading: trimmed,
                    content: ''
                };
            } else if (currentScene && trimmed) {
                currentScene.content += (currentScene.content ? '\n' : '') + trimmed;
            }
        });

        if (currentScene) scenes.push(currentScene);

        if (scenes.length === 0) {
            cardContainer.innerHTML = `<p style="text-align: center; color: var(--muted-text-color); padding: 2rem;">No scenes found to display as cards.</p>`;
            return;
        }

        cardContainer.innerHTML = scenes.map(scene =>
            `<div class="scene-card" data-scene-id="${scene.sceneId}" data-scene-number="${scene.sceneNumber}">
                <div class="card-header">#${scene.sceneNumber} ${scene.heading}</div>
                <div class="card-body">${scene.content}</div>
                <div class="card-actions">
                    <button class="icon-btn edit-card-btn" title="Edit Scene"><i class="fas fa-pencil-alt"></i></button>
                </div>
            </div>`
        ).join('');
    }

    // Action button handler
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
                cycleText([' - DAY', ' - NIGHT', ' - MORNING', ' - EVENING']);
                break;
            case 'transition':
                cycleText(['CUT TO:', 'DISSOLVE TO:', 'FADE OUT.', 'FADE IN:']);
                break;
        }

        history.add(fountainInput.value);
        setTimeout(() => fountainInput.focus(), 10);
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

            // Try to load Unicode font
            try {
                const fontResponse = await fetch('https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNr5TRA.ttf');
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

            doc.setFontSize(12);
            const text = fountainInput.value || '';
            const lines = text.split('\n');
            
            let y = 50;
            const lineHeight = 14;
            const pageHeight = 792;
            const margin = 50;

            // Title
            doc.setFontSize(18);
            doc.text(projectData.projectInfo.projectName || 'Untitled', 300, y, { align: 'center' });
            y += 30;

            doc.setFontSize(14);
            doc.text(`by ${projectData.projectInfo.prodName || 'Author'}`, 300, y, { align: 'center' });
            y += 50;

            doc.setFontSize(12);

            // Content
            lines.forEach(line => {
                if (y > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }

                const trimmed = line.trim();
                if (trimmed.length === 0) {
                    y += lineHeight / 2;
                    return;
                }

                let x = margin;
                if (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && !trimmed.includes('.') && trimmed.length < 50) {
                    x = 200; // Character names
                } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                    x = 160; // Parentheticals
                } else if (/^(CUT TO:|FADE IN:|FADE OUT\.|DISSOLVE TO:)/.test(trimmed)) {
                    x = 400; // Transitions
                }

                try {
                    // Handle Unicode text
                    const textToRender = trimmed.normalize('NFC');
                    const splitText = doc.splitTextToSize(textToRender, 500);
                    
                    if (Array.isArray(splitText)) {
                        splitText.forEach((textLine, index) => {
                            if (y > pageHeight - margin) {
                                doc.addPage();
                                y = margin;
                            }
                            doc.text(textLine, x, y);
                            if (index < splitText.length - 1) y += lineHeight;
                        });
                    } else {
                        doc.text(splitText, x, y);
                    }
                } catch (err) {
                    // Fallback for problematic characters
                    const asciiText = trimmed.replace(/[^\x00-\x7F]/g, "?");
                    doc.text(asciiText, x, y);
                    console.warn('Used ASCII fallback for:', trimmed);
                }

                y += lineHeight;
            });

            doc.save(`${projectData.projectInfo.projectName || 'screenplay'}.pdf`);
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

    // Setup all event listeners
    function setupEventListeners() {
        console.log('Setting up event listeners...');

        // Fountain input
        if (fountainInput) {
            fountainInput.addEventListener('focus', clearPlaceholder);
            fountainInput.addEventListener('blur', setPlaceholder);
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
        const showScriptBtn = document.getElementById('show-script-btn');
        if (showScriptBtn) {
            showScriptBtn.addEventListener('click', () => {
                console.log('Show script clicked');
                switchView('script');
            });
        }

        const showWriteBtnHeader = document.getElementById('show-write-btn-header');
        if (showWriteBtnHeader) {
            showWriteBtnHeader.addEventListener('click', () => {
                console.log('Show write clicked');
                switchView('write');
            });
        }

        const showWriteBtnCard = document.getElementById('show-write-btn-from-card');
        if (showWriteBtnCard) {
            showWriteBtnCard.addEventListener('click', () => switchView('write'));
        }

        const cardViewBtn = document.getElementById('card-view-btn');
        if (cardViewBtn) {
            cardViewBtn.addEventListener('click', () => switchView('card'));
        }

        // Hamburger menus
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (menuPanel) menuPanel.classList.toggle('open');
            });
        }

        const hamburgerBtnScript = document.getElementById('hamburger-btn-script');
        if (hamburgerBtnScript) {
            hamburgerBtnScript.addEventListener('click', (e) => {
                e.stopPropagation();
                if (menuPanel) menuPanel.classList.toggle('open');
            });
        }

        // Menu items
        const newBtn = document.getElementById('new-btn');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                if (confirm('Are you sure? Unsaved changes will be lost.')) {
                    if (fountainInput) fountainInput.value = '';
                    projectData = { projectInfo: { projectName: "Untitled", prodName: "Author", scriptContent: "" } };
                    history.stack = [""];
                    history.currentIndex = 0;
                    history.updateButtons();
                    saveProjectData();
                    setPlaceholder();
                }
            });
        }

        const openBtn = document.getElementById('open-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
        }

        const savePdfBtn = document.getElementById('save-pdf-btn');
        if (savePdfBtn) {
            savePdfBtn.addEventListener('click', saveAsPdfWithUnicode);
        }

        const saveFountainBtn = document.getElementById('save-fountain-btn');
        if (saveFountainBtn) {
            saveFountainBtn.addEventListener('click', saveAsFountain);
        }

        const projectInfoBtn = document.getElementById('project-info-btn');
        if (projectInfoBtn) {
            projectInfoBtn.addEventListener('click', openProjectInfoModal);
        }

        const infoBtn = document.getElementById('info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                const modal = document.getElementById('info-modal');
                if (modal) modal.classList.add('open');
            });
        }

        const aboutBtn = document.getElementById('about-btn');
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => {
                const modal = document.getElementById('about-modal');
                if (modal) modal.classList.add('open');
            });
        }

        // Action buttons - desktop
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', handleActionBtn);
        });

        // Action buttons - mobile
        document.querySelectorAll('.mobile-action-btn').forEach(btn => {
            btn.addEventListener('click', handleActionBtn);
        });

        // Undo/Redo
        document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top').forEach(btn => {
            btn.addEventListener('click', () => history.undo());
        });

        document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top').forEach(btn => {
            btn.addEventListener('click', () => history.redo());
        });

        // Close panels when clicking outside
        document.addEventListener('click', (e) => {
            if (menuPanel && menuPanel.classList.contains('open') && !menuPanel.contains(e.target) && 
                !e.target.closest('#hamburger-btn') && !e.target.closest('#hamburger-btn-script')) {
                menuPanel.classList.remove('open');
            }

            // Modal close
            const modal = e.target.closest('.modal');
            if (e.target.classList.contains('modal-close-btn') || e.target === modal) {
                if (modal) modal.classList.remove('open');
            }

            // Save buttons
            if (e.target.id === 'save-project-info-btn') handleSaveProjectInfo();
        });

        console.log('Event listeners setup complete');
    }

    // Initialize
    function initialize() {
        console.log('Initializing ToscripT...');

        // Create modals
        createModal('project-info-modal', 'Project Info',
            `<div class="form-group">
                <label for="prod-name-input">Production Name / Title</label>
                <input type="text" id="prod-name-input">
            </div>
            <div class="form-group">
                <label for="director-name-input">Author / Writer</label>
                <input type="text" id="director-name-input">
            </div>`,
            `<button id="save-project-info-btn" class="main-action-btn">Save</button>`
        );

        createModal('about-modal', 'About ToscripT',
            `<p style="text-align: center; margin: 2rem 0;">
                <strong style="color: var(--primary-color);">ToscripT</strong><br>
                Professional Screenwriting Tool<br><br>
                <span style="color: var(--muted-text-color);">Designed by</span><br>
                <strong>Thosho Tech</strong>
            </p>`
        );

        createModal('info-modal', 'Info & Help',
            `<div style="line-height: 1.6;">
                <h3 style="color: var(--primary-color); margin-top: 0;">Fountain Syntax</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>Scene Heading:</strong> Line starts with INT. or EXT.</li>
                    <li><strong>Character:</strong> Any line in all uppercase.</li>
                    <li><strong>Dialogue:</strong> Text following a Character.</li>
                    <li><strong>Parenthetical:</strong> Text in (parentheses).</li>
                    <li><strong>Transition:</strong> CUT TO:, FADE IN:, etc.</li>
                </ul>
                <h3 style="color: var(--primary-color);">Button Guide</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>I/E:</strong> Cycles INT./EXT./INT./EXT.</li>
                    <li><strong>D/N:</strong> Cycles DAY/NIGHT/MORNING/EVENING.</li>
                    <li><strong>Aa:</strong> Toggles line to UPPERCASE/lowercase.</li>
                    <li><strong>():</strong> Wraps selected text in parentheses.</li>
                    <li><strong>TO:</strong> Cycles transition types.</li>
                </ul>
            </div>`
        );

        setupEventListeners();
        loadProjectData();

        if (fountainInput) {
            if (fountainInput.value === '') {
                setPlaceholder();
            }
            setTimeout(() => fountainInput.focus(), 500);
        }

        // Handle mobile toolbar visibility
        function updateMobileToolbar() {
            if (mobileToolbar && window.innerWidth <= 768) {
                if (currentView === 'write') {
                    mobileToolbar.style.display = 'block';
                } else {
                    mobileToolbar.style.display = 'none';
                }
            } else if (mobileToolbar) {
                mobileToolbar.style.display = 'none';
            }
        }

        window.addEventListener('resize', updateMobileToolbar);
        updateMobileToolbar();

        history.add(fountainInput ? fountainInput.value : '');
        console.log('ToscripT initialized successfully!');
    }

    // Start the app
    setTimeout(initialize, 100);
});
