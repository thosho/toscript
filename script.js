document.addEventListener('DOMContentLoaded', () => {
    console.log("ToscripT Initializing...");
    let projectData = {}; 
    let fontSize = 16; 
    let autoSaveInterval = null; 
    let showSceneNumbers = true; 
    let currentView = 'write';
    
    // Get DOM elements with error checking
    const fountainInput = document.getElementById('fountain-input');
    const screenplayOutput = document.getElementById('screenplay-output');
    const menuPanel = document.getElementById('menu-panel');
    const sceneNavigatorPanel = document.getElementById('scene-navigator-panel');
    const writeView = document.getElementById('write-view');
    const scriptView = document.getElementById('script-view');
    const cardView = document.getElementById('card-view');
    const cardContainer = document.getElementById('card-container');
    const sceneList = document.getElementById('scene-list');
    const filterCategorySelect = document.getElementById('filter-category-select');
    const filterValueInput = document.getElementById('filter-value-input');
    const fileInput = document.getElementById('file-input');

    const placeholderText = `TITLE: THE CRIMSON DOSSIER\nAUTHOR: YOUR NAME\n\nINT. DETECTIVE'S OFFICE - NIGHT\n\nThe office is a mess of old files. DETECTIVE VIKRAM (40s, tired) stares at a cold cup of coffee.\n\nA mysterious client, MAYA (30s, elegant), enters from the shadows.\n\nMAYA\n(softly)\nAre you the one they call the Ghost of Bangalore?\n\nVIKRAM\nThat depends on who's asking.\n\nFADE OUT.`;

    const history = {
        stack: [""], 
        currentIndex: 0,
        add(value) { 
            if (value === placeholderText || value === this.stack[this.currentIndex]) return; 
            this.stack = this.stack.slice(0, this.currentIndex + 1); 
            this.stack.push(value); 
            this.currentIndex++; 
            this.updateButtons(); 
        },
        undo() { 
            if (this.canUndo()) { 
                this.currentIndex--; 
                this.updateInput(); 
            } 
        },
        redo() { 
            if (this.canRedo()) { 
                this.currentIndex++; 
                this.updateInput(); 
            } 
        },
        canUndo() { 
            return this.currentIndex > 0; 
        },
        canRedo() { 
            return this.currentIndex < this.stack.length - 1; 
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
            document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top').forEach(btn => {
                if (btn) btn.disabled = !this.canUndo();
            }); 
            document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top').forEach(btn => {
                if (btn) btn.disabled = !this.canRedo();
            }); 
        }
    };

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

    function createNewProjectObject() { 
        return { 
            fileVersion: "1.0", 
            projectInfo: { 
                projectName: "Untitled", 
                directorName: "", 
                prodName: "Author", 
                currency: "USD", 
                scriptContent: "" 
            }, 
            scenes: [], 
            appSpecificData: { 
                toMake: { panelItems: [] }, 
                toSched: { panelItems: [] } 
            } 
        }; 
    }

    function saveProjectData() { 
        if(projectData && projectData.projectInfo && fountainInput) { 
            projectData.projectInfo.scriptContent = fountainInput.value; 
        } 
        localStorage.setItem('universalFilmProject_ToScript', JSON.stringify(projectData)); 
    }

    function loadProjectData() { 
        const savedData = localStorage.getItem('universalFilmProject_ToScript'); 
        projectData = savedData ? JSON.parse(savedData) : createNewProjectObject(); 
        if (fountainInput) {
            fountainInput.value = projectData.projectInfo.scriptContent || ''; 
        }
        updateSceneNoIndicator(); 
    }

    function setupEventListeners() {
        const safeAddListener = (id, event, handler) => { 
            const el = document.getElementById(id); 
            if(el) {
                el.addEventListener(event, handler);
                console.log(`Added listener to ${id}`);
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };
        
        // Fountain input listeners
        if (fountainInput) {
            fountainInput.addEventListener('focus', clearPlaceholder);
            fountainInput.addEventListener('blur', setPlaceholder);
            fountainInput.addEventListener('input', () => { 
                history.add(fountainInput.value); 
                saveProjectData(); 
            });
        }
        
        // Menu buttons
        safeAddListener('new-btn', 'click', () => { 
            if (confirm('Are you sure? Unsaved changes will be lost.')) { 
                if (fountainInput) fountainInput.value = ''; 
                projectData = createNewProjectObject(); 
                history.stack = [""]; 
                history.currentIndex = 0; 
                history.updateButtons(); 
                saveProjectData(); 
                setPlaceholder(); 
            } 
        });
        
        safeAddListener('open-btn', 'click', () => fileInput && fileInput.click());
        
        if (fileInput) {
            fileInput.addEventListener('change', openFountainFile);
        }
        
        safeAddListener('save-menu-btn', 'click', (e) => { 
            e.preventDefault(); 
            e.currentTarget.parentElement.classList.toggle('open'); 
        });
        
        safeAddListener('save-fountain-btn', 'click', saveAsFountain);
        safeAddListener('save-pdf-btn', 'click', saveAsPdfWithUnicode);
        safeAddListener('save-filmproj-btn', 'click', saveAsFilmProj);
        safeAddListener('share-btn', 'click', shareScript);
        safeAddListener('info-btn', 'click', () => {
            const modal = document.getElementById('info-modal');
            if (modal) modal.classList.add('open');
        });
        safeAddListener('about-btn', 'click', () => {
            const modal = document.getElementById('about-modal');
            if (modal) modal.classList.add('open');
        });
        safeAddListener('project-info-btn', 'click', openProjectInfoModal);
        safeAddListener('title-page-btn', 'click', openTitlePageModal);
        safeAddListener('clear-project-btn', 'click', clearProject);
        
        // View switching buttons
        safeAddListener('show-script-btn', 'click', () => switchView('script'));
        safeAddListener('show-write-btn', 'click', () => switchView('write'));
        safeAddListener('show-write-btn-from-card', 'click', () => switchView('write'));
        safeAddListener('card-view-btn', 'click', () => switchView('card'));
        
        // Navigation buttons
        safeAddListener('hamburger-btn', 'click', (e) => { 
            e.stopPropagation(); 
            if (menuPanel) menuPanel.classList.toggle('open'); 
        });
        
        safeAddListener('zoom-in-btn', 'click', () => { 
            fontSize = Math.min(32, fontSize + 2); 
            if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`; 
        });
        
        safeAddListener('zoom-out-btn', 'click', () => { 
            fontSize = Math.max(10, fontSize - 2); 
            if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`; 
        });
        
        safeAddListener('scene-no-btn', 'click', toggleSceneNumbers);
        safeAddListener('scene-navigator-btn', 'click', (e) => { 
            e.stopPropagation(); 
            updateSceneNavigator(); 
            if (sceneNavigatorPanel) sceneNavigatorPanel.classList.add('open'); 
        });
        safeAddListener('close-navigator-btn', 'click', () => {
            if (sceneNavigatorPanel) sceneNavigatorPanel.classList.remove('open');
        });
        safeAddListener('auto-save-btn', 'click', toggleAutoSave);
        
        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            if (btn) btn.addEventListener('click', handleActionBtn);
        });
        
        // Undo/Redo buttons
        document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top').forEach(btn => {
            if (btn) btn.addEventListener('click', () => history.undo());
        });
        document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top').forEach(btn => {
            if (btn) btn.addEventListener('click', () => history.redo());
        });
        
        safeAddListener('fullscreen-btn-main', 'click', () => { 
            document.body.classList.toggle('fullscreen-active'); 
            if (!document.fullscreenElement) { 
                document.documentElement.requestFullscreen().catch(console.error); 
            } else { 
                document.exitFullscreen().catch(console.error); 
            } 
        });
        
        // Filter listeners
        if (filterCategorySelect) {
            filterCategorySelect.addEventListener('change', handleFilterChange);
        }
        if (filterValueInput) {
            filterValueInput.addEventListener('input', applyFilter);
        }
        
        // Global click handler
        document.addEventListener('click', (e) => {
            if (menuPanel && menuPanel.classList.contains('open') && !menuPanel.contains(e.target) && !e.target.closest('#hamburger-btn')) { 
                menuPanel.classList.remove('open'); 
            }
            if (sceneNavigatorPanel && sceneNavigatorPanel.classList.contains('open') && !sceneNavigatorPanel.contains(e.target) && !e.target.closest('#scene-navigator-btn')) { 
                sceneNavigatorPanel.classList.remove('open'); 
            }
            
            const modal = e.target.closest('.modal');
            if (e.target.classList.contains('modal-close-btn') || e.target === modal) { 
                if(modal) modal.classList.remove('open'); 
            }
            if (e.target.id === 'save-title-btn') saveTitlePage();
            if (e.target.id === 'save-project-info-btn') handleSaveProjectInfo();
            
            const editCardBtn = e.target.closest('.edit-card-btn'); 
            if(editCardBtn) editSceneFromCard(editCardBtn.closest('.scene-card').dataset.sceneId);
            const shareCardBtn = e.target.closest('.share-card-btn'); 
            if(shareCardBtn) shareSceneCardAsImage(shareCardBtn.closest('.scene-card'));
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => { 
            if (e.key === 'Escape') { 
                if (menuPanel) menuPanel.classList.remove('open'); 
                if (sceneNavigatorPanel) sceneNavigatorPanel.classList.remove('open'); 
            } 
        });
    }

    // Create modal HTML function
    function createModalHTML(id, title, body, footer) { 
        let modal = document.getElementById(id); 
        if(!modal) { 
            modal = document.createElement('div'); 
            modal.id = id; 
            document.body.appendChild(modal); 
        } 
        modal.className = 'modal'; 
        modal.innerHTML = `<div class="modal-content"><button class="modal-close-btn icon-btn" style="position: absolute; top: 0.5rem; right: 0.5rem;">&times;</button><div class="modal-header"><h2>${title}</h2></div><div class="modal-body">${body}</div><div class="modal-footer">${footer}</div></div>`; 
    }

    // File operations
    function openFountainFile(e) { 
        const file = e.target.files[0]; 
        if (!file) return; 
        const reader = new FileReader(); 
        reader.onload = (e) => { 
            if (fountainInput) {
                fountainInput.value = e.target.result; 
                history.add(fountainInput.value); 
                saveProjectData(); 
            }
        }; 
        reader.readAsText(file); 
    }

    function saveAsFountain() { 
        const text = getFilteredScriptText(); 
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `${projectData.projectInfo.projectName}.fountain`; 
        a.click(); 
        URL.revokeObjectURL(url); 
    }

    async function saveAsPdfWithUnicode() {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library not loaded. Please try again.');
            return;
        }
        
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF(); 
        
        try { 
            const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/v27/o-0IIpQlx3QUlC5A4PNr5TRA.ttf'; 
            const fontResponse = await fetch(fontUrl); 
            if (!fontResponse.ok) throw new Error("Could not fetch font file."); 
            const font = await fontResponse.arrayBuffer(); 
            const fontBase64 = btoa(new Uint8Array(font).reduce((data, byte) => data + String.fromCharCode(byte), '')); 
            doc.addFileToVFS('NotoSans-Regular.ttf', fontBase64); 
            doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal'); 
            doc.setFont('NotoSans'); 
        } catch (e) { 
            console.error("Font loading failed, falling back to default font.", e); 
        } 

        // Simple text-based PDF generation since fountain.parse might not be available
        const lines = getFilteredScriptText().split('\n');
        let y = 20;
        const lineHeight = 6;
        
        lines.forEach(line => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(line || ' ', 20, y);
            y += lineHeight;
        });
        
        doc.save(`${projectData.projectInfo.projectName}.pdf`);
    }

    function saveAsFilmProj() {
        alert('.filmproj export requires fountain.js library to be fully loaded. Please try again.');
    }

    // View functions
    function switchView(view) { 
        currentView = view; 
        if (writeView) writeView.classList.remove('active');
        if (scriptView) scriptView.classList.remove('active');
        if (cardView) cardView.classList.remove('active');
        
        if (view === 'script' && scriptView) { 
            renderScript(); 
            scriptView.classList.add('active'); 
        } else if (view === 'card' && cardView) { 
            renderCardView(); 
            cardView.classList.add('active'); 
        } else if (writeView) { 
            writeView.classList.add('active'); 
        } 
    }

    function renderScript() { 
        if (!screenplayOutput || !fountainInput) return;
        
        const text = getFilteredScriptText(); 
        const titleHtml = `<h1>${projectData.projectInfo.projectName || 'Untitled'}</h1><p class="author">by ${projectData.projectInfo.prodName || 'Author'}</p>`; 
        
        // Simple script rendering without fountain.js dependency
        const lines = text.split('\n');
        let scriptHtml = '';
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.')) {
                scriptHtml += `<h3 class="scene-heading">${trimmed}</h3>`;
            } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && !trimmed.includes('.')) {
                scriptHtml += `<div class="character">${trimmed}</div>`;
            } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                scriptHtml += `<div class="parenthetical">${trimmed}</div>`;
            } else if (trimmed.length > 0) {
                scriptHtml += `<div class="action">${trimmed}</div>`;
            }
        });
        
        screenplayOutput.innerHTML = `<div class="title-page">${titleHtml}</div>${scriptHtml}`; 
    }

    function renderCardView() { 
        if (!cardContainer || !fountainInput) return;
        
        const text = fountainInput.value;
        const scenes = [];
        const lines = text.split('\n');
        let currentScene = null;
        let sceneNumber = 0;
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.')) {
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
        
        if(scenes.length === 0) { 
            cardContainer.innerHTML = `<p style="text-align: center; color: var(--muted-text-color); padding: 2rem;">No scenes found to display as cards.</p>`; 
            return; 
        } 
        
        cardContainer.innerHTML = scenes.map(scene => 
            `<div class="scene-card" data-scene-id="${scene.sceneId}" data-scene-number="${scene.sceneNumber}">
                <div class="card-header">#${scene.sceneNumber} ${scene.heading}</div>
                <div class="card-body">${scene.content}</div>
                <div class="card-actions">
                    <button class="icon-btn edit-card-btn" title="Edit Scene"><i class="fas fa-pencil-alt"></i></button>
                    <button class="icon-btn share-card-btn" title="Share as Image"><i class="fas fa-share-alt"></i></button>
                </div>
            </div>`
        ).join(''); 
    }

    function handleActionBtn(e) { 
        if (!fountainInput) return;
        
        const action = e.currentTarget.dataset.action; 
        const { selectionStart, selectionEnd, value } = fountainInput; 
        const selectedText = value.substring(selectionStart, selectionEnd); 
        
        switch(action) { 
            case 'caps': 
                const lineStart = value.lastIndexOf('\n', selectionStart -1) + 1; 
                const lineEnd = value.indexOf('\n', selectionStart);
                const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd); 
                const newText = (currentLine === currentLine.toUpperCase()) ? currentLine.toLowerCase() : currentLine.toUpperCase(); 
                fountainInput.setRangeText(newText, lineStart, lineEnd === -1 ? value.length : lineEnd); 
                break; 
            case 'parens': 
                fountainInput.setRangeText(`(${selectedText})`, selectionStart, selectionEnd);
                break; 
            case 'scene': 
                cycleText(['INT. ', 'EXT. ', 'INT./EXT. ']); 
                break; 
            case 'time': 
                cycleText([' - DAY', ' - NIGHT']); 
                break; 
            case 'transition': 
                cycleText(['CUT TO:', 'DISSOLVE TO:', 'FADE OUT.', 'FADE IN:']); 
                break; 
        } 
        history.add(fountainInput.value); 
    }

    function cycleText(options) { 
        if (!fountainInput) return;
        
        const { value, selectionStart } = fountainInput; 
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1; 
        const lineEnd = value.indexOf('\n', selectionStart); 
        const currentLine = value.substring(lineStart, lineEnd > -1 ? lineEnd : value.length); 
        let currentIndex = -1; 
        
        for(let i = 0; i < options.length; i++) { 
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
        } 
    }

    // Modal functions
    function openProjectInfoModal() { 
        const info = projectData.projectInfo || {}; 
        const modal = document.getElementById('project-info-modal');
        if (modal) {
            modal.classList.add('open'); 
            const prodNameInput = document.getElementById('prod-name-input');
            const directorNameInput = document.getElementById('director-name-input');
            if (prodNameInput) prodNameInput.value = info.prodName || ''; 
            if (directorNameInput) directorNameInput.value = info.directorName || ''; 
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

    function saveTitlePage() { 
        const titleInput = document.getElementById('title-input');
        const authorInput = document.getElementById('author-input');
        
        if (titleInput) projectData.projectInfo.projectName = titleInput.value || "Untitled"; 
        if (authorInput) projectData.projectInfo.prodName = authorInput.value || "Author"; 
        saveProjectData(); 
        
        const modal = document.getElementById('title-page-modal');
        if (modal) modal.classList.remove('open'); 
    }

    function clearProject() { 
        if (confirm('Are you sure? This will delete the current script and all project info.')) { 
            if (fountainInput) fountainInput.value = ''; 
            projectData = createNewProjectObject(); 
            history.stack = [""]; 
            history.currentIndex = 0; 
            history.updateButtons(); 
            saveProjectData(); 
            setPlaceholder(); 
        } 
    }

    function getFilteredScriptText() { 
        if (!fountainInput) return '';
        
        const category = filterCategorySelect ? filterCategorySelect.value : 'all'; 
        const value = filterValueInput ? filterValueInput.value.toLowerCase().trim() : ''; 
        
        if (category === 'all' || !value) return fountainInput.value; 
        
        // Simple filtering - just return the full text for now
        return fountainInput.value;
    }

    function handleFilterChange() { 
        if (filterValueInput && filterCategorySelect) {
            filterValueInput.style.display = filterCategorySelect.value === 'all' ? 'none' : 'block'; 
            filterValueInput.value = ''; 
        }
        applyFilter(); 
    }

    function applyFilter() { 
        if (currentView === 'script') renderScript(); 
        if (currentView === 'card') renderCardView(); 
    }

    async function shareSceneCardAsImage(cardElement) { 
        if(!cardElement) return; 
        try { 
            if (typeof html2canvas === 'undefined') {
                alert('html2canvas library not loaded');
                return;
            }
            
            const canvas = await html2canvas(cardElement, { 
                backgroundColor: getComputedStyle(document.body).getPropertyValue('--surface-color') 
            }); 
            const fileName = `Scene_${cardElement.dataset.sceneNumber}.png`; 
            canvas.toBlob((blob) => { 
                if(navigator.share) { 
                    const file = new File([blob], fileName, {type: 'image/png'}); 
                    navigator.share({title: `Scene #${cardElement.dataset.sceneNumber}`, files: [file]}).catch(console.error); 
                } else { 
                    const link = document.createElement('a'); 
                    link.download = fileName; 
                    link.href = URL.createObjectURL(blob); 
                    link.click(); 
                    URL.revokeObjectURL(link.href); 
                } 
            }, 'image/png'); 
        } catch (err) { 
            console.error("Failed to share scene card:", err); 
            alert("Could not generate shareable image."); 
        } 
    }

    function editSceneFromCard(sceneId) { 
        if (!fountainInput) return;
        
        const sceneCards = document.querySelectorAll('.scene-card');
        let targetCard = null;
        sceneCards.forEach(card => {
            if (card.dataset.sceneId === sceneId) {
                targetCard = card;
            }
        });
        
        if (targetCard) {
            const heading = targetCard.querySelector('.card-header').textContent;
            const index = fountainInput.value.indexOf(heading.substring(heading.indexOf(' ') + 1));
            if (index > -1) {
                switchView('write');
                fountainInput.focus();
                fountainInput.setSelectionRange(index, index);
            }
        }
    }

    async function shareScript() { 
        if (navigator.share && fountainInput) { 
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

    function toggleSceneNumbers() { 
        showSceneNumbers = !showSceneNumbers; 
        updateSceneNoIndicator(); 
        saveProjectData(); 
        if (scriptView && scriptView.classList.contains('active')) { 
            renderScript(); 
        } 
    }

    function updateSceneNoIndicator() { 
        const indicator = document.getElementById('scene-no-indicator'); 
        if (indicator) {
            if (showSceneNumbers) { 
                indicator.classList.add('on'); 
                indicator.classList.remove('off'); 
            } else { 
                indicator.classList.add('off'); 
                indicator.classList.remove('on'); 
            } 
        }
    }

    function toggleAutoSave() { 
        const indicator = document.getElementById('auto-save-indicator'); 
        if (autoSaveInterval) { 
            clearInterval(autoSaveInterval); 
            autoSaveInterval = null; 
            if (indicator) {
                indicator.classList.add('off'); 
                indicator.classList.remove('on'); 
            }
            alert('Auto-save disabled.'); 
        } else { 
            autoSaveInterval = setInterval(saveProjectData, 120000); 
            if (indicator) {
                indicator.classList.add('on'); 
                indicator.classList.remove('off'); 
            }
            alert('Auto-save enabled (every 2 minutes).'); 
        } 
    }

    function updateSceneNavigator() { 
        if (!sceneList || !fountainInput) return;
        
        const lines = fountainInput.value.split('\n');
        const scenes = [];
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.')) {
                scenes.push({
                    line: index,
                    text: trimmed
                });
            }
        });
        
        sceneList.innerHTML = scenes.map((scene) => 
            `<li data-line="${scene.line}">${scene.text}</li>`
        ).join(''); 
        
        if (typeof Sortable !== 'undefined') {
            new Sortable(sceneList, { 
                animation: 150, 
                ghostClass: 'dragging', 
                onEnd: (evt) => { 
                    console.log('Scene reordered');
                } 
            }); 
        }
    }

    // Initialize the application
    function initialize() {
        console.log('Initializing ToscripT...');
        
        // Create modals
        createModalHTML('project-info-modal', 'Project Info', 
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
        
        createModalHTML('about-modal', 'About ToscripT', 
            `<p style="text-align: center;">Designed by Thosho Tech</p>`, 
            ''
        );
        
        createModalHTML('info-modal', 'Info & Help', 
            `<h3>Fountain Syntax</h3>
            <ul>
                <li><strong>Scene Heading:</strong> Line starts with INT. or EXT.</li>
                <li><strong>Character:</strong> Any line in all uppercase.</li>
                <li><strong>Dialogue:</strong> Text following a Character.</li>
            </ul>
            <h3>Button Guide</h3>
            <ul>
                <li><strong>Aa:</strong> Toggles current line to UPPERCASE.</li>
                <li><strong>():</strong> Wraps selected text in parentheses.</li>
            </ul>`, 
            ''
        );
        
        createModalHTML('title-page-modal', 'Title Page', 
            `<div class="form-group">
                <label for="title-input">Title</label>
                <input type="text" id="title-input">
            </div>
            <div class="form-group">
                <label for="author-input">Author</label>
                <input type="text" id="author-input">
            </div>`, 
            `<button id="save-title-btn" class="main-action-btn">Save</button>`
        );
        
        setupEventListeners();
        loadProjectData();
        
        if(fountainInput && fountainInput.value === '') {
            setPlaceholder();
        }
        
        history.add(fountainInput ? fountainInput.value : '');
        console.log('ToscripT initialized successfully!');
    }
    
    // Wait a bit for external libraries to load, then initialize
    setTimeout(initialize, 100);
});
