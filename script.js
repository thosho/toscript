document.addEventListener('DOMContentLoaded', () => {
    console.log("🎬 ToscripT Professional - Complete with Enhanced Scene Navigator & Mobile Toolbar Fixes");
    
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

    // FIXED: Mobile Keyboard Detection for Fullscreen
    function setupKeyboardDetection() {
        let initialHeight = window.innerHeight;
        
        function handleKeyboardToggle() {
            const currentHeight = window.innerHeight;
            const heightDiff = initialHeight - currentHeight;
            const keyboardOpen = heightDiff > 150;
            
            // FIXED: Show toolbar in fullscreen too
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

    // FIXED: Enhanced Scene Parsing with DAY/NIGHT Detection
    function extractScenesFromText(text) {
        if (typeof fountain === 'undefined') {
            console.warn('Fountain parser not available, using basic parsing');
            return parseScriptBasic(text);
        }

        const output = fountain.parse(text || '');
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;

        output.tokens.forEach(token => {
            if (token.type === 'scene_heading') {
                if (currentScene) scenes.push(currentScene);
                sceneNumber++;
                
                const headingText = token.text.toUpperCase();
                const parts = headingText.split(' - ');
                const location = parts[0].trim();
                const timeOfDay = (parts[1] || 'DAY').trim();
                
                // Extract scene type
                let sceneType = "INT.";
                if (location.startsWith("EXT.")) sceneType = "EXT.";
                if (location.startsWith("INT./EXT.")) sceneType = "INT./EXT.";
                
                currentScene = {
                    number: sceneNumber,
                    heading: headingText,
                    sceneType: sceneType,
                    location: location.replace(/^(INT\.?\/EXT\.?|INT\.|EXT\.)\s*/, '').trim(),
                    timeOfDay: timeOfDay,
                    description: [],
                    characters: []
                };
            } else if (currentScene) {
                if (token.type === 'action' && token.text) {
                    currentScene.description.push(token.text);
                } else if (token.type === 'character') {
                    const characterName = token.text.replace(/\s*\(.*\)\s*$/, '').trim();
                    if (characterName && !currentScene.characters.includes(characterName)) {
                        currentScene.characters.push(characterName);
                    }
                }
            }
        });

        if (currentScene) scenes.push(currentScene);
        return scenes;
    }

    // Fallback basic parsing
    function parseScriptBasic(text) {
        const lines = (text || '').split('\n');
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

    // FIXED: Enhanced Filter with DAY/NIGHT Support
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

    // FIXED: Enhanced Filter Application with Scene Filtering
    function applyFilter() {
        const category = filterCategorySelect?.value || 'all';
        const filterText = (filterValueInput?.value || '').toLowerCase().trim();
        
        if (category === 'all' || !filterText) {
            // Show all scenes
            if (fountainInput) fountainInput.value = projectData.projectInfo.scriptContent || '';
            if (currentView === 'script') renderEnhancedScript();
            if (currentView === 'card') renderEnhancedCardView();
            return;
        }

        // Filter scenes based on category
        const scenes = projectData.projectInfo.scenes || [];
        const filteredScenes = scenes.filter(scene => {
            switch (category) {
                case 'sceneSetting':
                    return scene.location.toLowerCase().includes(filterText);
                case 'sceneType':
                    return scene.sceneType.toLowerCase().includes(filterText.replace(/\./g, ''));
                case 'cast':
                    return scene.characters.some(char => char.toLowerCase().includes(filterText));
                case 'timeOfDay':
                    return scene.timeOfDay.toLowerCase().includes(filterText);
                default:
                    return true;```
