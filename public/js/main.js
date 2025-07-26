    let roleRewardCounter = 0;
        let reactionRoleCounter = 0;
        let guildData = null;
        let currentServerId = null;

        // Initialize dashboard
        async function initializeDashboard() {
            try {
                // Step 1: Connection
                updateLoadingStep(1, 'active', 'Connecting...');
                updateProgress(33);
                updateLoadingDetails('Connecting to Discord...');
                
                // Get guild IDs from the connected bot
                const response = await fetch('/api/dashboard-stats');
                const data = await response.json();
                
                if (data.success && data.stats.guilds && data.stats.guilds.length > 0) {
                    currentServerId = data.stats.guilds[0].id;
                    updateLoadingDetails(`Connected to ${data.stats.guilds.length} servers`);
                    updateLoadingStep(1, 'completed', 'Connected');
                } else {
                    throw new Error('No servers found');
                }
                
                // Step 2: Loading Data
                updateLoadingStep(2, 'active', 'Loading data...');
                updateProgress(66);
                updateLoadingDetails('Loading server data and dashboard configuration...');
                
                // Load all data in parallel
                await Promise.all([
                    loadGuildData(),
                    fetch('/api/bot-data').then(r => r.json())
                ]);
                    
                    updateLoadingDetails('Server data and configuration loaded');
                    updateLoadingStep(2, 'completed', 'Loaded');
                    
                    // Step 3: Preparing Interface
                    updateLoadingStep(3, 'active', 'Preparing...');
                    updateProgress(100);
                    updateLoadingDetails('Preparing dashboard interface...');
                    
                    // Wait for all data to fully load before showing dashboard
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Pre-load all dashboard data while still showing loading screen
                    updateLoadingDetails('Loading dashboard configuration and populating fields...');
                    await loadDashboardData();
                    
                    // Wait for guild data to be fully populated
                    updateLoadingDetails('Populating dropdowns and form fields...');
                    let retryCount = 0;
                    const maxRetries = 20;
                    
                    while (retryCount < maxRetries) {
                        if (guildData && guildData.roles && guildData.roles.length > 0 && 
                            guildData.channels && guildData.channels.length > 0) {
                            break;
                        }
                        await new Promise(resolve => setTimeout(resolve, 250));
                        retryCount++;
                    }
                    
                    // Pre-populate all form fields before showing dashboard
                    await populateAllFormFields();
                    
                    // Initialize reaction roles system safely
                    setTimeout(() => {
                        try {
                            if (typeof initAdvancedReactionRoles === 'function') {
                                initAdvancedReactionRoles();
                            }
                        } catch (error) {
                            console.log('Advanced reaction roles initialization skipped:', error.message);
                        }
                    }, 100);
                    
                    updateLoadingStep(3, 'completed', 'Ready');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    document.getElementById('loadingScreen').style.display = 'none';
                    document.getElementById('dashboard').style.display = 'block';
                    addDashboardTitleClickEvent();
                    
                } catch (error) {
                    console.error('Error during initialization:', error);
                    updateLoadingDetails('Failed to initialize dashboard. Please try again.');
                    document.getElementById('loadingScreen').style.display = 'none';
                    showPopupNotification('Failed to initialize dashboard: ' + error.message, false);
                }
        }

        // Initialize the dashboard when the page loads
        window.addEventListener('load', initializeDashboard);

        // Loading screen helper functions
        function updateLoadingStep(stepNumber, status, statusText) {
            const step = document.getElementById(`step${stepNumber}`);
            const statusElement = step.querySelector('.step-status');
            
            // Remove existing status classes
            step.classList.remove('active', 'completed');
            
            // Add new status class
            step.classList.add(status);
            
            // Update status text
            statusElement.textContent = statusText;
        }

        function updateProgress(percentage) {
            const progressFill = document.getElementById('progressFill');
            progressFill.style.width = percentage + '%';
        }

        function updateLoadingDetails(text) {
            const details = document.getElementById('loadingDetails');
            details.textContent = text;
        }

        // Processing overlay functions
        function showProcessing() {
            const overlay = document.getElementById('processingOverlay');
            overlay.style.display = 'flex';
            // Disable all buttons and forms during processing
            document.querySelectorAll('button, input[type="submit"]').forEach(element => {
                element.disabled = true;
            });
            overlay.style.pointerEvents = 'auto';
        }

        function hideProcessing() {
            const overlay = document.getElementById('processingOverlay');
            overlay.style.display = 'none';
            // Re-enable all buttons and forms
            document.querySelectorAll('button, input[type="submit"]').forEach(element => {
                element.disabled = false;
            });
        }

        // Popup notification function with auto-dismiss after 8 seconds
        function showPopupNotification(message, success = true) {
            const popup = document.getElementById('popupNotification');
            popup.textContent = message;
            popup.className = `popup-notification ${success ? 'success' : 'error'}`;
            popup.classList.add('show');
            
            // Auto-fade after 3 seconds
            setTimeout(() => {
                popup.classList.remove('show');
            }, 3000);
        }

        // Avatar preview function
        function previewAvatar(botId) {
            const file = document.getElementById(`${botId}Avatar`).files[0];
            const preview = document.getElementById(`${botId}AvatarPreview`);
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="${botId} Avatar Preview">`;
                };
                reader.readAsDataURL(file);
            }
        }

        // Message display function
        function showMessage(elementId, message, success = true) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = message;
                element.className = success ? 'message success' : 'message error';
                element.style.display = 'block';
                setTimeout(() => {
                    element.style.display = 'none';
                }, 8000);
            }
        }





        // Mobile navigation state
        let currentMobileIndex = 0;
        const navItems = [];
        
        // Initialize mobile navigation
        function initMobileNavigation() {
            // Get all nav items
            const allNavItems = document.querySelectorAll('.nav-item');
            navItems.length = 0;
            allNavItems.forEach(item => {
                if (item.style.display !== 'none') {
                    navItems.push(item);
                }
            });
            
            // Check if database tab is visible
            const databaseTab = document.getElementById('databaseTab');
            const isDatabaseVisible = databaseTab && databaseTab.style.display !== 'none';
            
            // Update slider class based on database tab visibility
            const slider = document.getElementById('mobileNavSlider');
            if (slider) {
                if (isDatabaseVisible) {
                    slider.classList.add('with-database');
                } else {
                    slider.classList.remove('with-database');
                }
            }
            
            // Set initial position to show first 3 items with middle selected
            currentMobileIndex = 0;
            updateMobileNavigation();
        }
        
        // Update mobile navigation display
        function updateMobileNavigation() {
            if (window.innerWidth <= 768) {
                const slider = document.getElementById('mobileNavSlider');
                const leftArrow = document.getElementById('mobileNavLeft');
                const rightArrow = document.getElementById('mobileNavRight');
                
                if (slider && leftArrow && rightArrow) {
                    // Check if database tab is visible
                    const isDatabaseVisible = slider.classList.contains('with-database');
                    
                    // Calculate item width based on total number of tabs
                    const itemWidth = isDatabaseVisible ? 100 / 4 : 100 / 8; // 4 tabs or 8 tabs
                    const translateX = -currentMobileIndex * itemWidth;
                    slider.style.transform = `translateX(${translateX}%)`;
                    
                    // Update arrow states with proper bounds checking
                    if (leftArrow) {
                        leftArrow.disabled = currentMobileIndex === 0;
                    }
                    if (rightArrow) {
                        rightArrow.disabled = currentMobileIndex >= Math.max(0, navItems.length - 3);
                    }
                    
                    // Highlight middle item as active if not manually selected
                    const middleIndex = currentMobileIndex + 1;
                    if (middleIndex < navItems.length && navItems[middleIndex]) {
                        // Only auto-select if no item is manually active
                        const hasActiveItem = navItems.some(item => item && item.classList && item.classList.contains('active'));
                        if (!hasActiveItem) {
                            navItems[middleIndex].classList.add('active');
                        }
                    }
                }
            }
        }
        
        // Navigate mobile tabs
        function navigateMobileNav(direction) {
            // Ensure we have nav items initialized
            if (navItems.length === 0) {
                initMobileNavigation();
                return;
            }
            
            // Find current active tab
            const activeTab = document.querySelector('.nav-item.active');
            if (!activeTab) {
                // If no active tab, activate the first one
                if (navItems[0]) {
                    navItems[0].classList.add('active');
                    const onclickAttr = navItems[0].getAttribute('onclick');
                    if (onclickAttr) {
                        const tabMatch = onclickAttr.match(/showTab\(['"]([^'"]+)['"]\)/);
                        if (tabMatch) {
                            showTab(tabMatch[1]);
                        }
                    }
                }
                return;
            }
            
            const activeIndex = navItems.findIndex(item => item === activeTab);
            
            if (activeIndex !== -1) {
                // Calculate new index with proper bounds checking
                const newIndex = activeIndex + direction;
                
                // Check bounds more carefully
                if (newIndex >= 0 && newIndex < navItems.length && navItems[newIndex]) {
                    // Remove active from current
                    activeTab.classList.remove('active');
                    
                    // Add active to new tab
                    navItems[newIndex].classList.add('active');
                    
                    // Get the tab name from onclick attribute and trigger navigation
                    const onclickAttr = navItems[newIndex].getAttribute('onclick');
                    if (onclickAttr) {
                        const tabMatch = onclickAttr.match(/showTab\(['"]([^'"]+)['"]\)/);
                        if (tabMatch) {
                            showTab(tabMatch[1]);
                        }
                    }
                    
                    // Update mobile navigation to center the selected item
                    currentMobileIndex = Math.max(0, Math.min(newIndex - 1, navItems.length - 3));
                    updateMobileNavigation();
                }
            }
        }
        
        // Tab navigation
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active from all nav items
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            
            // Show selected tab
            const targetTab = document.getElementById(tabName);
            if (targetTab) {
                targetTab.classList.add('active');
            }
            
            // Find and activate the corresponding nav item
            let targetNavItem = null;
            if (event && event.target) {
                targetNavItem = event.target.closest('.nav-item');
            } else {
                // Find nav item by tab name if no event (for programmatic calls)
                targetNavItem = document.querySelector(`.nav-item[onclick*="${tabName}"]`);
            }
            
            if (targetNavItem) {
                targetNavItem.classList.add('active');
                
                // On mobile, center the active tab
                if (window.innerWidth <= 768 && navItems.length > 0) {
                    const activeIndex = navItems.indexOf(targetNavItem);
                    if (activeIndex >= 0) {
                        // Center the active item in the 3-tab view
                        // For centering, we want the selected tab to appear in the middle position
                        // So if we select index 2, we want to show tabs 1,2,3 (currentMobileIndex = 1)
                        currentMobileIndex = Math.max(0, Math.min(activeIndex - 1, navItems.length - 3));
                        updateMobileNavigation();
                    }
                }
            }
            
            // Close mobile sidebar if open
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                const overlay = document.querySelector('.mobile-overlay');
                if (sidebar) sidebar.classList.remove('mobile-open');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Initialize advanced reaction roles when reactions tab is opened
            if (tabName === 'reactions') {
                // Delay initialization to ensure DOM is ready
                setTimeout(initAdvancedReactionRoles, 100);
            }
        }
        
        // Initialize mobile navigation on page load and resize
        window.addEventListener('load', initMobileNavigation);
        window.addEventListener('resize', () => {
            setTimeout(initMobileNavigation, 100);
        });

        // Bot tab navigation for General settings
        function showBotGeneralTab(botId) {
            // Remove active from all bot tabs in General section
            document.querySelectorAll('#general .bot-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Hide all bot sections in General
            document.querySelectorAll('#general .bot-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected bot tab and section
            document.querySelector(`#general .bot-tab[data-bot="${botId}"]`).classList.add('active');
            document.getElementById(`${botId}GeneralSection`).classList.add('active');
        }

        // Bot tab navigation for AI Details
        function showBotPersonalityTab(botId) {
            // Remove active from all bot tabs in AI Details section
            document.querySelectorAll('#personality .bot-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Hide all bot sections in AI Details
            document.querySelectorAll('#personality .bot-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected bot tab and section
            document.querySelector(`#personality .bot-tab[data-bot="${botId}"]`).classList.add('active');
            document.getElementById(`${botId}PersonalitySection`).classList.add('active');
        }

        // Populate all form fields and dropdowns
        async function populateAllFormFields() {
            try {
                // Ensure guild data is available
                if (!guildData || !guildData.roles || !guildData.channels) {
                    console.log('Guild data not ready for field population');
                    return;
                }

                // Populate channel dropdowns
                const channelSelects = document.querySelectorAll('select[id*="Channel"], select[id*="channel"]');
                channelSelects.forEach(select => {
                    if (select && select.options.length <= 1) { // Only populate if empty
                        // Clear existing options
                        select.innerHTML = '<option value="">Select Channel</option>';
                        
                        // Add channels based on select type
                        if (select.id === 'forumChannelSelect') {
                            // Only add forum channels for forum select
                            guildData.channels.filter(channel => channel.type === 'forum').forEach(channel => {
                                const option = document.createElement('option');
                                option.value = channel.id;
                                option.textContent = `${channel.icon} ${channel.name}`;
                                select.appendChild(option);
                            });
                        } else {
                            // Add all channels for other selects
                            guildData.channels.forEach(channel => {
                                const option = document.createElement('option');
                                option.value = channel.id;
                                option.textContent = `${channel.icon} ${channel.name}`;
                                select.appendChild(option);
                            });
                        }
                    }
                });

                // Populate role dropdowns
                const roleSelects = document.querySelectorAll('select[id*="Role"], select[id*="role"]');
                roleSelects.forEach(select => {
                    if (select && select.options.length <= 1) { // Only populate if empty
                        // Clear existing options
                        select.innerHTML = '<option value="">Select Role</option>';
                        
                        // Add roles
                        guildData.roles.forEach(role => {
                            const option = document.createElement('option');
                            option.value = role.id;
                            option.textContent = role.name;
                            select.appendChild(option);
                        });
                    }
                });

                // Populate auto role dropdown specifically
                const autoRoleSelect = document.getElementById('autoRole');
                if (autoRoleSelect && autoRoleSelect.options.length <= 1) {
                    autoRoleSelect.innerHTML = '<option value="">Select Auto Role</option>';
                    guildData.roles.forEach(role => {
                        const option = document.createElement('option');
                        option.value = role.id;
                        option.textContent = role.name;
                        autoRoleSelect.appendChild(option);
                    });
                }


                
            } catch (error) {
                console.error('Error populating form fields:', error);
            }
        }

        // Load dashboard data
        async function loadDashboardData() {
            try {
                // Load guild data first for dropdowns (blocking)
                await loadGuildData();
                
                // Load bot data
                const response = await fetch('/api/bot-data');
                const data = await response.json();
                
                if (!data || !data.success) {
                    console.error('Failed to load bot data:', data);
                    return;
                }

                // Load experience data to populate XP-related fields
                const experienceResponse = await fetch('/api/experience-data');
                const experienceData = await experienceResponse.json();
                
                if (experienceData.success) {
                    // Populate streaming XP fields
                    const streamerXpInput = document.getElementById('streamerXp');
                    const minuteCheckInput = document.getElementById('minuteCheck');
                    
                    if (streamerXpInput) {
                        streamerXpInput.value = experienceData.data.streamer_xp || 3;
                    }
                    if (minuteCheckInput) {
                        minuteCheckInput.value = experienceData.data.minute_check || 15;
                    }

                    // Populate other XP fields if they exist
                    const slashXpInput = document.getElementById('slashXp');
                    const mentionXpInput = document.getElementById('mentionXp');
                    const threadXpInput = document.getElementById('threadXp');
                    
                    if (slashXpInput) {
                        slashXpInput.value = experienceData.data.slash_xp || 0;
                    }
                    if (mentionXpInput) {
                        mentionXpInput.value = experienceData.data.mention_xp || 0;
                    }
                    if (threadXpInput) {
                        threadXpInput.value = experienceData.data.thread_xp || 0;
                    }
                }
                
                if (data.success && data.data) {
                    // Bot 1 AI Details (with null checks)
                    const bot1Data = data.data.bot1 || {};
                    const bot1DisplayName = bot1Data.displayName || bot1Data.name || 'AI Assistant';
                    
                    const bot1Elements = [
                        { id: 'bot1Age', value: bot1Data.age || '', placeholder: `${bot1DisplayName}'s age` },
                        { id: 'bot1Appearance', value: bot1Data.appearance || '', placeholder: `Describe ${bot1DisplayName}'s physical appearance...` },
                        { id: 'bot1Personality', value: bot1Data.personality || '', placeholder: `Describe ${bot1DisplayName}'s overall personality...` },
                        { id: 'bot1Likes', value: bot1Data.likes || '', placeholder: `What does ${bot1DisplayName} like?` },
                        { id: 'bot1Dislikes', value: bot1Data.dislikes || '', placeholder: `What does ${bot1DisplayName} dislike?` },
                        { id: 'bot1Backstory', value: bot1Data.backstory || '', placeholder: `${bot1DisplayName}'s background story...` },
                        { id: 'bot1Others', value: bot1Data.others || '', placeholder: `Additional tasks or information for ${bot1DisplayName}...` }
                    ];
                    
                    bot1Elements.forEach(elem => {
                        const element = document.getElementById(elem.id);
                        if (element && elem.value !== null && elem.value !== undefined) {
                            try {
                                element.value = String(elem.value);
                                if (elem.placeholder) {
                                    element.placeholder = String(elem.placeholder);
                                }
                            } catch (error) {
                                console.log(`Error setting value for ${elem.id}:`, error.message);
                            }
                        }
                    });
                    
                    // Bot 2 AI Details (with null checks)
                    const bot2Data = data.data.bot2 || {};
                    const bot2DisplayName = bot2Data.displayName || bot2Data.name || 'AI Assistant 2';
                    
                    const bot2Elements = [
                        { id: 'bot2Age', value: bot2Data.age || '', placeholder: `${bot2DisplayName}'s age` },
                        { id: 'bot2Appearance', value: bot2Data.appearance || '', placeholder: `Describe ${bot2DisplayName}'s physical appearance...` },
                        { id: 'bot2Personality', value: bot2Data.personality || '', placeholder: `Describe ${bot2DisplayName}'s overall personality...` },
                        { id: 'bot2Likes', value: bot2Data.likes || '', placeholder: `What does ${bot2DisplayName} like?` },
                        { id: 'bot2Dislikes', value: bot2Data.dislikes || '', placeholder: `What does ${bot2DisplayName} dislike?` },
                        { id: 'bot2Backstory', value: bot2Data.backstory || '', placeholder: `${bot2DisplayName}'s background story...` },
                        { id: 'bot2Others', value: bot2Data.others || '', placeholder: `Additional tasks or information for ${bot2DisplayName}...` }
                    ];
                    
                    bot2Elements.forEach(elem => {
                        const element = document.getElementById(elem.id);
                        if (element && elem.value !== null && elem.value !== undefined) {
                            try {
                                element.value = String(elem.value);
                                if (elem.placeholder) {
                                    element.placeholder = String(elem.placeholder);
                                }
                            } catch (error) {
                                console.log(`Error setting value for ${elem.id}:`, error.message);
                            }
                        }
                    });
                    
                    // Bot 1 General Settings (with null checks)
                    const bot1GeneralElements = [
                        { id: 'bot1Name', value: bot1Data.name || '' },
                        { id: 'bot1Description', value: bot1Data.description || '' },
                        { id: 'bot1Status', value: bot1Data.status || 'online' },
                        { id: 'bot1ActivityType', value: bot1Data.activityType || 'playing' },
                        { id: 'bot1ActivityText', value: bot1Data.activityText || '' }
                    ];
                    
                    bot1GeneralElements.forEach(elem => {
                        const element = document.getElementById(elem.id);
                        if (element && elem.value !== null && elem.value !== undefined) {
                            try {
                                element.value = String(elem.value);
                            } catch (error) {
                                console.log(`Error setting value for ${elem.id}:`, error.message);
                            }
                        }
                    });
                    
                    // Bot 2 General Settings (with null checks)
                    const bot2GeneralElements = [
                        { id: 'bot2Name', value: bot2Data.name || '' },
                        { id: 'bot2Description', value: bot2Data.description || '' },
                        { id: 'bot2Status', value: bot2Data.status || 'online' },
                        { id: 'bot2ActivityType', value: bot2Data.activityType || 'playing' },
                        { id: 'bot2ActivityText', value: bot2Data.activityText || '' }
                    ];
                    
                    bot2GeneralElements.forEach(elem => {
                        const element = document.getElementById(elem.id);
                        if (element && elem.value !== null && elem.value !== undefined) {
                            try {
                                element.value = String(elem.value);
                            } catch (error) {
                                console.log(`Error setting value for ${elem.id}:`, error.message);
                            }
                        }
                    });
                    
                    // Load allowed channels for both bots (text field now)
                    populateChannelDropdowns();
                    if (bot1Data.allowedChannels) {
                        const bot1ChannelsEl = document.getElementById('bot1AllowedChannels');
                        if (bot1ChannelsEl && bot1Data.allowedChannels !== null && bot1Data.allowedChannels !== undefined) {
                            try {
                                bot1ChannelsEl.value = String(bot1Data.allowedChannels);
                            } catch (error) {
                                console.log('Error setting bot1 allowed channels:', error.message);
                            }
                        }
                    }
                    if (bot2Data.allowedChannels) {
                        const bot2ChannelsEl = document.getElementById('bot2AllowedChannels');
                        if (bot2ChannelsEl && bot2Data.allowedChannels !== null && bot2Data.allowedChannels !== undefined) {
                            try {
                                bot2ChannelsEl.value = String(bot2Data.allowedChannels);
                            } catch (error) {
                                console.log('Error setting bot2 allowed channels:', error.message);
                            }
                        }
                    }
                    
                    // Level Settings (shared) with null checks
                    const xpSettings = data.data.xpSettings || {};
                    const xpElements = [
                        { id: 'minXp', value: xpSettings.minXp || 1 },
                        { id: 'maxXp', value: xpSettings.maxXp || 15 },
                        { id: 'xpCooldown', value: Math.floor((xpSettings.xpCooldown || 60000) / 1000) },
                        { id: 'announcementChannel', value: xpSettings.announcementChannel || '' },
                        { id: 'threadXp', value: xpSettings.threadXp || 20 },
                        { id: 'streamerXp', value: xpSettings.streamerXp || 3 },
                        { id: 'minuteCheck', value: xpSettings.minuteCheck || 15 }
                    ];
                    
                    xpElements.forEach(elem => {
                        const element = document.getElementById(elem.id);
                        if (element && elem.value !== null && elem.value !== undefined) {
                            try {
                                element.value = String(elem.value);
                            } catch (error) {
                                console.log(`Error setting value for ${elem.id}:`, error.message);
                            }
                        }
                    });
                    
                    const levelAnnouncementsEl = document.getElementById('levelAnnouncements');
                    if (levelAnnouncementsEl) levelAnnouncementsEl.checked = xpSettings.levelUpAnnouncement !== false;
                    
                    // Guild data is already loaded, now load role rewards, reaction roles, welcomer settings
                    loadRoleRewards(data.data.levelRoles || []);
                    loadReactionRoles(data.data.reactionRoles || []);
                    loadWelcomerSettings(data.data);
                    loadNewWelcomerSettings(data.data.welcomer || {});
                    loadAutoRoleSettings(data.data.autoRoleSettings || {});
                    // Load forum auto-react settings using the API data
                    if (data.data.forumAutoReact) {
                        // Load checkbox
                        const forumAutoReactEl = document.getElementById('forumAutoReact');
                        if (forumAutoReactEl) {
                            forumAutoReactEl.checked = data.data.forumAutoReact.enabled || false;
                        }
                        
                        // Load selected forum
                        const forumChannelSelectEl = document.getElementById('forumChannelSelect');
                        if (forumChannelSelectEl && data.data.forumAutoReact.selectedForum !== null && data.data.forumAutoReact.selectedForum !== undefined) {
                            try {
                                forumChannelSelectEl.value = String(data.data.forumAutoReact.selectedForum);
                            } catch (error) {
                                console.log('Error setting forum channel select:', error.message);
                            }
                        }
                        
                        // Load bot emoji lists
                        const bot1EmojiEl = document.getElementById('bot1EmojiList');
                        const bot2EmojiEl = document.getElementById('bot2EmojiList');
                        if (bot1EmojiEl && data.data.forumAutoReact.bot1EmojiList !== null && data.data.forumAutoReact.bot1EmojiList !== undefined) {
                            try {
                                bot1EmojiEl.value = String(data.data.forumAutoReact.bot1EmojiList || '');
                            } catch (error) {
                                console.log('Error setting bot1 emoji list:', error.message);
                            }
                        }
                        if (bot2EmojiEl && data.data.forumAutoReact.bot2EmojiList !== null && data.data.forumAutoReact.bot2EmojiList !== undefined) {
                            try {
                                bot2EmojiEl.value = String(data.data.forumAutoReact.bot2EmojiList || '');
                            } catch (error) {
                                console.log('Error setting bot2 emoji list:', error.message);
                            }
                        }
                    }
                    
                    // Update tab labels with bot names (with null checks)
                    if (bot1Data.name) {
                        const bot1GeneralTabEl = document.getElementById('bot1GeneralTab');
                        const bot1PersonalityTabEl = document.getElementById('bot1PersonalityTab');
                        if (bot1GeneralTabEl) bot1GeneralTabEl.textContent = bot1Data.name;
                        if (bot1PersonalityTabEl) bot1PersonalityTabEl.textContent = bot1Data.name;
                    }
                    if (bot2Data.name) {
                        const bot2GeneralTabEl = document.getElementById('bot2GeneralTab');
                        const bot2PersonalityTabEl = document.getElementById('bot2PersonalityTab');
                        if (bot2GeneralTabEl) bot2GeneralTabEl.textContent = bot2Data.name;
                        if (bot2PersonalityTabEl) bot2PersonalityTabEl.textContent = bot2Data.name;
                    }
                }
                
                // Load dashboard stats
                loadDashboardStats();
                
                // Set up periodic updates (only once)
                if (!window.statsInterval) {
                    window.statsInterval = setInterval(loadDashboardStats, 30000); // Reduced from 5s to 30s
                }

                // Handle top 5 roles from the bot data response
                const top5RolesData = {
                    top1_role: data?.data?.top5Roles?.top1Role || data?.data?.top5Roles?.top1_role || '',
                    top2_role: data?.data?.top5Roles?.top2Role || data?.data?.top5Roles?.top2_role || '',
                    top3_role: data?.data?.top5Roles?.top3Role || data?.data?.top5Roles?.top3_role || '',
                    top4_role: data?.data?.top5Roles?.top4Role || data?.data?.top5Roles?.top4_role || '',
                    top5_role: data?.data?.top5Roles?.top5Role || data?.data?.top5Roles?.top5_role || ''
                };
                
                await populateTop5RolesForm(top5RolesData);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                console.error('Error details:', error.message, error.stack);
            }
        }

        // Populate Top 5 Roles form
        async function populateTop5RolesForm(top5RolesData) {
            try {
                // Make sure we have the guild data
                if (!guildData || !guildData.roles) {
                    console.error('Guild data not available');
                    return;
                }

                const roles = guildData.roles || [];
                
                // Function to populate a select with roles and set its value
                const populateAndSetValue = async (selectId, selectedRoleId) => {
                    const select = document.getElementById(selectId);
                    if (!select) return;
                    
                    // Clear existing options
                    select.innerHTML = '<option value="">None</option>';
                    
                    // Add roles as options
                    if (roles && roles.length > 0) {
                        roles.forEach(role => {
                            if (role.id && role.name) {
                                const option = document.createElement('option');
                                option.value = role.id;
                                option.textContent = role.name;
                                if (selectedRoleId && role.id === selectedRoleId) {
                                    option.selected = true;
                                }
                                select.appendChild(option);
                            }
                        });
                    }
                    
                    // Force set the value after populating
                    if (selectedRoleId) {
                        select.value = selectedRoleId;
                        // If value setting didn't work, try to find and select the option manually
                        if (select.value !== selectedRoleId) {
                            const option = Array.from(select.options).find(opt => opt.value === selectedRoleId);
                            if (option) {
                                option.selected = true;
                            }
                        }
                    }
                };

                // Populate all role selects with their corresponding values
                await populateAndSetValue('top1Role', top5RolesData.top1_role);
                await populateAndSetValue('top2Role', top5RolesData.top2_role);
                await populateAndSetValue('top3Role', top5RolesData.top3_role);
                await populateAndSetValue('top4Role', top5RolesData.top4_role);
                await populateAndSetValue('top5Role', top5RolesData.top5_role);

            } catch (error) {
                console.error('Error populating Top 5 Roles form:', error);
            }
        }

        // Load guild data for dropdowns
        async function loadGuildData() {
            try {
                const response = await fetch(`/api/guild-data?serverId=${currentServerId}`);
                const data = await response.json();
                
                if (data.success) {
                    guildData = data.data;
                    // Repopulate auto role dropdowns with loaded guild data
                    repopulateAutoRoleDropdowns();
                    // Don't initialize advanced reaction roles immediately to avoid errors
                    // It will be initialized when user navigates to reactions tab
                }
            } catch (error) {
                console.error('Error loading guild data:', error);
                console.error('Guild data error details:', error.message, error.stack);
            }
        }

        // Save Top 5 Roles Configuration
        async function saveTop5Roles() {
            try {
                const roles = {
                    top1_role: document.getElementById('top1Role').value,
                    top2_role: document.getElementById('top2Role').value,
                    top3_role: document.getElementById('top3Role').value,
                    top4_role: document.getElementById('top4Role').value,
                    top5_role: document.getElementById('top5Role').value
                };

                console.log('Saving roles:', roles);

                const response = await fetch('/api/update-top5-roles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ roles })
                });

                const data = await response.json();

                if (data.success) {
                    showPopupNotification('Top 5 roles saved successfully', true);
                } else {
                    showPopupNotification('Failed to save Top 5 roles', false);
                }
            } catch (error) {
                console.error('Error saving Top 5 roles:', error);
                showPopupNotification('Error saving Top 5 roles', false);
            }
        }

        // Load dashboard statistics
        async function loadDashboardStats() {
            try {
                const response = await fetch('/api/dashboard-stats');
                const data = await response.json();
                
                if (data.success) {
                    // Helper function to safely update element text content
                    const safeUpdateElement = (id, content) => {
                        const element = document.getElementById(id);
                        if (element) {
                            element.textContent = content;
                        }
                    };
                    
                    safeUpdateElement('cpuUsage', data.stats.cpu + '%');
                    safeUpdateElement('ramUsage', data.stats.ram + ' MB');
                    safeUpdateElement('uptime', data.stats.uptime);
                    safeUpdateElement('guildCount', data.stats.guildCount);
                    safeUpdateElement('totalUsers', data.stats.totalUsers || '--');
                    
                    // Update bot statuses
                    safeUpdateElement('bot1StatusDisplay', data.stats.bot1Status || '🔴 Offline');
                    safeUpdateElement('bot2StatusDisplay', data.stats.bot2Status || '🔴 Offline');
                    
                    // Update guild data details
                    if (data.targetGuildId && data.stats.guilds.length > 0) {
                        const targetGuild = data.stats.guilds.find(g => g.id === data.targetGuildId) || data.stats.guilds[0];
                        safeUpdateElement('guildName', targetGuild.name || '--');
                        safeUpdateElement('guildTotalMembers', targetGuild.memberCount || 'Loading...');
                        safeUpdateElement('guildHumanMembers', targetGuild.humanCount || 'Loading...');
                        safeUpdateElement('guildBotMembers', targetGuild.botCount || 'Loading...');
                        safeUpdateElement('guildPublicChannels', targetGuild.publicChannels || 'Loading...');
                        safeUpdateElement('guildPrivateChannels', targetGuild.privateChannels || 'Loading...');
                        safeUpdateElement('guildTotalChannels', targetGuild.totalChannels || 'Loading...');
                        safeUpdateElement('guildRoleCount', targetGuild.roleCount || 'Loading...');
                        safeUpdateElement('guildCreatedAt', targetGuild.createdAt || 'Loading...');
                        safeUpdateElement('guildVerificationLevel', targetGuild.verificationLevel || 'Loading...');
                        safeUpdateElement('guildBoostLevel', targetGuild.boostLevel || 'Loading...');
                        safeUpdateElement('guildBoostCount', targetGuild.boostCount || 'Loading...');

                        safeUpdateElement('guildOwner', targetGuild.owner || 'Loading...');
                        safeUpdateElement('guildDescription', targetGuild.description || 'Loading...');
                        safeUpdateElement('guildFeatures', targetGuild.features || 'Loading...');
                        safeUpdateElement('guildEmojis', targetGuild.emojis || 'Loading...');
                        safeUpdateElement('guildStickers', targetGuild.stickers || 'Loading...');
                        safeUpdateElement('guildMfaLevel', targetGuild.mfaLevel || 'Loading...');
                        safeUpdateElement('guildNsfwLevel', targetGuild.nsfwLevel || 'Loading...');
                        safeUpdateElement('guildMaxMembers', targetGuild.maxMembers || 'Loading...');
                        safeUpdateElement('guildVanityUrl', targetGuild.vanityUrl || 'Loading...');
                        safeUpdateElement('guildBanner', targetGuild.banner || 'Loading...');
                    } else {
                        safeUpdateElement('guildName', '--');
                        safeUpdateElement('guildTotalMembers', 'Loading...');
                        safeUpdateElement('guildHumanMembers', 'Loading...');
                        safeUpdateElement('guildBotMembers', 'Loading...');
                        safeUpdateElement('guildPublicChannels', 'Loading...');
                        safeUpdateElement('guildPrivateChannels', 'Loading...');
                        safeUpdateElement('guildTotalChannels', 'Loading...');
                        safeUpdateElement('guildRoleCount', 'Loading...');
                        safeUpdateElement('guildCreatedAt', 'Loading...');
                        safeUpdateElement('guildVerificationLevel', 'Loading...');
                        safeUpdateElement('guildBoostLevel', 'Loading...');
                        safeUpdateElement('guildBoostCount', 'Loading...');

                        safeUpdateElement('guildOwner', 'Loading...');
                        safeUpdateElement('guildDescription', 'Loading...');
                        safeUpdateElement('guildFeatures', 'Loading...');
                        safeUpdateElement('guildEmojis', 'Loading...');
                        safeUpdateElement('guildStickers', 'Loading...');
                        safeUpdateElement('guildMfaLevel', 'Loading...');
                        safeUpdateElement('guildNsfwLevel', 'Loading...');
                        safeUpdateElement('guildMaxMembers', 'Loading...');
                        safeUpdateElement('guildVanityUrl', 'Loading...');
                        safeUpdateElement('guildBanner', 'Loading...');
                    }

                    
                    // Update bot names in tabs and dropdowns if available
                    if (data.stats.bot1Name) {
                        document.querySelectorAll('[data-bot="bot1"]').forEach(tab => {
                            tab.textContent = data.stats.bot1Name;
                        });
                        // Update dropdown options
                        const bot1Options = document.querySelectorAll('#messageBotOption1, #embedBotOption1, #messageReactBotOption1');
                        bot1Options.forEach(option => {
                            option.textContent = data.stats.bot1Name;
                        });
                        // Update button texts
                        const bot1PersonalityBtn = document.getElementById('bot1PersonalityBtn');
                        const bot1GeneralBtn = document.getElementById('bot1GeneralBtn');
                        if (bot1PersonalityBtn) bot1PersonalityBtn.textContent = `Save ${data.stats.bot1Name} AI Details`;
                        if (bot1GeneralBtn) bot1GeneralBtn.textContent = `Save ${data.stats.bot1Name} General Settings`;
                    }
                    if (data.stats.bot2Name) {
                        document.querySelectorAll('[data-bot="bot2"]').forEach(tab => {
                            tab.textContent = data.stats.bot2Name;
                        });
                        // Update dropdown options
                        const bot2Options = document.querySelectorAll('#messageBotOption2, #embedBotOption2, #messageReactBotOption2');
                        bot2Options.forEach(option => {
                            option.textContent = data.stats.bot2Name;
                        });
                        // Update button texts
                        const bot2PersonalityBtn = document.getElementById('bot2PersonalityBtn');
                        const bot2GeneralBtn = document.getElementById('bot2GeneralBtn');
                        if (bot2PersonalityBtn) bot2PersonalityBtn.textContent = `Save ${data.stats.bot2Name} AI Details`;
                        if (bot2GeneralBtn) bot2GeneralBtn.textContent = `Save ${data.stats.bot2Name} General Settings`;
                    }
                    
                    // Update guild list
                    const guildList = document.getElementById('guildList');
                    if (guildList) {
                        guildList.innerHTML = '';
                        data.stats.guilds.forEach(guild => {
                            const guildItem = document.createElement('div');
                            guildItem.className = 'guild-item';
                            guildItem.innerHTML = `
                                <span>${guild.name}</span>
                                <span class="guild-members">${guild.memberCount} members</span>
                            `;
                            guildList.appendChild(guildItem);
                        });
                    }
                    
                    // Update activity log
                    const activityLog = document.getElementById('activityLog');
                    if (activityLog) {
                        activityLog.innerHTML = '';
                        data.stats.recentActivity.forEach(activity => {
                            const activityItem = document.createElement('div');
                            activityItem.className = 'activity-item';
                            activityItem.innerHTML = `
                                <span>${activity.message}</span>
                                <span class="activity-time">${activity.time}</span>
                            `;
                            activityLog.appendChild(activityItem);
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading dashboard stats:', error);
            }
        }

        // Load role rewards
        function loadRoleRewards(roleRewards) {
            const container = document.getElementById('roleRewards');
            container.innerHTML = '';
            roleRewardCounter = 0;
            
            roleRewards.forEach(reward => {
                addRoleReward(reward.level, reward.role_id || reward.roleId);
            });
            
            if (roleRewards.length === 0) {
                addRoleReward();
            }
        }

        // Add role reward
        function addRoleReward(level = '', roleId = '') {
            const container = document.getElementById('roleRewards');
            const roleItem = document.createElement('div');
            roleItem.className = 'role-item';
            roleItem.id = `role-${roleRewardCounter}`;
            
            let rolesOptions = '<option value="">Select a role...</option>';
            if (guildData && guildData.roles) {
                guildData.roles.forEach(role => {
                    const selected = role.id === roleId ? 'selected' : '';
                    rolesOptions += `<option value="${role.id}" ${selected}>@${role.name}</option>`;
                });
            }
            
            roleItem.innerHTML = `
                <input type="number" placeholder="Level" value="${level}" min="1" class="form-input role-level" style="width: 100px;">
                <select class="form-select role-select" style="flex: 1;">
                    ${rolesOptions}
                </select>
                <button type="button" onclick="removeRoleReward('role-${roleRewardCounter}')" class="trendy-btn trendy-btn-danger" style="padding: 8px 15px; font-size: 12px; border-radius: 6px;">Remove</button>
            `;
            
            container.appendChild(roleItem);
            roleRewardCounter++;
        }

        // Remove role reward
        function removeRoleReward(id) {
            document.getElementById(id).remove();
        }

        // Populate channel dropdowns
        function populateChannelDropdowns(selectedChannels = []) {
            const allowedChannelsSelect = document.getElementById('allowedChannels');
            const announcementChannelSelect = document.getElementById('announcementChannel');
            
            if (guildData && guildData.channels) {
                // Clear existing options
                allowedChannelsSelect.innerHTML = '';
                
                guildData.channels.forEach(channel => {
                    // Include text, voice, stage, and announcement channels (exclude forum)
                    if (channel.type !== 15) { // Exclude forum channels
                        const option = document.createElement('option');
                        option.value = channel.id;
                        
                        // Add appropriate prefix based on channel type
                        let prefix = '#';
                        if (channel.type === 2) prefix = '🔊'; // Voice channels
                        else if (channel.type === 13) prefix = '🎤'; // Stage channels
                        else if (channel.type === 5) prefix = '📢'; // Announcement channels
                        
                        option.textContent = `${prefix}${channel.name}`;
                        if (selectedChannels.includes(channel.id)) {
                            option.selected = true;
                        }
                        allowedChannelsSelect.appendChild(option);
                    }
                });
            }
        }

        // Advanced Reaction Roles functions
        let currentReactionSet = {
            messageId: '',
            setMode: 'multiple',
            pairs: []
        };

        // Initialize advanced reaction roles system
        function initAdvancedReactionRoles() {
            try {
                // Check if we're in the reactions tab
                const reactionsTab = document.getElementById('reactions');
                if (!reactionsTab || !reactionsTab.classList.contains('active')) {
                    // Not in reactions tab, skip initialization
                    return;
                }
                
                // Check if advanced reaction roles elements exist
                const newRoleSelect = document.getElementById('newRoleSelect');
                const existingSets = document.getElementById('existingSets');
                
                if (!newRoleSelect || !existingSets) {
                    // Elements don't exist, skip initialization
                    return;
                }
                
                // Wait for guild data to be loaded
                if (!guildData || !guildData.roles) {
                    setTimeout(initAdvancedReactionRoles, 500);
                    return;
                }
                
                // Populate role dropdown for emoji/role pairs
                populateRoleDropdown();
                
                // Auto-load existing sets immediately
                loadReactionRoleSets();
                
                // Set up event listeners
                if (typeof setupReactionRoleEventListeners === 'function') {
                    setupReactionRoleEventListeners();
                }
            } catch (error) {
                // Silent error handling to prevent console spam
            }
        }

        function populateRoleDropdown() {
            const roleSelect = document.getElementById('newRoleSelect');
            if (!roleSelect) {
                console.log('newRoleSelect element not found - may not be in reactions tab');
                return;
            }
            
            if (!guildData || !guildData.roles || guildData.roles.length === 0) {
                console.log('Guild data not available, roles count:', guildData?.roles?.length || 0);
                return;
            }
            
            console.log('Populating role dropdown with', guildData.roles.length, 'roles');
            
            // Remove all existing options first
            while (roleSelect.firstChild) {
                roleSelect.removeChild(roleSelect.firstChild);
            }
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a role...';
            roleSelect.appendChild(defaultOption);
            
            // Add each role
            guildData.roles.forEach((role, index) => {
                if (role && role.id && role.name) {
                    const option = document.createElement('option');
                    option.value = role.id;
                    option.textContent = `@${role.name}`;
                    roleSelect.appendChild(option);
                    console.log(`Added role: ${role.name}`);
                }
            });
            
            console.log('Role dropdown populated successfully with', roleSelect.children.length - 1, 'roles');
        }
        


        function setupReactionRoleEventListeners() {
            // Create set form
            const createSetForm = document.getElementById('createSetForm');
            if (createSetForm) {
                createSetForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    createNewReactionSet();
                });
            }

            // Add emoji/role pair form
            const addPairForm = document.getElementById('addEmojiRoleForm');
            if (addPairForm) {
                addPairForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    addEmojiRolePair();
                });
            }
        }

        async function createNewReactionSet() {
            const setName = document.getElementById('newSetName').value.trim();
            const messageId = document.getElementById('newSetMessageId').value.trim();
            const setMode = document.getElementById('newSetMode').value;
            const createBtn = document.getElementById('createSetBtn');
            const resultDiv = document.getElementById('messageValidationResult');

            if (!setName) {
                showPopupNotification('Please enter a set name', false);
                return;
            }

            if (!messageId) {
                showPopupNotification('Please enter a message ID', false);
                return;
            }

            // Show validation progress
            createBtn.disabled = true;
            createBtn.textContent = 'Validating message...';
            resultDiv.style.display = 'none';

            try {
                // Validate message ID first
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout

                const response = await fetch('/api/validate-message-id', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        messageId: messageId,
                        serverId: currentServerId || 'default'
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const responseText = await response.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse response as JSON:', responseText);
                    throw new Error('Server returned invalid response format');
                }

                if (!result.success) {
                    resultDiv.innerHTML = `
                        <div style="padding: 8px 12px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 6px; color: #ef4444; font-size: 14px;">
                            ${result.message || 'Message not found'}
                        </div>
                    `;
                    resultDiv.style.display = 'block';
                    return;
                }

                // Show validation success
                resultDiv.innerHTML = `
                    <div style="padding: 8px 12px; background: rgba(34, 197, 94, 0.2); border: 1px solid #3b82f6; border-radius: 6px; color: #3b82f6; font-size: 14px;">
                        ✅ Message found! "${result.messageContent}" in #${result.channelName}
                    </div>
                `;
                resultDiv.style.display = 'block';

                // Continue with set creation
                createBtn.textContent = 'Creating set...';

                // Wait a moment to show the success message
                await new Promise(resolve => setTimeout(resolve, 500));

                // Initialize new set
                currentReactionSet = {
                    setName: setName,
                    messageId: messageId,
                    setMode: setMode,
                    pairs: []
                };

                // Show emoji/role builder
                document.getElementById('newSetCreation').style.display = 'none';
                document.getElementById('emojiRoleBuilder').style.display = 'block';

                // Update current set info
                const setInfo = document.getElementById('currentSetInfo');
                setInfo.innerHTML = `
                    <strong>Set Name:</strong> ${setName}<br>
                    <strong>Message ID:</strong> ${messageId}<br>
                    <strong>Selection Mode:</strong> ${setMode}
                `;

                // Reset form inputs
                document.getElementById('newEmojiInput').value = '';
                document.getElementById('newRoleSelect').value = '';
                document.getElementById('pairsList').innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); font-style: italic; margin: 0;">No pairs added yet</p>';
                document.getElementById('applySetBtn').disabled = true;

                showPopupNotification('Message validated! Now add emoji/role pairs.', true);

            } catch (error) {
                console.error('Error validating message ID:', error);
                let errorMessage = 'Network error occurred';
                
                if (error.name === 'AbortError') {
                    errorMessage = 'Request timed out (took too long)';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                resultDiv.innerHTML = `
                    <div style="padding: 8px 12px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 6px; color: #ef4444; font-size: 14px;">
                        Error checking message: ${errorMessage}
                    </div>
                `;
                resultDiv.style.display = 'block';
                showPopupNotification('Failed to validate message ID. Please try again.', false);
            } finally {
                createBtn.disabled = false;
                createBtn.textContent = 'Create Set & Continue';
            }
        }

        function addEmojiRolePair() {
            const emoji = document.getElementById('newEmojiInput').value.trim();
            const roleId = document.getElementById('newRoleSelect').value;

            if (!emoji || !roleId) {
                showPopupNotification('Please enter both emoji and role', false);
                return;
            }

            // Check if emoji already exists in current set
            if (currentReactionSet.pairs.some(pair => pair.emoji === emoji)) {
                showPopupNotification('This emoji is already used in this set', false);
                return;
            }

            // Get role name for display
            const roleOption = document.querySelector(`#newRoleSelect option[value="${roleId}"]`);
            const roleName = roleOption ? roleOption.textContent : 'Unknown Role';

            // Add pair to current set
            currentReactionSet.pairs.push({
                emoji: emoji,
                roleId: roleId,
                roleName: roleName
            });

            // Update pairs display
            updatePairsDisplay();

            // Clear inputs
            document.getElementById('newEmojiInput').value = '';
            document.getElementById('newRoleSelect').value = '';

            // Enable apply button if pairs exist
            const applyBtn = document.getElementById('applySetBtn');
            applyBtn.disabled = currentReactionSet.pairs.length === 0;

            showPopupNotification(`Added ${emoji} → ${roleName}`, true);
        }

        function updatePairsDisplay() {
            const pairsList = document.getElementById('pairsList');
            
            if (currentReactionSet.pairs.length === 0) {
                if (pairsList) {
                    pairsList.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); font-style: italic; margin: 0;">No pairs added yet</p>';
                }
                return;
            }

            let pairsHTML = '';
            currentReactionSet.pairs.forEach((pair, index) => {
                pairsHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; margin-bottom: 5px;">
                        <span>${pair.emoji} → ${pair.roleName}</span>
                        <button type="button" onclick="removePair(${index})" class="trendy-btn-sm trendy-btn-danger">Remove</button>
                    </div>
                `;
            });

            if (pairsList) {
                pairsList.innerHTML = pairsHTML;
            }
        }

        function removePair(index) {
            currentReactionSet.pairs.splice(index, 1);
            updatePairsDisplay();
            
            // Disable apply button if no pairs
            const applyBtn = document.getElementById('applySetBtn');
            applyBtn.disabled = currentReactionSet.pairs.length === 0;
        }

        function cancelSetCreation() {
            // Reset and hide builder
            currentReactionSet = { setName: '', messageId: '', setMode: 'multiple', pairs: [] };
            document.getElementById('newSetCreation').style.display = 'block';
            document.getElementById('emojiRoleBuilder').style.display = 'none';
            
            // Clear form
            document.getElementById('newSetName').value = '';
            document.getElementById('newSetMessageId').value = '';
            document.getElementById('newSetMode').value = 'multiple';
            
            // Clear emoji pairs display
            updatePairsDisplay();
            
            // Clear current set info
            const setInfo = document.getElementById('currentSetInfo');
            if (setInfo) {
                setInfo.innerHTML = '';
            }
        }

        async function applyReactionRoleSet() {
            try {
                // Prevent any form submission behavior
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                if (!currentReactionSet || currentReactionSet.pairs.length === 0) {
                    showPopupNotification('Please add at least one emoji/role pair', false);
                    return false;
                }

                if (!currentReactionSet.messageId || !currentReactionSet.messageId.trim()) {
                    showPopupNotification('Please enter a valid message ID', false);
                    return false;
                }

                console.log('Creating reaction role set:', currentReactionSet);
                showProcessing();

                const response = await fetch('/api/reaction-roles/create-set', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        setName: currentReactionSet.setName,
                        messageId: currentReactionSet.messageId,
                        setMode: currentReactionSet.setMode,
                        pairs: currentReactionSet.pairs,
                        serverId: currentServerId
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                console.log('Server response:', result);
                
                showPopupNotification(result.message, result.success);

                if (result.success) {
                    // Reset form and refresh sets
                    cancelSetCreation();
                    setTimeout(() => refreshReactionSets(), 500);
                }
            } catch (error) {
                console.error('Error creating reaction role set:', error);
                showPopupNotification(`Error: ${error.message}`, false);
            } finally {
                hideProcessing();
            }

            return false; // Prevent any form submission
        }

        function loadReactionRoleSets() {
            const existingSetsContainer = document.getElementById('existingSets');
            if (existingSetsContainer) {
                try {
                    existingSetsContainer.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); font-style: italic; margin: 0;">Loading sets...</p>';
                    refreshReactionSets();
                } catch (error) {
                    console.log('Error setting innerHTML for existingSets:', error.message);
                }
            } else {
                console.log('existingSets container not found - skipping reaction role sets loading');
            }
        }

        async function refreshReactionSets() {
            try {
                const existingSetsContainer = document.getElementById('existingSets');
                if (!existingSetsContainer) {
                    return;
                }

                // Show loading state
                existingSetsContainer.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6);">Loading and validating sets...</p>';

                const response = await fetch('/api/reaction-roles/get-sets');
                const result = await response.json();

                if (result.success) {
                    displayExistingSets(result.sets);
                    
                    // Check if any sets were found
                    if (result.sets.length === 0) {
                        existingSetsContainer.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); font-style: italic;">No reaction role sets found or all sets have been cleaned up due to missing messages</p>';
                    }
                } else {
                    if (existingSetsContainer) {
                        try {
                            existingSetsContainer.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6);">No reaction role sets found</p>';
                        } catch (error) {
                            console.log('Error setting innerHTML (no sets found):', error.message);
                        }
                    }
                }
            } catch (error) {
                const existingSetsContainer = document.getElementById('existingSets');
                if (existingSetsContainer) {
                    try {
                        existingSetsContainer.innerHTML = '<p style="color: #ef4444;">Error loading sets</p>';
                    } catch (innerError) {
                        console.log('Error setting innerHTML (error message):', innerError.message);
                    }
                }
            }
        }

        function displayExistingSets(sets) {
            const container = document.getElementById('existingSets');
            if (!container) {
                return;
            }
            
            if (!sets || sets.length === 0) {
                if (container) {
                    try {
                        container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); font-style: italic;">No reaction role sets configured yet</p>';
                    } catch (error) {
                        console.log('Error setting innerHTML (no sets):', error.message);
                    }
                }
                return;
            }

            let setsHTML = '';
            const groupedSets = {};

            // Group by set_id
            sets.forEach(set => {
                if (!groupedSets[set.set_id]) {
                    groupedSets[set.set_id] = {
                        setName: set.set_name || 'Unnamed Set',
                        messageId: set.message_id,
                        setMode: set.set_mode,
                        reactions: []
                    };
                }
                groupedSets[set.set_id].reactions.push(set);
            });

            Object.keys(groupedSets).forEach(setId => {
                const setData = groupedSets[setId];
                
                // Create reaction pairs display with proper role names
                let reactionsHTML = '';
                setData.reactions.forEach(reaction => {
                    // Get role name from guild data
                    let roleName = 'Unknown Role';
                    if (guildData && guildData.roles) {
                        const roleData = guildData.roles.find(r => r.id === reaction.role_id);
                        if (roleData) {
                            roleName = roleData.name;
                        }
                    }
                    
                    reactionsHTML += `
                        <div style="background: rgba(124, 58, 237, 0.2); padding: 6px 10px; border-radius: 4px; font-size: 12px; margin: 2px;">
                            <span style="font-weight: bold;">${reaction.emoji_id}</span> → <span style="color: #3b82f6;">@${roleName}</span>
                        </div>
                    `;
                });
                
                setsHTML += `
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h5 style="margin: 0; color: #3b82f6;">${setData.setName}</h5>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="reapplyReactionSet('${setId}')" class="trendy-btn-sm trendy-btn-primary">Reapply Set</button>
                                <button onclick="deleteReactionSet('${setId}')" class="trendy-btn-sm trendy-btn-danger">Delete Set</button>
                            </div>
                        </div>
                        <p style="margin: 5px 0; font-size: 14px;">
                            <strong>Set ID:</strong> ${setId}<br>
                            <strong>Message ID:</strong> ${setData.messageId}<br>
                            <strong>Mode:</strong> ${setData.setMode === 'single' ? 'Single Selection' : 'Multiple Selection'}
                        </p>
                        <div style="margin-top: 10px;">
                            <strong>Reaction Role Mappings:</strong>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 5px;">
                                ${reactionsHTML}
                            </div>
                        </div>
                    </div>
                `;
            });

            if (container) {
                try {
                    container.innerHTML = setsHTML;
                } catch (error) {
                    console.log('Error setting innerHTML in displayExistingSets:', error.message);
                }
            }
        }

        async function reapplyReactionSet(setId) {
            if (!confirm(`Are you sure you want to reapply reactions for set "${setId}"? This will add missing emojis to the Discord message.`)) {
                return;
            }

            showProcessing();

            try {
                const response = await fetch('/api/reaction-roles/reapply-set', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ setId })
                });

                const result = await response.json();
                showPopupNotification(result.message, result.success);
            } catch (error) {
                showPopupNotification('Error reapplying reaction role set', false);
            }

            hideProcessing();
        }

        async function deleteReactionSet(setId) {
            if (!confirm(`Are you sure you want to delete reaction role set "${setId}"?`)) {
                return;
            }

            showProcessing();

            try {
                const response = await fetch('/api/reaction-roles/delete-set', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ setId })
                });

                const result = await response.json();
                showPopupNotification(result.message, result.success);

                if (result.success) {
                    refreshReactionSets();
                }
            } catch (error) {
                showPopupNotification('Error deleting reaction role set', false);
            }

            hideProcessing();
        }

        // Legacy function for backwards compatibility - replaced by advanced reaction roles
        function loadReactionRoles(reactionRoles) {
            // No longer used - advanced reaction roles system handles this
            // Legacy loadReactionRoles called - using advanced system instead
            
            // Prevent errors by ensuring all reaction role elements exist
            const reactionContainer = document.getElementById('reactionRoles');
            if (reactionContainer && !reactionContainer.innerHTML.trim()) {
                reactionContainer.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6);">Legacy reaction roles disabled - use Advanced Reaction Roles instead</p>';
            }
        }

        // Load welcomer settings
        function loadWelcomerSettings(data) {
            const welcomer = data.welcomer || {};
            
            if (document.getElementById('welcomerEnabled')) {
                document.getElementById('welcomerEnabled').checked = welcomer.enabled || false;
            }
            if (document.getElementById('welcomeChannel')) {
                document.getElementById('welcomeChannel').value = welcomer.channelId || '';
            }
            if (document.getElementById('useEmbed')) {
                document.getElementById('useEmbed').value = welcomer.useEmbed ? 'true' : 'false';
            }
            if (document.getElementById('welcomeMessage')) {
                document.getElementById('welcomeMessage').value = welcomer.message || 'Welcome {user} to the server!';
            }
            if (document.getElementById('embedTitle')) {
                document.getElementById('embedTitle').value = welcomer.embedTitle || 'Welcome!';
            }
            if (document.getElementById('embedDescription')) {
                document.getElementById('embedDescription').value = welcomer.embedDescription || 'Welcome {user} to our server!';
            }
            if (document.getElementById('embedColor')) {
                document.getElementById('embedColor').value = welcomer.embedColor || '#00ff00';
            }
            
            // Update visibility based on useEmbed setting
            toggleEmbedSection();
        }

        // Load forum auto-react settings
        function loadForumAutoReactSettings(data) {
            try {
                const othersData = data.others || {};
                
                // Load auto react checkbox
                const forumAutoReactEl = document.getElementById('forumAutoReact');
                if (forumAutoReactEl) {
                    forumAutoReactEl.checked = othersData.forum_auto_react_enabled || false;
                }
                
                // Load forum channel selection and emoji lists
                if (othersData.forum_channels) {
                    let forumChannelsData = {};
                    try {
                        forumChannelsData = typeof othersData.forum_channels === 'string' 
                            ? JSON.parse(othersData.forum_channels) 
                            : othersData.forum_channels;
                    } catch (e) {
                        console.log('Error parsing forum_channels data:', e);
                    }
                    
                    // Set selected forum channel
                    const forumChannelSelectEl = document.getElementById('forumChannelSelect');
                    if (forumChannelSelectEl && forumChannelsData.selectedForum) {
                        forumChannelSelectEl.value = forumChannelsData.selectedForum;
                    }
                    
                    // Set bot emoji lists
                    const bot1EmojiEl = document.getElementById('bot1EmojiList');
                    const bot2EmojiEl = document.getElementById('bot2EmojiList');
                    if (bot1EmojiEl && forumChannelsData.bot1EmojiList) {
                        bot1EmojiEl.value = forumChannelsData.bot1EmojiList;
                    }
                    if (bot2EmojiEl && forumChannelsData.bot2EmojiList) {
                        bot2EmojiEl.value = forumChannelsData.bot2EmojiList;
                    }
                }
                
                console.log('Forum auto-react settings loaded successfully');
            } catch (error) {
                console.error('Error loading forum auto-react settings:', error);
            }
        }


        // Setup event listeners when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            setupEventListeners();
        });

        function setupEventListeners() {
            // Setup welcome toggle functionality
            setupWelcomeToggle();
            
            // Form submissions with processing overlay and popup notifications
            
            // Universal form submission handler
            function handleFormSubmission(formId, endpoint, fieldMapping, errorMessage) {
                const form = document.getElementById(formId);
                if (!form) return;
                
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    
                    const formData = {};
                    Object.keys(fieldMapping).forEach(key => {
                        const element = document.getElementById(fieldMapping[key]);
                        formData[key] = element ? element.value : '';
                    });
                    formData.serverId = currentServerId;
                    
                    try {
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(formData)
                        });
                        
                        const result = await response.json();
                        showPopupNotification(result.message, result.success);
                    } catch (error) {
                        showPopupNotification(errorMessage, false);
                    } finally {
                        hideProcessing();
                    }
                });
            }
            
            // Bot 1 AI Details Form
            handleFormSubmission('bot1PersonalityForm', '/api/update-bot1-personality', {
                age: 'bot1Age',
                appearance: 'bot1Appearance',
                personality: 'bot1Personality',
                likes: 'bot1Likes',
                dislikes: 'bot1Dislikes',
                backstory: 'bot1Backstory',
                others: 'bot1Others'
            }, 'Error updating Bot 1 AI details');

            // Bot 2 AI Details Form
            handleFormSubmission('bot2PersonalityForm', '/api/update-bot2-personality', {
                age: 'bot2Age',
                appearance: 'bot2Appearance',
                personality: 'bot2Personality',
                likes: 'bot2Likes',
                dislikes: 'bot2Dislikes',
                backstory: 'bot2Backstory',
                others: 'bot2Others'
            }, 'Error updating Bot 2 AI details');

            // Bot 1 General Form
            const bot1GeneralForm = document.getElementById('bot1GeneralForm');
            if (bot1GeneralForm) {
                bot1GeneralForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    
                    const formData = new FormData();
                    formData.append('name', document.getElementById('bot1Name').value);
                    formData.append('description', document.getElementById('bot1Description').value);
                    formData.append('status', document.getElementById('bot1Status').value);
                    formData.append('activityType', document.getElementById('bot1ActivityType').value);
                    formData.append('activityText', document.getElementById('bot1ActivityText').value);
                    formData.append('allowedChannels', document.getElementById('bot1AllowedChannels').value);
                    formData.append('serverId', currentServerId);
                    
                    const avatarFile = document.getElementById('bot1Avatar').files[0];
                    if (avatarFile) {
                        formData.append('avatar', avatarFile);
                    }
                    
                    try {
                        const response = await fetch('/api/update-bot1-general', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const result = await response.json();
                        showPopupNotification(result.message, result.success);
                        
                        // Reload dashboard data to reflect changes
                        if (result.success) {
                            loadDashboardData();
                        }
                    } catch (error) {
                        showPopupNotification('Error updating Bot 1 general settings', false);
                    }
                    hideProcessing();
                });
            }

            // Bot 2 General Form
            const bot2GeneralForm = document.getElementById('bot2GeneralForm');
            if (bot2GeneralForm) {
                bot2GeneralForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    
                    const formData = new FormData();
                    formData.append('name', document.getElementById('bot2Name').value);
                    formData.append('description', document.getElementById('bot2Description').value);
                    formData.append('status', document.getElementById('bot2Status').value);
                    formData.append('activityType', document.getElementById('bot2ActivityType').value);
                    formData.append('activityText', document.getElementById('bot2ActivityText').value);
                    formData.append('allowedChannels', document.getElementById('bot2AllowedChannels').value);
                    formData.append('serverId', currentServerId);
                    
                    const avatarFile = document.getElementById('bot2Avatar').files[0];
                    if (avatarFile) {
                        formData.append('avatar', avatarFile);
                    }
                    
                    try {
                        const response = await fetch('/api/update-bot2-general', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const result = await response.json();
                        showPopupNotification(result.message, result.success);
                        
                        // Reload dashboard data to reflect changes
                        if (result.success) {
                            loadDashboardData();
                        }
                    } catch (error) {
                        showPopupNotification('Error updating Bot 2 general settings', false);
                    }
                    hideProcessing();
                });
            }

            // XP Settings form
            const xpForm = document.getElementById('xpForm');
            if (xpForm) {
                xpForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    
                    const formData = {
                        minXp: parseInt(document.getElementById('minXp').value),
                        maxXp: parseInt(document.getElementById('maxXp').value),
                        xpCooldown: parseInt(document.getElementById('xpCooldown').value) * 1000, // Convert seconds to milliseconds
                        serverId: currentServerId
                    };
                    
                    try {
                        const response = await fetch('/api/update-xp-settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(formData)
                        });
                        
                        const result = await response.json();
                        showPopupNotification(result.message, result.success);
                    } catch (error) {
                        showPopupNotification('Error updating XP settings', false);
                    }
                    hideProcessing();
                });
            }

            // Announcement Settings form
            const announcementForm = document.getElementById('announcementForm');
            if (announcementForm) {
                announcementForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    
                    const formData = {
                        levelAnnouncements: document.getElementById('levelAnnouncements').checked,
                        announcementChannel: document.getElementById('announcementChannel').value,
                        serverId: currentServerId
                    };
                    
                    try {
                        const response = await fetch('/api/update-announcement-settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(formData)
                        });
                        
                        const result = await response.json();
                        showPopupNotification(result.message, result.success);
                    } catch (error) {
                        showPopupNotification('Error updating announcement settings', false);
                    }
                    hideProcessing();
                });
            }

            // Thread XP form
            const threadXpForm = document.getElementById('threadXpForm');
            if (threadXpForm) {
                threadXpForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    
                    const formData = {
                        threadXp: parseInt(document.getElementById('threadXp').value),
                        serverId: currentServerId
                    };
                    
                    try {
                        const response = await fetch('/api/update-thread-xp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(formData)
                        });
                        
                        const result = await response.json();
                        showPopupNotification(result.message, result.success);
                    } catch (error) {
                        showPopupNotification('Error updating thread XP settings', false);
                    }
                    hideProcessing();
                });
            }

            // Streaming Settings form
            const streamingSettingsForm = document.getElementById('streamingSettingsForm');
            if (streamingSettingsForm) {
                streamingSettingsForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    
                    const streamerXp = parseInt(document.getElementById('streamerXp').value);
                    const minuteCheck = parseInt(document.getElementById('minuteCheck').value);
                    
                    try {
                        // Update both settings in parallel
                        const [streamerResponse, minuteResponse] = await Promise.all([
                            fetch('/api/update-streamer-xp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    streamerXp,
                                    serverId: currentServerId
                                })
                            }),
                            fetch('/api/update-minute-check', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    minuteCheck,
                                    serverId: currentServerId
                                })
                            })
                        ]);
                        
                        const [streamerResult, minuteResult] = await Promise.all([
                            streamerResponse.json(),
                            minuteResponse.json()
                        ]);
                        
                        if (streamerResult.success && minuteResult.success) {
                            showPopupNotification('Streaming settings updated successfully', true);
                            // Update bot's streaming check interval
                            if (typeof global !== 'undefined' && global.updateStreamingXPInterval) {
                                global.updateStreamingXPInterval();
                            }
                        } else {
                            showPopupNotification('Error updating some streaming settings', false);
                        }
                    } catch (error) {
                        showPopupNotification('Error updating streaming settings', false);
                    }
                    hideProcessing();
                });
            }

            // Bot Interaction XP form
            const botInteractionForm = document.getElementById('botInteractionForm');
            if (botInteractionForm) {
                botInteractionForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    
                    const slashXp = parseInt(document.getElementById('slashXp').value);
                    const mentionXp = parseInt(document.getElementById('mentionXp').value);
                    
                    try {
                        // Update both settings in parallel
                        const [slashResponse, mentionResponse] = await Promise.all([
                            fetch('/api/update-slash-xp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ slashXp })
                            }),
                            fetch('/api/update-mention-xp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ mentionXp })
                            })
                        ]);
                        
                        const [slashResult, mentionResult] = await Promise.all([
                            slashResponse.json(),
                            mentionResponse.json()
                        ]);
                        
                        if (slashResult.success && mentionResult.success) {
                            showPopupNotification('Bot interaction XP settings updated successfully', true);
                        } else {
                            showPopupNotification('Error updating some bot interaction XP settings', false);
                        }
                    } catch (error) {
                        showPopupNotification('Error updating bot interaction XP settings', false);
                    }
                    hideProcessing();
                });
            }

            // Role Rewards form
            const roleRewardsForm = document.getElementById('roleRewardsForm');
            if (roleRewardsForm) {
                roleRewardsForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    
                    const roleRewards = [];
                    document.querySelectorAll('.role-item').forEach(item => {
                        const levelInput = item.querySelector('.role-level');
                        const roleSelect = item.querySelector('.role-select');
                        
                        if (levelInput && roleSelect && levelInput.value && roleSelect.value) {
                            roleRewards.push({ 
                                level: parseInt(levelInput.value), 
                                roleId: roleSelect.value 
                            });
                        }
                    });
                    
                    const formData = {
                        roleRewards,
                        serverId: currentServerId || '1206274128588578826'
                    };
                    
                    try {
                        const response = await fetch('/api/update-role-rewards', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(formData)
                        });
                        
                        const result = await response.json();
                        showPopupNotification(result.message, result.success);
                    } catch (error) {
                        console.error('Role rewards error:', error);
                        console.error('Error details:', error.message);
                        showPopupNotification('Error updating role rewards: ' + error.message, false);
                    } finally {
                        hideProcessing();
                    }
                });
            }

            // Reaction form
            const reactionsForm = document.getElementById('reactionsForm');
            if (reactionsForm) {
                reactionsForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    
                    const reactionRoles = [];
                    document.querySelectorAll('.reaction-item').forEach(item => {
                        const messageId = item.querySelector('input[placeholder*="Message ID"]').value;
                        const emoji = item.querySelector('input[placeholder*="emoji"]').value;
                        const roles = Array.from(item.querySelectorAll('select option:checked')).map(opt => opt.value);
                        
                        if (messageId && emoji && roles.length > 0) {
                            reactionRoles.push({ messageId, emoji, roles });
                        }
                    });
                    
                    const formData = {
                        reactionRoles,
                        reactionRoleMode: document.getElementById('reactionRoleMode').value,
                        emojiMode: document.getElementById('emojiMode').value,
                        serverId: currentServerId
                    };
                    
                    try {
                        const response = await fetch('/api/update-reactions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(formData)
                        });
                        
                        const result = await response.json();
                        showPopupNotification(result.message, result.success);
                    } catch (error) {
                        showPopupNotification('Error updating reaction roles', false);
                    }
                    hideProcessing();
                });
            }

            // Top 5 Auto Role Configuration form
            const top5RolesForm = document.getElementById('top5RolesForm');
            if (top5RolesForm) {
                top5RolesForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showProcessing();
                    const roles = {
                        top1_role: document.getElementById('top1Role').value || '',
                        top2_role: document.getElementById('top2Role').value || '',
                        top3_role: document.getElementById('top3Role').value || '',
                        top4_role: document.getElementById('top4Role').value || '',
                        top5_role: document.getElementById('top5Role').value || ''
                    };
                    const formData = {
                        roles,
                        serverId: currentServerId
                    };
                    try {
                        const response = await fetch('/api/update-top5-roles', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(formData)
                        });
                        const result = await response.json();
                        showPopupNotification(result.message, result.success);
                    } catch (error) {
                        showPopupNotification('Error updating Top 5 roles configuration', false);
                    } finally {
                        hideProcessing();
                    }
                });
            }
        }

        // Welcomer settings functions
        function loadWelcomerSettings(data) {
            if (data.welcomer) {
                const welcomerEnabledEl = document.getElementById('welcomerEnabled');
                const welcomeChannelEl = document.getElementById('welcomeChannel');
                const useEmbedEl = document.getElementById('useEmbed');
                const welcomeMessageEl = document.getElementById('welcomeMessage');
                const embedTitleEl = document.getElementById('embedTitle');
                const embedDescriptionEl = document.getElementById('embedDescription');
                const embedColorEl = document.getElementById('embedColor');
                
                if (welcomerEnabledEl) welcomerEnabledEl.checked = data.welcomer.enabled || false;
                if (welcomeChannelEl) welcomeChannelEl.value = data.welcomer.channelId || '';
                if (useEmbedEl) useEmbedEl.value = data.welcomer.useEmbed ? 'true' : 'false';
                if (welcomeMessageEl) welcomeMessageEl.value = data.welcomer.message || 'Welcome {user} to the server!';
                if (embedTitleEl) embedTitleEl.value = data.welcomer.embedTitle || 'Welcome!';
                if (embedDescriptionEl) embedDescriptionEl.value = data.welcomer.embedDescription || 'Welcome {user} to our server!';
                if (embedColorEl) embedColorEl.value = data.welcomer.embedColor || '#00ff00';
                
                toggleEmbedSection();
            }
        }

        function toggleEmbedSection() {
            const useEmbedEl = document.getElementById('useEmbed');
            const textMessageSectionEl = document.getElementById('textMessageSection');
            const embedSectionEl = document.getElementById('embedSection');
            
            if (useEmbedEl && textMessageSectionEl && embedSectionEl) {
                const useEmbed = useEmbedEl.checked;
                textMessageSectionEl.style.display = useEmbed ? 'none' : 'block';
                embedSectionEl.style.display = useEmbed ? 'block' : 'none';
            }
        }

        // Custom rank card settings functions
        // Forum auto-react settings functions
        function loadForumAutoReactSettings(data) {
            if (data.forumAutoReact) {
                const forumAutoReactEl = document.getElementById('forumAutoReact');
                const forumChannelSelectEl = document.getElementById('forumChannelSelect');
                const bot1EmojiListEl = document.getElementById('bot1EmojiList');
                const bot2EmojiListEl = document.getElementById('bot2EmojiList');
                
                if (forumAutoReactEl) forumAutoReactEl.checked = data.forumAutoReact.allForums || false;
                if (forumChannelSelectEl) forumChannelSelectEl.value = data.forumAutoReact.selectedForum || '';
                if (bot1EmojiListEl) bot1EmojiListEl.value = data.forumAutoReact.bot1EmojiList || '';
                if (bot2EmojiListEl) bot2EmojiListEl.value = data.forumAutoReact.bot2EmojiList || '';
            }
        }

        // Optimized channel dropdown population for both bots
        function populateChannelDropdowns(selectedChannel = '') {
            const selectors = [
                'bot1AllowedChannels', 'bot2AllowedChannels',
                'welcomeChannel', 'messageChannel', 'embedChannel', 'announcementChannel'
            ];
            
            selectors.forEach(selectorId => {
                const select = document.getElementById(selectorId);
                if (select && guildData && guildData.channels) {
                    // Set default option based on selector type
                    if (selectorId.includes('AllowedChannels')) {
                        select.innerHTML = '<option value="">All Channels (Default)</option>';
                    } else if (selectorId === 'announcementChannel') {
                        select.innerHTML = '<option value="">Auto-detect (Default)</option>';
                    } else {
                        select.innerHTML = '<option value="">Select a channel...</option>';
                    }
                    
                    // Populate channels - include text, voice, stage, and announcement (exclude forum)
                    guildData.channels.forEach(channel => {
                        if (channel.type !== 15) { // Exclude forum channels
                            const option = document.createElement('option');
                            option.value = channel.id;
                            
                            // Add appropriate prefix based on channel type
                            let prefix = '#';
                            if (channel.type === 2) prefix = '🔊'; // Voice channels
                            else if (channel.type === 13) prefix = '🎤'; // Stage channels
                            else if (channel.type === 5) prefix = '📢'; // Announcement channels
                            
                            option.textContent = `${prefix}${channel.name}`;
                            
                            if (selectorId.includes('AllowedChannels') && selectedChannel === channel.id) {
                                option.selected = true;
                            }
                            
                            select.appendChild(option);
                        }
                    });
                }
            });
            
            // Populate forum channels
            const forumSelect = document.getElementById('forumChannelSelect');
            if (forumSelect && guildData && guildData.channels) {
                forumSelect.innerHTML = '<option value="">Select a forum channel</option>';
                
                guildData.channels.forEach(channel => {
                    if (channel.type === 15) { // Forum channels
                        const option = document.createElement('option');
                        option.value = channel.id;
                        option.textContent = channel.name;
                        forumSelect.appendChild(option);
                    }
                });
            }
        }

        // Add event listeners for new forms
        document.getElementById('welcomerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                welcomer_enabled: document.getElementById('welcomerEnabled')?.checked || false,
                welcomer_channel: document.getElementById('welcomeChannel')?.value || '',
                welcomer_embed_enabled: document.getElementById('useEmbed')?.value === 'true',
                welcomer_message: document.getElementById('welcomeMessage')?.value || '',
                welcomer_embed_title: document.getElementById('embedTitle')?.value || '',
                welcomer_embed_description: document.getElementById('embedDescription')?.value || '',
                welcomer_embed_color: document.getElementById('embedColor')?.value || '#7c3aed',
                welcomer_embed_thumbnail: document.getElementById('embedThumbnail')?.checked || false,
                welcomer_embed_footer: document.getElementById('welcomeEmbedFooter')?.value || ''
            };
            
            try {
                const response = await fetch('/api/update-welcomer-settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                showPopupNotification(result.message, result.success);
            } catch (error) {
                showPopupNotification('Error updating welcomer settings', false);
            }
        });

        // Auto role form handler removed - using improved handler below

        // Update reactions form to include new settings
        const reactionsFormOld = document.getElementById('reactionsForm');
        if (reactionsFormOld) {
            reactionsFormOld.addEventListener('submit', async (e) => {
                e.preventDefault();
            
            const reactionRoles = [];
            document.querySelectorAll('.reaction-item').forEach(item => {
                const messageId = item.querySelector('input[placeholder="Message ID"]').value;
                const emoji = item.querySelector('input[placeholder*="Emoji"]').value;
                const roleSelect = item.querySelector('select');
                const roles = roleSelect.value ? [roleSelect.value] : [];
                
                if (messageId && emoji && roles.length > 0) {
                    reactionRoles.push({ messageId, emoji, roles });
                }
            });
            
            const formData = {
                forumAutoReact: {
                    allForums: document.getElementById('forumAutoReact').checked,
                    messageReact: {
                        enabled: true, // Always enabled now
                        messageId: document.getElementById('messageReactId').value
                    }
                },
                reactionRoles
            };
            
                try {
                    const response = await fetch('/api/update-reactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    
                    const result = await response.json();
                    showPopupNotification(result.message, result.success);
                } catch (error) {
                    showPopupNotification('Error updating reaction settings', false);
                }
            });
        }

        // Update levels form to include custom rank card settings
        const levelsForm = document.getElementById('levelsForm');
        if (levelsForm) {
            levelsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Collect role rewards
                const roleRewards = [];
                document.querySelectorAll('.role-item').forEach(item => {
                    const level = item.querySelector('input[type="number"]').value;
                    const roleId = item.querySelector('select').value;
                    if (level && roleId) {
                        roleRewards.push({ level: parseInt(level), roleId });
                    }
                });
                
                const formData = {
                    minXp: parseInt(document.getElementById('minXp').value) || 1,
                    maxXp: parseInt(document.getElementById('maxXp').value) || 15,
                    xpCooldown: (parseInt(document.getElementById('xpCooldown').value) || 60) * 1000,
                    levelAnnouncements: document.getElementById('levelAnnouncements').checked,
                    announcementChannel: document.getElementById('announcementChannel').value,
                    levelRoles: roleRewards,

                    
                  
                };
                
                try {
                    const response = await fetch('/api/update-levels', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    
                    const result = await response.json();
                    showPopupNotification(result.message, result.success);
                } catch (error) {
                    showPopupNotification('Error updating level settings', false);
                }
            });
        }

        // Messages form handlers
        const sendMessageForm = document.getElementById('sendMessageForm');
        if (sendMessageForm) {
            sendMessageForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                showProcessing();
                
                const formData = new FormData();
                formData.append('channelId', document.getElementById('messageChannel').value);
                formData.append('message', document.getElementById('messageText').value);
                formData.append('botId', document.getElementById('messageBotSelection').value);
                
                const files = document.getElementById('messageFiles').files;
                for (let i = 0; i < files.length && i < 5; i++) {
                    formData.append(`file${i + 1}`, files[i]);
                }
                
                try {
                    const response = await fetch('/api/send-message', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    showPopupNotification(result.message, result.success);
                    
                    if (result.success) {
                        // Clear only the message text and files, keep channel and bot selection
                        document.getElementById('messageText').value = '';
                        document.getElementById('messageFiles').value = '';
                    }
                } catch (error) {
                    showPopupNotification('Error sending message', false);
                } finally {
                    hideProcessing();
                }
            });
        }

        document.getElementById('sendEmbedForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            showProcessing();
            
            const formData = {
                channelId: document.getElementById('embedChannel').value,
                title: document.getElementById('embedMessageTitle').value,
                description: document.getElementById('embedMessageDescription').value,
                color: document.getElementById('embedMessageColor').value,
                image: document.getElementById('embedImageUrl').value,
                thumbnail: document.getElementById('embedThumbnailUrl').value,
                footer: document.getElementById('embedFooterText').value,
                timestamp: document.getElementById('embedTimestamp').checked,
                botId: document.getElementById('embedBotSelection').value
            };
            
            try {
                const response = await fetch('/api/send-embed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                showPopupNotification(result.message, result.success);
                
                if (result.success) {
                    // Clear only embed content fields, keep channel and bot selection
                    document.getElementById('embedMessageTitle').value = '';
                    document.getElementById('embedMessageDescription').value = '';
                    document.getElementById('embedMessageColor').value = '#0099ff';
                    document.getElementById('embedImageUrl').value = '';
                    document.getElementById('embedThumbnailUrl').value = '';
                    document.getElementById('embedFooterText').value = '';
                    document.getElementById('embedTimestamp').checked = false;
                }
            } catch (error) {
                showPopupNotification('Error sending embed', false);
            } finally {
                hideProcessing();
            }
        });

        // Optimized welcomer form handler with debouncing
        let welcomerSubmitTimeout;
        document.getElementById('welcomerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Debounce rapid submissions
            if (welcomerSubmitTimeout) {
                clearTimeout(welcomerSubmitTimeout);
            }
            
            welcomerSubmitTimeout = setTimeout(async () => {
                showProcessing();
                
                const formData = {
                    enabled: document.getElementById('welcomerEnabled').checked,
                    channelId: document.getElementById('welcomeChannel').value,
                    message: document.getElementById('welcomeMessage').value,
                    useEmbed: document.getElementById('useEmbed').value === 'true',
                    embedTitle: document.getElementById('embedTitle').value,
                    embedDescription: document.getElementById('embedDescription').value,
                    embedColor: document.getElementById('embedColor').value
                };
                
                try {
                    const response = await fetch('/api/update-welcomer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    
                    const result = await response.json();
                    showPopupNotification(result.message, result.success);
                } catch (error) {
                    showPopupNotification('Error updating welcomer settings', false);
                } finally {
                    hideProcessing();
                }
            }, 500); // 500ms debounce delay
        });

        // Toggle welcome message format
        function setupWelcomeToggle() {
            const textToggle = document.getElementById('textToggle');
            const embedToggle = document.getElementById('embedToggle');
            const textSection = document.getElementById('textMessageSection');
            const embedSection = document.getElementById('embedSection');
            const useEmbedField = document.getElementById('useEmbed');
            
            if (textToggle && embedToggle && textSection && embedSection && useEmbedField) {
                textToggle.addEventListener('click', () => {
                    try {
                        textToggle.classList.add('active');
                        embedToggle.classList.remove('active');
                        textSection.style.display = 'block';
                        embedSection.style.display = 'none';
                        useEmbedField.value = 'false';
                    } catch (error) {
                        console.log('Error in text toggle:', error.message);
                    }
                });
                
                embedToggle.addEventListener('click', () => {
                    try {
                        embedToggle.classList.add('active');
                        textToggle.classList.remove('active');
                        textSection.style.display = 'none';
                        embedSection.style.display = 'block';
                        useEmbedField.value = 'true';
                    } catch (error) {
                        console.log('Error in embed toggle:', error.message);
                    }
                });
            }
        }

        // Auto Role Management Functions
        function addAutoRole(roleId = '') {
            const autoRolesList = document.getElementById('autoRolesList');
            const roleId_unique = Date.now();
            
            const roleDiv = document.createElement('div');
            roleDiv.className = 'role-item';
            roleDiv.id = `autoRole_${roleId_unique}`;
            roleDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';
            
            roleDiv.innerHTML = `
                <select class="form-select" style="flex: 1;" data-role-select>
                    <option value="">Select a role...</option>
                    <!-- Roles will be populated by JavaScript -->
                </select>
                <button type="button" onclick="removeAutoRole('autoRole_${roleId_unique}')" class="trendy-btn trendy-btn-danger" style="padding: 8px 15px; font-size: 12px; border-radius: 6px;">Remove</button>
            `;
            
            autoRolesList.appendChild(roleDiv);
            
            // Populate roles
            populateRoleDropdown(roleDiv.querySelector('[data-role-select]'), roleId);
            
            return roleDiv;
        }

        function removeAutoRole(id) {
            document.getElementById(id).remove();
        }

        function populateRoleDropdown(selectElement, selectedRoleId = '') {
            // This will be populated when guild data is loaded
            if (guildData && guildData.roles) {
                selectElement.innerHTML = '<option value="">Select a role...</option>';
                guildData.roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.id;
                    option.textContent = `@${role.name}`;
                    option.selected = role.id === selectedRoleId;
                    selectElement.appendChild(option);
                });
            } else {
                // If no guild data, store the selected role ID for later population
                selectElement.innerHTML = '<option value="">Loading roles...</option>';
                if (selectedRoleId) {
                    selectElement.setAttribute('data-selected-role', selectedRoleId);
                    // Add temporary option with the selected role ID
                    const tempOption = document.createElement('option');
                    tempOption.value = selectedRoleId;
                    tempOption.textContent = `Role (${selectedRoleId})`;
                    tempOption.selected = true;
                    selectElement.appendChild(tempOption);
                }
            }
        }

        function loadAutoRoles(autoRoles) {
            const autoRolesList = document.getElementById('autoRolesList');
            autoRolesList.innerHTML = '';
            
            if (autoRoles && autoRoles.length > 0) {
                autoRoles.forEach(roleId => {
                    // Skip empty string representations of arrays
                    if (roleId && roleId !== "[]" && roleId.trim() !== "") {
                        addAutoRole(roleId.trim()); // Trim whitespace from role IDs
                    }
                });
                
                // If no valid roles were added, add an empty role
                if (autoRolesList.children.length === 0) {
                    addAutoRole(); // Add one empty role
                }
            } else {
                addAutoRole(); // Add one empty role
            }
        }

        function collectAutoRoles() {
            const roleSelects = document.querySelectorAll('#autoRolesList [data-role-select]');
            const roles = [];
            roleSelects.forEach(select => {
                if (select.value) {
                    roles.push(select.value);
                }
            });
            return roles;
        }

        function repopulateAutoRoleDropdowns() {
            const roleSelects = document.querySelectorAll('#autoRolesList [data-role-select]');
            roleSelects.forEach(selectElement => {
                const selectedRoleId = selectElement.getAttribute('data-selected-role') || selectElement.value;
                if (guildData && guildData.roles) {
                    selectElement.innerHTML = '<option value="">Select a role...</option>';
                    guildData.roles.forEach(role => {
                        const option = document.createElement('option');
                        option.value = role.id;
                        option.textContent = `@${role.name}`;
                        option.selected = role.id === selectedRoleId;
                        selectElement.appendChild(option);
                    });
                }
            });
        }

        // Load new welcomer settings from WelcomeMessage table
        function loadNewWelcomerSettings(welcomeData) {
            // Safe element updating with comprehensive null checks
            const safeUpdateElement = (id, value, isCheckbox = false) => {
                const element = document.getElementById(id);
                if (element && value !== null && value !== undefined) {
                    try {
                        if (isCheckbox) {
                            element.checked = Boolean(value);
                        } else {
                            element.value = String(value);
                        }
                    } catch (error) {
                        console.log(`Error setting ${id}:`, error.message);
                    }
                }
            };
            
            safeUpdateElement('welcomerEnabled', welcomeData.enabled || false, true);
            safeUpdateElement('welcomeChannel', welcomeData.channelId || '');
            safeUpdateElement('welcomeMessage', welcomeData.message || 'Welcome to the server, {user}!');
            safeUpdateElement('embedTitle', welcomeData.embedTitle || 'Welcome!');
            safeUpdateElement('embedDescription', welcomeData.embedDescription || 'Welcome to our server, {user}! We\'re glad you\'re here.');
            safeUpdateElement('embedColor', welcomeData.embedColor || '#7c3aed');
            safeUpdateElement('embedThumbnail', welcomeData.embedThumbnail !== false, true);
            safeUpdateElement('welcomeEmbedFooter', welcomeData.embedFooter || 'Have a great time!');
            
            // Set embed toggle state
            const embedEnabled = welcomeData.useEmbed || false;
            safeUpdateElement('useEmbed', embedEnabled ? 'true' : 'false');
            
            // Update UI based on embed state with enhanced error handling
            try {
                const textToggle = document.getElementById('textToggle');
                const embedToggle = document.getElementById('embedToggle');
                const textSection = document.getElementById('textMessageSection');
                const embedSection = document.getElementById('embedSection');
                
                if (embedEnabled) {
                    if (embedToggle) embedToggle.classList.add('active');
                    if (textToggle) textToggle.classList.remove('active');
                    if (textSection) textSection.style.display = 'none';
                    if (embedSection) embedSection.style.display = 'block';
                } else {
                    if (textToggle) textToggle.classList.add('active');
                    if (embedToggle) embedToggle.classList.remove('active');
                    if (textSection) textSection.style.display = 'block';
                    if (embedSection) embedSection.style.display = 'none';
                }
            } catch (error) {
                console.log('Error updating welcomer UI state:', error.message);
            }
        }

        // Load auto role settings from API data
        function loadAutoRoleSettings(autoRoleData) {
            if (document.getElementById('autoRoleEnabled')) {
                document.getElementById('autoRoleEnabled').checked = autoRoleData.enabled || false;
            }
            
            // Load auto roles
            const autoRoleIds = autoRoleData.roleIds || [];
            loadAutoRoles(autoRoleIds);
        }
        
        // Legacy function for compatibility
        function toggleEmbedSection() {
            const useEmbedEl = document.getElementById('useEmbed');
            const textSection = document.getElementById('textMessageSection');
            const embedSection = document.getElementById('embedSection');
            const textToggle = document.getElementById('textToggle');
            const embedToggle = document.getElementById('embedToggle');
            
            if (!useEmbedEl) return;
            
            try {
                const useEmbed = useEmbedEl.value === 'true';
                
                if (useEmbed) {
                    if (textSection) textSection.style.display = 'none';
                    if (embedSection) embedSection.style.display = 'block';
                    if (embedToggle) embedToggle.classList.add('active');
                    if (textToggle) textToggle.classList.remove('active');
                } else {
                    if (textSection) textSection.style.display = 'block';
                    if (embedSection) embedSection.style.display = 'none';
                    if (textToggle) textToggle.classList.add('active');
                    if (embedToggle) embedToggle.classList.remove('active');
                }
            } catch (error) {
                console.log('Error in toggleEmbedSection:', error.message);
            }
        }

        // Auto React form handler
        document.getElementById('autoReactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            showProcessing();
            
            const formData = {
                forumAutoReact: {
                    allForums: document.getElementById('forumAutoReact').checked,
                    selectedForum: document.getElementById('forumChannelSelect').value,
                    bot1EmojiList: document.getElementById('bot1EmojiList').value,
                    bot2EmojiList: document.getElementById('bot2EmojiList').value
                }
            };
            
            try {
                const response = await fetch('/api/update-auto-react', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                showPopupNotification(result.message, result.success);
            } catch (error) {
                showPopupNotification('Error updating auto react settings', false);
            } finally {
                hideProcessing();
            }
        });

        // Message React form handler
        document.getElementById('messageReactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const messageId = document.getElementById('messageReactId').value;
            const emojiList = document.getElementById('messageEmojiList').value;
            const botId = document.getElementById('messageReactBot').value;
            
            if (!messageId || !emojiList) {
                showPopupNotification('Please enter both Message ID and Emoji List', false);
                return;
            }
            
            showProcessing();
            
            try {
                const response = await fetch('/api/react-to-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messageId, emojiList, botId })
                });
                
                const result = await response.json();
                showPopupNotification(result.message, result.success);
            } catch (error) {
                showPopupNotification('Error reacting to message', false);
            } finally {
                hideProcessing();
            }
        });

        // New Welcomer Form Handler (replaces old one)
        const newWelcomerForm = document.getElementById('welcomerForm');
        if (newWelcomerForm) {
            newWelcomerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                showProcessing();
                
                const formData = {
                    welcomer_enabled: document.getElementById('welcomerEnabled')?.checked || false,
                    welcomer_channel: document.getElementById('welcomeChannel')?.value || '',
                    welcomer_message: document.getElementById('welcomeMessage')?.value || '',
                    welcomer_embed_enabled: document.getElementById('useEmbed')?.value === 'true',
                    welcomer_embed_title: document.getElementById('embedTitle')?.value || '',
                    welcomer_embed_description: document.getElementById('embedDescription')?.value || '',
                    welcomer_embed_color: document.getElementById('embedColor')?.value || '#7c3aed',
                    welcomer_embed_thumbnail: document.getElementById('embedThumbnail')?.checked || false,
                    welcomer_embed_footer: document.getElementById('welcomeEmbedFooter')?.value || ''
                };
                
                try {
                    const response = await fetch('/api/update-welcomer-settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    
                    const result = await response.json();
                    showPopupNotification(result.message, result.success);
                } catch (error) {
                    showPopupNotification('Error updating welcomer settings', false);
                } finally {
                    hideProcessing();
                }
            });
        }

        // Auto Role Form Handler
        const autoRoleForm = document.getElementById('autoRoleForm');
        if (autoRoleForm) {
            autoRoleForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                showProcessing();
                
                const autoRoles = collectAutoRoles();
                
                const formData = {
                    auto_role_enabled: document.getElementById('autoRoleEnabled').checked,
                    auto_role_ids: autoRoles.join(',')
                };
                
                try {
                    const response = await fetch('/api/update-auto-role-settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    
                    const result = await response.json();
                    showPopupNotification(result.message, result.success);
                } catch (error) {
                    showPopupNotification('Error updating auto role settings', false);
                } finally {
                    hideProcessing();
                }
            });
        }

        // Add event listeners for toggle functions (with null checks)
        const useEmbedElement = document.getElementById('useEmbed');
        if (useEmbedElement) {
            useEmbedElement.addEventListener('change', toggleEmbedSection);
        }

        // Mobile menu toggle function
        function toggleMobileMenu() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.mobile-overlay');
            
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (sidebar.classList.contains('mobile-open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }



        // Theme toggle function
        function toggleTheme() {
            const body = document.body;
            const themeToggle = document.getElementById('themeToggle');
            
            body.classList.toggle('light-theme');
            
            if (body.classList.contains('light-theme')) {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('theme', 'light');
            } else {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('theme', 'dark');
            }
        }

        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                const sidebar = document.getElementById('sidebar');
                const overlay = document.querySelector('.mobile-overlay');
                sidebar.classList.remove('mobile-open');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Load saved theme
        function loadSavedTheme() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-theme');
                document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
            }
        }

        // React to message function
        async function reactToMessage() {
            const messageId = document.getElementById('messageReactId').value;
            const emojiList = document.getElementById('emojiList').value;
            
            if (!messageId) {
                showPopupNotification( 'Please enter a message ID', false);
                return;
            }
            
            try {
                const response = await fetch('/api/react-to-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messageId, emojiList })
                });
                
                const result = await response.json();
                showPopupNotification( result.message, result.success);
            } catch (error) {
                showPopupNotification( 'Error reacting to message', false);
            }
        }



        // Load saved theme and initialize dashboard on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadSavedTheme();
            // Show loading screen
            document.getElementById('loadingScreen').style.display = 'flex';
            
            // Start loading process
            setTimeout(async () => {
                try {
                    // Step 1: Connection
                    updateLoadingStep(1, 'active', 'Connecting...');
                    updateProgress(20);
                    updateLoadingDetails('Establishing connection to Discord bots...');
                    
                    const statsResponse = await fetch('/api/dashboard-stats');
                    if (!statsResponse.ok) {
                        throw new Error('Failed to fetch server data');
                    }
                    
                    const statsData = await statsResponse.json();
                    if (statsData.success && statsData.stats.guilds && statsData.stats.guilds.length > 0) {
                        currentServerId = statsData.stats.guilds[0].id;
                        updateLoadingDetails(`Connected to ${statsData.stats.guilds.length} servers`);
                    } else {
                        throw new Error('No servers found');
                    }
                    
                    updateLoadingStep(1, 'completed', 'Connected ✓');
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Step 2: Loading Data
                    updateLoadingStep(2, 'active', 'Loading...');
                    updateProgress(50);
                    updateLoadingDetails('Loading server data and bot configuration...');
                    
                    // Load guild data and dashboard data
                    await Promise.all([
                        loadGuildData(),
                        loadDashboardData()
                    ]);
                    
                    updateLoadingDetails('Waiting for all data to be ready...');
                    
                    // Wait for guild data to be fully populated
                    let retryCount = 0;
                    const maxRetries = 20;
                    while (retryCount < maxRetries) {
                        if (guildData && guildData.roles && guildData.roles.length > 0 && 
                            guildData.channels && guildData.channels.length > 0) {
                            break;
                        }
                        await new Promise(resolve => setTimeout(resolve, 200));
                        retryCount++;
                    }
                    
                    updateLoadingStep(2, 'completed', 'Loaded ✓');
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Step 3: Preparing Interface
                    updateLoadingStep(3, 'active', 'Preparing...');
                    updateProgress(80);
                    updateLoadingDetails('Populating dropdowns and form fields...');
                    
                    // Pre-populate all form fields before showing dashboard
                    await populateAllFormFields();
                    
                    updateProgress(95);
                    updateLoadingDetails('Finalizing dashboard interface...');
                    
                    // Initialize reaction roles system safely
                    setTimeout(() => {
                        try {
                            if (typeof initAdvancedReactionRoles === 'function') {
                                initAdvancedReactionRoles();
                            }
                        } catch (error) {
                            // Silent fail for non-critical initialization
                        }
                    }, 100);
                    
                    updateProgress(100);
                    updateLoadingStep(3, 'completed', 'Ready ✓');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Show dashboard only after everything is loaded
                    document.getElementById('loadingScreen').style.display = 'none';
                    document.getElementById('dashboard').style.display = 'block';
                    addDashboardTitleClickEvent();
                    
                    // Initialize welcome toggle functionality
                    setupWelcomeToggle();
                    
                } catch (error) {
                    console.error('Dashboard initialization failed:', error);
                    updateLoadingDetails('Failed to initialize dashboard. Please refresh the page.');
                    document.getElementById('loadingScreen').style.display = 'none';
                    showPopupNotification('Error initializing dashboard: ' + error.message, false);
                }
            }, 500);
        });

        // Database tab 10-click protection
        let titleClickCount = 0;
        let clickResetTimer = null;

        // Add click event to dashboard title
        function addDashboardTitleClickEvent() {
            const dashboardTitle = document.querySelector('.header h1');
            if (dashboardTitle) {
                dashboardTitle.style.cursor = 'pointer';
                dashboardTitle.addEventListener('click', function() {
                    titleClickCount++;
                    
                    // Reset counter after 3 seconds of no clicks
                    if (clickResetTimer) {
                        clearTimeout(clickResetTimer);
                    }
                    clickResetTimer = setTimeout(() => {
                        titleClickCount = 0;
                    }, 3000);
                    
                    // Show database tab after 10 clicks
                    if (titleClickCount >= 10) {
                        const databaseTab = document.getElementById('databaseTab');
                        if (databaseTab) {
                            databaseTab.style.display = 'block';
                            showPopupNotification('Database tab unlocked!', true);
                            
                            // Update mobile navigation to include database tab
                            if (window.innerWidth <= 768) {
                                initMobileNavigation(); // Re-initialize to include database tab
                            }
                        }
                        titleClickCount = 0;
                    }
                });
            }
        }

        // Database management functions
        async function viewTable(tableName) {
            showProcessing();
            try {
                const response = await fetch(`/api/database/table/${tableName}`);
                
                const result = await response.json();
                hideProcessing();
                
                if (result.success) {
                    displayTableData(tableName, result.data);
                } else {
                    showMessage('databaseMessage', result.error || 'Failed to fetch table data', false);
                }
            } catch (error) {
                hideProcessing();
                showMessage('databaseMessage', 'Error: ' + error.message, false);
            }
        }

        function displayTableData(tableName, data) {
            const container = document.getElementById('tableDataContainer');
            const title = document.getElementById('tableTitle');
            const content = document.getElementById('tableDataContent');
            
            // Store data globally for editing functionality
            currentTableData = data;
            
            title.textContent = `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} Table Data`;
            
            if (data && data.length > 0) {
                const headers = Object.keys(data[0]);
                let tableHTML = '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
                
                // Headers
                tableHTML += '<tr>';
                headers.forEach(header => {
                    tableHTML += `<th style="border: 1px solid rgba(255,255,255,0.3); padding: 8px; background: rgba(124, 58, 237, 0.3); color: white;">${header}</th>`;
                });
                tableHTML += `<th style="border: 1px solid rgba(255,255,255,0.3); padding: 8px; background: rgba(124, 58, 237, 0.3); color: white;">Actions</th>`;
                tableHTML += '</tr>';
                
                // Data rows
                data.forEach(row => {
                    tableHTML += '<tr>';
                    headers.forEach(header => {
                        let value = row[header];
                        if (typeof value === 'object' && value !== null) {
                            // Better JSON display - show a preview of the object structure
                            try {
                                const jsonString = JSON.stringify(value, null, 2);
                                if (jsonString === '{}') {
                                    value = '{}';
                                } else if (jsonString.length > 50) {
                                    // Show object keys for better understanding
                                    const keys = Object.keys(value);
                                    if (keys.length > 0) {
                                        value = `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
                                    } else {
                                        value = '{}';
                                    }
                                } else {
                                    value = jsonString;
                                }
                            } catch (e) {
                                value = String(value);
                            }
                        } else if (value === null || value === undefined) {
                            value = 'NULL';
                        } else if (typeof value === 'string' && value.length > 50) {
                            value = value.substring(0, 50) + '...';
                        }
                        tableHTML += `<td style="border: 1px solid rgba(255,255,255,0.3); padding: 8px; color: rgba(255,255,255,0.8);">${value}</td>`;
                    });
                    const rowIndex = data.indexOf(row);
                    const recordId = row.id || row.discord_id || rowIndex; // Use actual ID if available
                    tableHTML += `<td style="border: 1px solid rgba(255,255,255,0.3); padding: 8px;">
                        <button onclick="editRecord('${tableName}', ${rowIndex})" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 11px;">Edit</button>
                        <button onclick="deleteRecord('${tableName}', '${recordId}', ${rowIndex})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">Delete</button>
                    </td>`;
                    tableHTML += '</tr>';
                });
                
                tableHTML += '</table>';
                content.innerHTML = tableHTML;
            } else {
                content.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No data found in this table.</p>';
            }
            
            container.style.display = 'block';
        }

        function hideTableData() {
            document.getElementById('tableDataContainer').style.display = 'none';
        }

        async function deleteUser() {
            const userId = document.getElementById('deleteUserId').value.trim();
            if (!userId) {
                showMessage('databaseMessage', 'Please enter a User ID', false);
                return;
            }
            
            if (!confirm(`Are you sure you want to delete user with ID: ${userId}?`)) {
                return;
            }
            
            showProcessing();
            try {
                const response = await fetch('/api/database/delete-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
                
                const result = await response.json();
                hideProcessing();
                
                if (result.success) {
                    showMessage('databaseMessage', result.message || 'User deleted successfully', true);
                    document.getElementById('deleteUserId').value = '';
                } else {
                    showMessage('databaseMessage', result.error || 'Failed to delete user', false);
                }
            } catch (error) {
                hideProcessing();
                showMessage('databaseMessage', 'Error: ' + error.message, false);
            }
        }

        async function deleteBirthday() {
            const birthdayId = document.getElementById('deleteBirthdayId').value.trim();
            if (!birthdayId) {
                showMessage('databaseMessage', 'Please enter a Birthday ID', false);
                return;
            }
            
            if (!confirm(`Are you sure you want to delete birthday with ID: ${birthdayId}?`)) {
                return;
            }
            
            showProcessing();
            try {
                const response = await fetch('/api/database/delete-birthday', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ birthdayId })
                });
                
                const result = await response.json();
                hideProcessing();
                
                if (result.success) {
                    showMessage('databaseMessage', result.message || 'Birthday deleted successfully', true);
                    document.getElementById('deleteBirthdayId').value = '';
                } else {
                    showMessage('databaseMessage', result.error || 'Failed to delete birthday', false);
                }
            } catch (error) {
                hideProcessing();
                showMessage('databaseMessage', 'Error: ' + error.message, false);
            }
        }

        // Delete all records functions
        async function deleteAllUsers() {
            if (!confirm('Are you sure you want to delete ALL users? This action cannot be undone!')) {
                return;
            }
            
            showProcessing();
            try {
                const response = await fetch('/api/database/delete-all-users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                hideProcessing();
                
                if (result.success) {
                    showMessage('databaseMessage', result.message || 'All users deleted successfully', true);
                } else {
                    showMessage('databaseMessage', result.error || 'Failed to delete all users', false);
                }
            } catch (error) {
                hideProcessing();
                showMessage('databaseMessage', 'Error: ' + error.message, false);
            }
        }

        async function deleteAllBirthdays() {
            if (!confirm('Are you sure you want to delete ALL birthdays? This action cannot be undone!')) {
                return;
            }
            
            showProcessing();
            try {
                const response = await fetch('/api/database/delete-all-birthdays', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                hideProcessing();
                
                if (result.success) {
                    showMessage('databaseMessage', result.message || 'All birthdays deleted successfully', true);
                } else {
                    showMessage('databaseMessage', result.error || 'Failed to delete all birthdays', false);
                }
            } catch (error) {
                hideProcessing();
                showMessage('databaseMessage', 'Error: ' + error.message, false);
            }
        }

        // Edit record functions
        let currentEditData = null;
        let currentEditTable = null;

        // Store table data globally for editing
        let currentTableData = null;
        
        function editRecord(tableName, recordIndex) {
            currentEditTable = tableName;
            
            // Get the record data from the stored table data
            if (currentTableData && currentTableData[recordIndex]) {
                currentEditData = currentTableData[recordIndex];
            } else {
                console.error('Record not found for editing');
                return;
            }
            
            document.getElementById('editModalTitle').textContent = `Edit ${tableName.charAt(0).toUpperCase() + tableName.slice(1)} Record`;
            
            let formHTML = '';
            Object.keys(currentEditData).forEach(key => {
                if (key === 'id') return; // Skip ID field
                
                let value = currentEditData[key];
                if (typeof value === 'object' && value !== null) {
                    // Handle JSON objects properly for editing
                    try {
                        value = JSON.stringify(value, null, 2);
                    } catch (e) {
                        value = String(value);
                    }
                } else if (value === null || value === undefined) {
                    value = '';
                } else {
                    value = String(value);
                }
                
                formHTML += `
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: rgba(255,255,255,0.8); font-weight: bold;">${key}</label>
                        ${key === 'conversation_history' ? 
                            `<textarea id="edit_${key}" style="width: 100%; height: 80px; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: white; font-family: monospace; resize: vertical;">${value}</textarea>` :
                            `<input type="text" id="edit_${key}" value="${value}" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: white;">`
                        }
                    </div>
                `;
            });
            
            document.getElementById('editModalContent').innerHTML = formHTML;
            document.getElementById('editModal').style.display = 'block';
        }

        function closeEditModal() {
            document.getElementById('editModal').style.display = 'none';
            currentEditData = null;
            currentEditTable = null;
        }

        async function saveEdit() {
            if (!currentEditData || !currentEditTable) return;
            
            const updateData = {};
            Object.keys(currentEditData).forEach(key => {
                if (key === 'id') return;
                const element = document.getElementById(`edit_${key}`);
                if (element) {
                    let value = element.value;
                    if (key === 'conversation_history') {
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            showMessage('databaseMessage', 'Invalid JSON in conversation_history', false);
                            return;
                        }
                    }
                    updateData[key] = value;
                }
            });
            
            showProcessing();
            try {
                const response = await fetch('/api/database/update-record', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table: currentEditTable,
                        id: currentEditData.id,
                        data: updateData
                    })
                });
                
                const result = await response.json();
                hideProcessing();
                
                if (result.success) {
                    showMessage('databaseMessage', result.message || 'Record updated successfully', true);
                    closeEditModal();
                    // Refresh the table data
                    viewTable(currentEditTable);
                } else {
                    showMessage('databaseMessage', result.error || 'Failed to update record', false);
                }
            } catch (error) {
                hideProcessing();
                showMessage('databaseMessage', 'Error: ' + error.message, false);
            }
        }

        // Refresh Database Data
        function refreshDatabase() {
            showProcessing();
            try {
                // Hide any open table data
                const tableContainer = document.getElementById('tableDataContainer');
                if (tableContainer) {
                    tableContainer.style.display = 'none';
                }
                
                // Clear any displayed messages
                const databaseMessage = document.getElementById('databaseMessage');
                if (databaseMessage) {
                    databaseMessage.innerHTML = '';
                }
                
                showMessage('databaseMessage', 'Database data refreshed successfully', true);
                hideProcessing();
            } catch (error) {
                hideProcessing();
                showMessage('databaseMessage', 'Error refreshing database data', false);
            }
        }

        // Clear All Database Tables
        async function clearAllDatabase() {
            if (!confirm('⚠️ WARNING: This will permanently delete ALL data from all database tables.\n\nThis action cannot be undone. Are you absolutely sure you want to proceed?')) {
                return;
            }
            
            if (!confirm('🚨 FINAL WARNING: This will delete:\n- All user data (XP, levels, etc.)\n- All birthday records\n- All AI questions\n- All level roles\n- All reaction roles\n\nType "DELETE" to confirm (case sensitive):')) {
                return;
            }
            
            const confirmation = prompt('Please type "DELETE" to confirm (case sensitive):');
            if (confirmation !== 'DELETE') {
                showPopupNotification('Operation cancelled', false);
                return;
            }
            
            try {
                const response = await fetch('/api/database/clear-all', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                if (result.success) {
                    showPopupNotification('All database tables cleared successfully', true);
                    loadDashboardData(); // Refresh the dashboard
                    hideTableData(); // Hide any open table views
                } else {
                    showPopupNotification(result.message || 'Failed to clear database', false);
                }
            } catch (error) {
                console.error('Error clearing database:', error);
                showPopupNotification('Error clearing database', false);
            }
        }

        // Export Database Data
        async function exportDatabase() {
            showProcessing();
            try {
                const response = await fetch('/api/database/export', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (!response.ok) {
                    throw new Error('Export failed');
                }
                
                const data = await response.json();
                
                // Create downloadable file
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `discord-bot-database-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showMessage('databaseMessage', 'Database exported successfully', true);
            } catch (error) {
                showMessage('databaseMessage', 'Error exporting database: ' + error.message, false);
            } finally {
                hideProcessing();
            }
        }

        // Import Database Data
        function importDatabase() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = handleFileImport;
            input.click();
        }

        async function handleFileImport(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            showProcessing();
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Confirm import
                if (!confirm('This will replace all existing data. Are you sure you want to continue?')) {
                    hideProcessing();
                    return;
                }
                
                const response = await fetch('/api/database/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('databaseMessage', 'Database imported successfully', true);
                    // Hide any open table data and refresh view
                    const tableContainer = document.getElementById('tableDataContainer');
                    if (tableContainer) {
                        tableContainer.style.display = 'none';
                    }
                } else {
                    showMessage('databaseMessage', 'Import failed: ' + result.error, false);
                }
            } catch (error) {
                showMessage('databaseMessage', 'Error importing database: ' + error.message, false);
            } finally {
                hideProcessing();
            }
        }

        // Auto-Create Database Tables
        async function autoCreateTables() {
            if (!confirm('This will create all missing database tables with proper schema. Continue?')) {
                return;
            }
            
            showProcessing();
            try {
                const response = await fetch('/api/database/auto-create-tables', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('databaseMessage', 'Database tables created successfully: ' + result.tablesCreated.join(', '), true);
                    showPopupNotification('Database tables auto-created successfully', true);
                } else {
                    showMessage('databaseMessage', 'Failed to create tables: ' + result.error, false);
                }
            } catch (error) {
                showMessage('databaseMessage', 'Error creating tables: ' + error.message, false);
            } finally {
                hideProcessing();
            }
        }

        // New Auto Role Functions
        function clearAllAutoRoles() {
            if (confirm('Are you sure you want to clear all auto roles?')) {
                document.getElementById('autoRolesList').innerHTML = '';
                addAutoRole(); // Add one empty role field
                showPopupNotification('All auto roles cleared', true);
            }
        }

        // New Database Table Functions
        let currentTableName = '';
        let originalTableData = null;

        function refreshTableData() {
            if (currentTableName) {
                viewTable(currentTableName);
                showPopupNotification('Table data refreshed', true);
            }
        }

        function exportTableData() {
            if (!originalTableData || !currentTableName) {
                showPopupNotification('No table data to export', false);
                return;
            }

            const blob = new Blob([JSON.stringify(originalTableData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentTableName}-table-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showPopupNotification(`${currentTableName} table exported successfully`, true);
        }

        function addTableRecord() {
            if (!currentTableName) {
                showPopupNotification('No table selected', false);
                return;
            }
            
            let formFields = '';
            switch (currentTableName) {
                case 'users':
                    formFields = `
                        <input type="text" id="addUserId" placeholder="User Discord ID" class="form-input" style="margin-bottom: 10px;">
                        <input type="text" id="addUsername" placeholder="Username" class="form-input" style="margin-bottom: 10px;">
                        <input type="number" id="addXp" placeholder="XP (default: 0)" class="form-input" style="margin-bottom: 10px;">
                        <input type="number" id="addLevel" placeholder="Level (default: 0)" class="form-input" style="margin-bottom: 10px;">
                    `;
                    break;
                case 'birthdays':
                    formFields = `
                        <input type="text" id="addUserId" placeholder="User Discord ID" class="form-input" style="margin-bottom: 10px;">
                        <input type="text" id="addUsername" placeholder="Username" class="form-input" style="margin-bottom: 10px;">
                        <input type="number" id="addDay" placeholder="Day (1-31)" min="1" max="31" class="form-input" style="margin-bottom: 10px;">
                        <input type="number" id="addMonth" placeholder="Month (1-12)" min="1" max="12" class="form-input" style="margin-bottom: 10px;">
                    `;
                    break;
                case 'level_roles':
                    formFields = `
                        <input type="number" id="addLevel" placeholder="Level" min="1" class="form-input" style="margin-bottom: 10px;">
                        <input type="text" id="addRoleId" placeholder="Role Discord ID" class="form-input" style="margin-bottom: 10px;">
                    `;
                    break;
                default:
                    showPopupNotification('Add record not supported for this table', false);
                    return;
            }
            
            const modalHtml = `
                <div id="addRecordModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: #1a1a1a; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                        <h3 style="color: #7c3aed; margin-bottom: 20px;">Add New ${currentTableName.slice(0, -1).charAt(0).toUpperCase() + currentTableName.slice(0, -1).slice(1)}</h3>
                        ${formFields}
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button onclick="submitAddRecord()" class="trendy-btn trendy-btn-success">Add Record</button>
                            <button onclick="closeAddRecordModal()" class="trendy-btn trendy-btn-danger">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        function closeAddRecordModal() {
            const modal = document.getElementById('addRecordModal');
            if (modal) modal.remove();
        }

        async function submitAddRecord() {
            if (!currentTableName) return;
            
            let data = {};
            switch (currentTableName) {
                case 'users':
                    data = {
                        userId: document.getElementById('addUserId').value,
                        username: document.getElementById('addUsername').value,
                        xp: parseInt(document.getElementById('addXp').value) || 0,
                        level: parseInt(document.getElementById('addLevel').value) || 0
                    };
                    if (!data.userId) {
                        showPopupNotification('User ID is required', false);
                        return;
                    }
                    break;
                case 'birthdays':
                    data = {
                        userId: document.getElementById('addUserId').value,
                        username: document.getElementById('addUsername').value,
                        day: parseInt(document.getElementById('addDay').value),
                        month: parseInt(document.getElementById('addMonth').value)
                    };
                    if (!data.userId || !data.day || !data.month) {
                        showPopupNotification('All fields are required', false);
                        return;
                    }
                    break;
                case 'level_roles':
                    data = {
                        level: parseInt(document.getElementById('addLevel').value),
                        roleId: document.getElementById('addRoleId').value
                    };
                    if (!data.level || !data.roleId) {
                        showPopupNotification('All fields are required', false);
                        return;
                    }
                    break;
            }
            
            try {
                const response = await fetch(`/api/add-record/${currentTableName}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                if (result.success) {
                    showPopupNotification('Record added successfully', true);
                    closeAddRecordModal();
                    viewTable(currentTableName); // Refresh table
                } else {
                    showPopupNotification(result.message || 'Failed to add record', false);
                }
            } catch (error) {
                showPopupNotification('Error adding record', false);
            }
        }

        async function bulkDeleteRecords() {
            if (!currentTableName) {
                showPopupNotification('No table selected', false);
                return;
            }
            
            if (confirm(`Are you sure you want to delete ALL records from ${currentTableName}? This action cannot be undone!`)) {
                try {
                    const response = await fetch(`/api/bulk-delete/${currentTableName}`, {
                        method: 'DELETE'
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        showPopupNotification(`All records deleted from ${currentTableName}`, true);
                        viewTable(currentTableName); // Refresh table
                    } else {
                        showPopupNotification(result.message || 'Failed to delete records', false);
                    }
                } catch (error) {
                    showPopupNotification('Error deleting records', false);
                }
            }
        }

        async function deleteRecord(tableName, recordId, rowIndex) {
            if (confirm(`Are you sure you want to delete this record from ${tableName}?`)) {
                try {
                    const response = await fetch(`/api/delete-record/${tableName}/${recordId}`, {
                        method: 'DELETE'
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        showPopupNotification(`Record deleted successfully`, true);
                        viewTable(tableName); // Refresh table
                    } else {
                        showPopupNotification(result.message || 'Failed to delete record', false);
                    }
                } catch (error) {
                    showPopupNotification('Error deleting record', false);
                }
            }
        }

        function filterTableData() {
            const searchTerm = document.getElementById('tableSearchInput').value.toLowerCase();
            const tableContent = document.getElementById('tableDataContent');
            const rows = tableContent.getElementsByTagName('tr');

            for (let i = 1; i < rows.length; i++) { // Skip header row
                const row = rows[i];
                const cells = row.getElementsByTagName('td');
                let found = false;

                for (let j = 0; j < cells.length; j++) {
                    if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
                        found = true;
                        break;
                    }
                }

                row.style.display = found ? '' : 'none';
            }
        }

        // Table view function
        async function viewTable(tableName) {
            currentTableName = tableName;
            showProcessing();
            
            try {
                const response = await fetch(`/api/database/table/${tableName}`);
                const data = await response.json();
                
                if (data.success) {
                    originalTableData = data.data;
                    displayTableData(tableName, data.data);
                    
                    // Show the table container
                    const tableContainer = document.getElementById('tableDataContainer');
                    if (tableContainer) {
                        tableContainer.style.display = 'block';
                    }
                    
                    // Clear search input
                    const searchInput = document.getElementById('tableSearchInput');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                } else {
                    showMessage('databaseMessage', data.error, false);
                }
            } catch (error) {
                showMessage('databaseMessage', 'Error loading table data: ' + error.message, false);
            }
            
            hideProcessing();
        }
        
        // Make viewTable globally accessible
        window.viewTable = viewTable;

        function displayTableData(tableName, data) {
            currentTableData = data; // Store for editing functionality
            document.getElementById('tableTitle').textContent = `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} Table`;
            
            const container = document.getElementById('tableDataContent');
            
            if (!data || data.length === 0) {
                container.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center; padding: 20px;">No data found in this table.</p>';
            } else {
                const headers = Object.keys(data[0]);
                let tableHTML = `
                    <table style="width: 100%; border-collapse: collapse; color: white; font-size: 12px;">
                        <thead>
                            <tr style="background: rgba(124, 58, 237, 0.3);">
                                ${headers.map(header => `<th style="border: 1px solid rgba(255,255,255,0.2); padding: 8px; text-align: left; font-weight: bold;">${header}</th>`).join('')}
                                <th style="border: 1px solid rgba(255,255,255,0.2); padding: 8px; text-align: center; font-weight: bold;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.forEach((row, index) => {
                    tableHTML += '<tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">';
                    headers.forEach(header => {
                        let cellValue = row[header];
                        if (typeof cellValue === 'object' && cellValue !== null) {
                            cellValue = JSON.stringify(cellValue);
                        }
                        if (cellValue === null || cellValue === undefined) {
                            cellValue = '';
                        }
                        
                        // Truncate long values
                        const displayValue = String(cellValue).length > 50 ? String(cellValue).substring(0, 50) + '...' : String(cellValue);
                        
                        tableHTML += `<td style="border: 1px solid rgba(255,255,255,0.1); padding: 6px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayValue}</td>`;
                    });
                    tableHTML += `
                        <td style="border: 1px solid rgba(255,255,255,0.1); padding: 6px; text-align: center;">
                            <button onclick="editRecord('${tableName}', ${index})" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; margin-right: 5px; min-width: 50px;">Edit</button>
                            <button onclick="deleteRecord('${tableName}', '${row.id}', ${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; min-width: 50px;">Delete</button>
                        </td>
                    `;
                    tableHTML += '</tr>';
                });
                
                tableHTML += '</tbody></table>';
                container.innerHTML = tableHTML;
            }
            
            document.getElementById('tableDataContainer').style.display = 'block';
        }

        // Add error handling for unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
            // Silently handle common network errors and database timeouts
            if (event.reason && event.reason.message && 
                (event.reason.message.includes('fetch') || 
                 event.reason.message.includes('network') ||
                 event.reason.message.includes('timeout'))) {
                event.preventDefault();
                return;
            }
            console.log('Promise rejection handled:', event.reason);
            event.preventDefault();
        });