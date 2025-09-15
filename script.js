document.addEventListener('DOMContentLoaded', () => {
    console.log("ToscripT Starting...");
    
    // Global variables
    let projectData = { projectInfo: { projectName: "Untitled", prodName: "Author", scriptContent: "" } };
    let fontSize = 16;
    let autoSaveInterval = null;
    let showSceneNumbers = true;
    let currentView = 'write';
    let isKeyboardOpen = false;

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

    // Mobile keyboard detection and toolbar positioning
    function setupMobileKeyboard() {
        let initialViewportHeight = window.innerHeight;
        
        function handleViewportChange() {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            isKeyboardOpen = heightDifference > 150; // Keyboard is open if height reduced by more than 150px
            
            if (mobileToolbar && currentView === 'write') {
                if (isKeyboardOpen) {
                    // Position toolbar above keyboard
                    mobileToolbar.style.position = 'fixed';
                    mobileToolbar.style.bottom = '0px';
                    mobileToolbar.style.zIndex = '9999';
                    mobileToolbar.style.transform = 'translateY(0)';
                } else {
                    // Normal position when keyboard is closed
                    mobileToolbar.style.position = 'fixed';
                    mobileToolbar.style.bottom = '0px';
                    mobileToolbar.style.zIndex = '100';
                    mobileToolbar.style.transform = 'translateY(0)';
                }
            }
        }

        // Use Visual Viewport API if available (modern browsers)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
        } else {
            // Fallback for older browsers
            window.addEventListener('resize', handleViewportChange);
        }

        // Also handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                initialViewportHeight = window.innerHeight;
                handleViewportChange();
            }, 500);
        });
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

    // View switching with proper header management
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
            renderScript();
        }
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
            cardContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--muted-text-color);">
                    <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No scenes found to display as cards.</p>
                    <p style="font-size: 0.9rem;">Start writing your screenplay to see scene cards here.</p>
                </div>`;
            return;
        }

        cardContainer.innerHTML = scenes.map(scene =>
            `<div class="scene-card" data-scene-id="${scene.sceneId}" data-scene-number="${scene.sceneNumber}">
                <div class="card-header">#${scene.sceneNumber} ${scene.heading}</div>
                <div class="card-body">${scene.content}</div>
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

        // Add Save All Cards button to card view bottom bar
        const cardViewBottomBar = cardView.querySelector('.bottom-bar');
        if (cardViewBottomBar) {
            cardViewBottomBar.innerHTML = `
                <button id="show-write-btn-from-card" class="main-action-btn secondary">TO WRITE</button>
                <button id="save-all-cards-btn" class="main-action-btn" style="margin-left: 1rem;">
                    <i class="fas fa-download"></i> SAVE ALL CARDS
                </button>
            `;
        }
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
        
        // Keep focus on mobile
        setTimeout(() => {
            if (fountainInput) fountainInput.focus();
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

    // Card functions
    function editSceneFromCard(sceneId) {
        const text = fountainInput.value || '';
        const lines = text.split('\n');
        let targetLineIndex = -1;
        let sceneCount = 0;
        const targetSceneNumber = parseInt(sceneId.replace('scene_', ''));

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.') || trimmed.startsWith('INT./EXT.')) {
                sceneCount++;
                if (sceneCount === targetSceneNumber) {
                    targetLineIndex = index;
                }
            }
        });

        if (targetLineIndex >= 0) {
            switchView('write');
            setTimeout(() => {
                if (fountainInput) {
                    fountainInput.focus();
                    // Calculate character position
                    const linesBeforeTarget = lines.slice(0, targetLineIndex);
                    const charPosition = linesBeforeTarget.join('\n').length + (targetLineIndex > 0 ? 1 : 0);
                    fountainInput.setSelectionRange(charPosition, charPosition);
                    fountainInput.scrollTop = (charPosition / fountainInput.value.length) * fountainInput.scrollHeight;
                }
            }, 200);
        }
    }

    async function shareSceneCard(sceneId) {
        const cardElement = document.querySelector(`[data-scene-id="${sceneId}"]`);
        if (!cardElement) return;

        try {
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(cardElement, {
                    backgroundColor: '#1f2937',
                    scale: 2
                });
                
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
        a.click();
        URL.revokeObjectURL(url);
    }

    async function saveAllCardsAsZip() {
        if (typeof JSZip === 'undefined') {
            // Fallback: save individual cards as text files
            alert('ZIP library not available. Saving individual scene files...');
            
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
                        sceneNumber: sceneNumber,
                        heading: trimmed,
                        content: ''
                    };
                } else if (currentScene && trimmed) {
                    currentScene.content += (currentScene.content ? '\n' : '') + trimmed;
                }
            });
            if (currentScene) scenes.push(currentScene);

            scenes.forEach(scene => {
                const sceneText = `${scene.heading}\n\n${scene.content}`;
                const blob = new Blob([sceneText], { type: 'text/plain;charset=utf-8' });
                downloadBlob(blob, `Scene_${scene.sceneNumber}.txt`);
            });
            return;
        }

        try {
            // Create ZIP file with scene cards
            const zip = new JSZip();
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
                        sceneNumber: sceneNumber,
                        heading: trimmed,
                        content: ''
                    };
                } else if (currentScene && trimmed) {
                    currentScene.content += (currentScene.content ? '\n' : '') + trimmed;
                }
            });
            if (currentScene) scenes.push(currentScene);

            // Add each scene to ZIP
            scenes.forEach(scene => {
                const sceneText = `${scene.heading}\n\n${scene.content}`;
                zip.file(`Scene_${scene.sceneNumber}.txt`, sceneText);
            });

            // Add project info
            const projectInfo = `Project: ${projectData.projectInfo.projectName}\nAuthor: ${projectData.projectInfo.prodName}\nTotal Scenes: ${scenes.length}\nGenerated: ${new Date().toLocaleString()}`;
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

        const lines = fountainInput.value.split('\n');
        const scenes = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.') || trimmed.startsWith('INT./EXT.')) {
                scenes.push({
                    line: index,
                    text: trimmed
                });
            }
        });

        sceneList.innerHTML = scenes.map((scene) =>
            `<li data-line="${scene.line}">${scene.text}</li>`
        ).join('');
    }

    // Setup all event listeners
    function setupEventListeners() {
        console.log('Setting up comprehensive event listeners...');

        // Fountain input
        if (fountainInput) {
            fountainInput.addEventListener('focus', () => {
                clearPlaceholder();
                // Prevent keyboard from closing mobile toolbar
                if (mobileToolbar && window.innerWidth <= 768 && currentView === 'write') {
                    setTimeout(() => {
                        if (mobileToolbar) mobileToolbar.style.display = 'block';
                    }, 300);
                }
            });
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

        const cardViewBtn = document.getElementById('card-view-btn');
        if (cardViewBtn) {
            cardViewBtn.addEventListener('click', () => switchView('card'));
        }

        // Hamburger menus (LEFT side for regular menu)
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Hamburger clicked - toggling menu panel');
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

        // Scene navigator (RIGHT side button)
        const sceneNavigatorBtn = document.getElementById('scene-navigator-btn');
        if (sceneNavigatorBtn) {
            sceneNavigatorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Scene navigator clicked');
                updateSceneNavigator();
                if (sceneNavigatorPanel) sceneNavigatorPanel.classList.add('open');
            });
        }

        const sceneNavigatorBtnScript = document.getElementById('scene-navigator-btn-script');
        if (sceneNavigatorBtnScript) {
            sceneNavigatorBtnScript.addEventListener('click', (e) => {
                e.stopPropagation();
                updateSceneNavigator();
                if (sceneNavigatorPanel) sceneNavigatorPanel.classList.add('open');
            });
        }

        const closeNavigatorBtn = document.getElementById('close-navigator-btn');
        if (closeNavigatorBtn) {
            closeNavigatorBtn.addEventListener('click', () => {
                if (sceneNavigatorPanel) sceneNavigatorPanel.classList.remove('open');
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

        // Save menu toggle
        const saveMenuBtn = document.getElementById('save-menu-btn');
        if (saveMenuBtn) {
            saveMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdown = saveMenuBtn.parentElement;
                if (dropdown) dropdown.classList.toggle('open');
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

        const titlePageBtn = document.getElementById('title-page-btn');
        if (titlePageBtn) {
            titlePageBtn.addEventListener('click', openTitlePageModal);
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

        // Toggle buttons
        const sceneNoBtn = document.getElementById('scene-no-btn');
        if (sceneNoBtn) {
            sceneNoBtn.addEventListener('click', toggleSceneNumbers);
        }

        const autoSaveBtn = document.getElementById('auto-save-btn');
        if (autoSaveBtn) {
            autoSaveBtn.addEventListener('click', toggleAutoSave);
        }

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreen-btn-main');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                document.body.classList.toggle('fullscreen-active');
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(console.error);
                } else {
                    document.exitFullscreen().catch(console.error);
                }
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

        // Global click handler for dynamic elements
        document.addEventListener('click', (e) => {
            // Close menu panel when clicking outside
            if (menuPanel && menuPanel.classList.contains('open') && !menuPanel.contains(e.target) && 
                !e.target.closest('#hamburger-btn') && !e.target.closest('#hamburger-btn-script')) {
                menuPanel.classList.remove('open');
            }

            // Close scene navigator when clicking outside
            if (sceneNavigatorPanel && sceneNavigatorPanel.classList.contains('open') && 
                !sceneNavigatorPanel.contains(e.target) && !e.target.closest('#scene-navigator-btn') && 
                !e.target.closest('#scene-navigator-btn-script')) {
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
            if (e.target.id === 'show-write-btn-from-card') {
                switchView('write');
            }
            if (e.target.id === 'save-all-cards-btn') {
                saveAllCardsAsZip();
            }

            // Edit card button
            if (e.target.closest('.edit-card-btn')) {
                const btn = e.target.closest('.edit-card-btn');
                const sceneId = btn.dataset.sceneId || btn.closest('.scene-card').dataset.sceneId;
                if (sceneId) editSceneFromCard(sceneId);
            }

            // Share card button
            if (e.target.closest('.share-card-btn')) {
                const btn = e.target.closest('.share-card-btn');
                const sceneId = btn.dataset.sceneId || btn.closest('.scene-card').dataset.sceneId;
                if (sceneId) shareSceneCard(sceneId);
            }
        });

        console.log('All event listeners setup complete');
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

        createModal('title-page-modal', 'Title Page',
            `<div class="form-group">
                <label for="title-input">Title</label>
                <input type="text" id="title-input" placeholder="Enter screenplay title">
            </div>
            <div class="form-group">
                <label for="author-input">Author</label>
                <input type="text" id="author-input" placeholder="Enter author name">
            </div>`,
            `<button id="save-title-btn" class="main-action-btn">Save</button>`
        );

        createModal('about-modal', 'About ToscripT',
            `<p style="text-align: center; margin: 2rem 0;">
                <strong style="color: var(--primary-color);">ToscripT</strong><br>
                Professional Screenwriting Tool<br><br>
                <span style="color: var(--muted-text-color);">Designed by</span><br>
                <strong>Thosho Tech</strong><br><br>
                <span style="font-size: 0.9rem; color: var(--muted-text-color);">
                    Empowering scriptwriters worldwide with professional tools
                </span>
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
                <h3 style="color: var(--primary-color);">Mobile Buttons</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>I/E:</strong> Cycles INT./EXT./INT./EXT.</li>
                    <li><strong>D/N:</strong> Cycles DAY/NIGHT/MORNING/EVENING.</li>
                    <li><strong>Aa:</strong> Toggles line to UPPERCASE/lowercase.</li>
                    <li><strong>():</strong> Wraps selected text in parentheses.</li>
                    <li><strong>TO:</strong> Cycles transition types.</li>
                </ul>
                <h3 style="color: var(--primary-color);">Card View Features</h3>
                <ul style="padding-left: 1.2rem;">
                    <li><strong>Edit:</strong> Jump to scene in editor</li>
                    <li><strong>Share:</strong> Share individual scene</li>
                    <li><strong>Save All Cards:</strong> Download all scenes as ZIP</li>
                </ul>
            </div>`
        );

        setupEventListeners();
        setupMobileKeyboard();
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
        
        // Add JSZip for ZIP functionality
        if (typeof JSZip === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => console.log('JSZip loaded successfully');
            script.onerror = () => console.warn('JSZip failed to load - ZIP functionality will use fallback');
            document.head.appendChild(script);
        }

        console.log('🎬 ToscripT initialized successfully! Ready to help scriptwriters worldwide! 🌟');
    }

    // Start the app
    setTimeout(initialize, 100);
});
