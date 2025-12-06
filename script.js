// script.js
document.addEventListener('DOMContentLoaded', () => {
    const internshipForm = document.getElementById('internshipForm');
    const submitBtn = internshipForm.querySelector('button[type="submit"]');
    const resultsSection = document.getElementById('resultsSection');
    const formSection = document.getElementById('formSection');
    const progressBar = document.querySelector('.progress-bar');
    const resetButton = document.getElementById('resetButton');
    const recommendationContainer = document.getElementById('recommendationContainer');
    const skillsCheckboxesContainer = document.getElementById('skillsCheckboxes');
    const fieldSelect = document.getElementById('field');
    const branchContainer = document.getElementById('branchContainer');
    const branchSelect = document.getElementById('branch');
    const sectorRadios = document.querySelectorAll('input[name="sector"]');
    const otherSkillsInput = document.getElementById('otherSkillsInput');
    const resumeInput = document.getElementById('resumeInput');
    const resumeStatus = document.getElementById('resumeStatus');

    let allSkills = [];
    let skillMap = { sectors: {}, fields: {}, branches: {} };
    let skillsFromResume = new Set();
    
    const fieldToBranchMap = {
        "Engineering": ["Computer Science", "Electronics", "Mechanical", "Civil Engineering"],
        "Business": ["Marketing", "Finance", "Human Resources", "Operations Management"],
        "Science": ["Physics", "Chemistry", "Biology", "Data Science"],
        "Design": ["UI/UX Design", "Graphic Design", "Industrial Design"],
        "Medical": ["Pre-Med", "Nursing", "Pharma", "Biology"],
    };

    // Base URL for API calls
    const baseURL = window.location.origin.includes('127.0.0.1') || window.location.origin.includes('localhost') 
        ? 'http://127.0.0.1:5000' 
        : '';

    function populateDropdown(selectElement, options, placeholder) {
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        options.forEach(option => { 
            selectElement.innerHTML += `<option value="${option}">${option}</option>`; 
        });
    }

    function renderSkillCheckboxes(skillsToDisplay) {
        skillsCheckboxesContainer.innerHTML = '';
        if (skillsToDisplay.length === 0) {
            skillsCheckboxesContainer.innerHTML = `<p class="text-muted text-center m-0">No specific skills found.</p>`;
            return;
        }
        const columns = 3;
        const skillsPerColumn = Math.ceil(skillsToDisplay.length / columns);
        for (let i = 0; i < columns; i++) {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-md-4';
            const columnSkills = skillsToDisplay.slice(i * skillsPerColumn, (i + 1) * skillsPerColumn);
            columnSkills.forEach(skill => {
                const skillId = 'skill-' + skill.toLowerCase().replace(/[^a-z0-9]/g, '');
                const isChecked = skillsFromResume.has(skill.toLowerCase());
                colDiv.innerHTML += `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${skill}" id="${skillId}" ${isChecked ? 'checked' : ''}>
                        <label class="form-check-label" for="${skillId}">${skill}</label>
                    </div>`;
            });
            skillsCheckboxesContainer.appendChild(colDiv);
        }
    }
    
    function updateVisibleSkills() {
        const selectedSector = document.querySelector('input[name="sector"]:checked')?.value;
        const selectedField = fieldSelect.value;
        const selectedBranch = branchSelect.value;
        const visibleSkills = new Set();
        
        if (selectedSector && skillMap.sectors[selectedSector]) {
            skillMap.sectors[selectedSector].forEach(s => visibleSkills.add(s));
        }
        if (selectedField && skillMap.fields[selectedField]) {
            skillMap.fields[selectedField].forEach(s => visibleSkills.add(s));
        }
        if (selectedBranch && skillMap.branches[selectedBranch]) {
            skillMap.branches[selectedBranch].forEach(s => visibleSkills.add(s));
        }
        
        const skillsToRender = visibleSkills.size > 0 ? Array.from(visibleSkills).sort() : allSkills;
        renderSkillCheckboxes(skillsToRender);
    }

    async function initializeForm() {
        try {
            const response = await fetch('internships.json'); 
            if (!response.ok) throw new Error('internships.json not found.');
            const internshipsData = await response.json();
            
            const allSkillsSet = new Set(), locations = new Set(), durations = new Set();
            
            internshipsData.forEach(({ field, branch, sector, required_skills, location, duration }) => {
                if (!skillMap.fields[field]) skillMap.fields[field] = new Set();
                if (branch && !skillMap.branches[branch]) skillMap.branches[branch] = new Set();
                if (!skillMap.sectors[sector]) skillMap.sectors[sector] = new Set();
                
                required_skills.forEach(skill => {
                    const cleanSkill = skill.trim();
                    allSkillsSet.add(cleanSkill);
                    skillMap.fields[field].add(cleanSkill);
                    if(branch) skillMap.branches[branch].add(cleanSkill);
                    skillMap.sectors[sector].add(cleanSkill);
                });
                
                locations.add(location); 
                durations.add(duration);
            });
            
            allSkills = Array.from(allSkillsSet).sort();
            populateDropdown(document.getElementById('state'), Array.from(locations).sort(), 'Any location');
            populateDropdown(document.getElementById('duration'), Array.from(durations).sort(), 'Any duration');
        } catch (error) {
            console.error("Initialization Error:", error);
            skillsCheckboxesContainer.innerHTML = `<div class="col-12 text-danger"><b>Error:</b> ${error.message}</div>`;
        }
        populateDropdown(fieldSelect, Object.keys(fieldToBranchMap), 'Select your general field...');
    }

    resumeInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            resumeStatus.textContent = 'Invalid File';
            resumeStatus.classList.remove('text-success', 'text-danger');
            return;
        }

        resumeStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await fetch(`${baseURL}/analyze-resume`, { 
                method: 'POST', 
                body: formData 
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Analysis failed.');
            }

            const data = await response.json();
            const extractedSkills = data.skills;
            
            skillsFromResume.clear();
            const otherSkills = [];
            const knownSkillsMasterList = new Set(allSkills.map(s => s.toLowerCase()));

            extractedSkills.forEach(skill => {
                const skillLower = skill.toLowerCase();
                if (knownSkillsMasterList.has(skillLower)) {
                    skillsFromResume.add(skillLower);
                } else {
                    otherSkills.push(skill);
                }
            });

            otherSkillsInput.value = otherSkills.join(', ');
            updateVisibleSkills();
            
            resumeStatus.textContent = 'Skills Filled!';
            resumeStatus.classList.add('text-success');
            resumeStatus.classList.remove('text-danger');
        } catch (error) {
            console.error('Resume analysis error:', error);
            resumeStatus.textContent = 'Error!';
            resumeStatus.classList.add('text-danger');
            resumeStatus.classList.remove('text-success');
            alert(`Resume Analysis Failed: ${error.message}`);
        }
    });
    
    fieldSelect.addEventListener('change', () => {
        const selectedField = fieldSelect.value;
        if (selectedField && fieldToBranchMap[selectedField]) {
            populateDropdown(branchSelect, fieldToBranchMap[selectedField], 'Select specialization...');
            branchContainer.style.display = 'block';
        } else {
            branchContainer.style.display = 'none'; 
            branchSelect.innerHTML = '';
        }
        updateVisibleSkills();
    });
    
    branchSelect.addEventListener('change', updateVisibleSkills);
    sectorRadios.forEach(radio => radio.addEventListener('change', updateVisibleSkills));

    internshipForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const checkboxSkills = Array.from(document.querySelectorAll('#skillsCheckboxes input:checked')).map(cb => cb.value);
        const otherSkillsRaw = otherSkillsInput.value.split(',');
        const otherSkillsCleaned = otherSkillsRaw.map(skill => skill.trim()).filter(skill => skill !== "");
        const allUserSkills = [...new Set([...checkboxSkills, ...otherSkillsCleaned])];
        
        const userData = {
            education: document.getElementById('education').value,
            field: fieldSelect.value, 
            branch: branchSelect.value,
            state: document.getElementById('state').value,
            duration: document.getElementById('duration').value,
            sector: document.querySelector('input[name="sector"]:checked')?.value || "",
            skills: allUserSkills
        };

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${baseURL}/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! Status: ${response.status}. ${errorData.error || ''}`);
            }
            
            const recommendations = await response.json();
            
            // Check if the response contains an error (from backend)
            if (recommendations.error) {
                throw new Error(recommendations.error);
            }
            
            displayRecommendations(recommendations);
            resultsSection.classList.remove('d-none'); 
            formSection.classList.add('d-none');
            progressBar.style.width = '100%';
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            let errorMessage = "Could not fetch recommendations.";
            
            if (error.message.includes("Failed to fetch")) {
                errorMessage += "<br>Please ensure the Python backend server (app.py) is running on port 5000.";
                errorMessage += "<br>Check the console for more details.";
            } else if (error.message.includes("Status: 500")) {
                errorMessage += "<br>Server encountered an internal error. Please check the backend logs.";
            } else if (error.message.includes("No internship data loaded")) {
                errorMessage += "<br>Server is not ready. No internship data loaded.";
            } else {
                errorMessage += `<br>Error: ${error.message}`;
            }
            
            recommendationContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <h5><i class="fas fa-exclamation-triangle me-2"></i>Error</h5>
                        ${errorMessage}
                    </div>
                </div>`;
            resultsSection.classList.remove('d-none'); 
            formSection.classList.add('d-none');
        } finally {
            submitBtn.innerHTML = '<i class="fas fa-cogs me-2"></i>Generate AI Recommendations';
            submitBtn.disabled = false;
        }
    });

    resetButton.addEventListener('click', () => {
        formSection.classList.remove('d-none'); 
        resultsSection.classList.add('d-none');
        progressBar.style.width = '33%'; 
        internshipForm.reset(); 
        recommendationContainer.innerHTML = ''; 
        branchContainer.style.display = 'none';
        resumeStatus.textContent = 'Select PDF';
        resumeStatus.classList.remove('text-success', 'text-danger');
        skillsFromResume.clear();
        skillsCheckboxesContainer.innerHTML = `<p class="text-muted text-center m-0">Select a Field to see skills.</p>`;
    });

    function displayRecommendations(recommendations) {
        recommendationContainer.innerHTML = '';
        
        if (!recommendations || recommendations.length === 0) {
            recommendationContainer.innerHTML = `
                <div class="col-12">
                    <div class="glass-card text-center">
                        <i class="fas fa-info-circle fa-2x mb-3 text-primary"></i>
                        <h4>No Matches Found</h4>
                        <p>Your profile didn't match our current listings. Try adjusting your criteria!</p>
                    </div>
                </div>`;
            return;
        }
        
        recommendations.forEach((internship, index) => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-4 recommendation-card-animation';
            card.style.animationDelay = `${index * 100}ms`;
            
            const { matched_skills, missing_skills, is_opportunity } = internship.explainability || {};
            const matchedTags = matched_skills ? matched_skills.map(skill => 
                `<span class="skill-tag-advanced matched" title="You have this skill"><i class="fas fa-check me-1"></i>${skill}</span>`
            ).join('') : '';
            
            const missingTags = missing_skills ? missing_skills.map(skill => 
                `<span class="skill-tag-advanced missing" title="A skill you could learn"><i class="fas fa-plus me-1"></i>${skill}</span>`
            ).join('') : '';
            
            const opportunityBadge = is_opportunity ? 
                `<span class="badge opportunity-badge mb-2" title="Great opportunity to learn!"><i class="fas fa-star me-1"></i>Growth Opportunity</span>` : '';
            
            card.innerHTML = `
                <div class="card recommendation-card h-100 glass-card">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title me-2">${internship.title || 'No Title'}</h5>
                            <span class="badge match-badge text-white">${internship.match || 0}%</span>
                        </div>
                        <h6 class="card-subtitle mb-2 text-muted">${internship.organization || 'Unknown Organization'}</h6>
                        ${opportunityBadge}
                        <p class="card-text small">${internship.description || 'No description available.'}</p>
                        <div class="mt-auto">
                            <h6 class="mt-3">Skill Match Breakdown:</h6>
                            <div>${matchedTags} ${missingTags}</div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-0">
                        <div class="d-flex justify-content-between text-muted">
                            <small><i class="fas fa-map-marker-alt me-1"></i> ${internship.location || 'Location not specified'}</small>
                            <small><i class="fas fa-clock me-1"></i> ${internship.duration || 'Duration not specified'}</small>
                        </div>
                    </div>
                </div>`;
                
            recommendationContainer.appendChild(card);
        });
    }

    // Add health check on page load
    async function checkServerHealth() {
        try {
            const response = await fetch(`${baseURL}/health`);
            if (response.ok) {
                const health = await response.json();
                console.log('Server health:', health);
                if (health.status !== 'ok') {
                    console.warn('Server reported issues:', health);
                }
            }
        } catch (error) {
            console.warn('Could not connect to server health endpoint:', error);
        }
    }

    // Initialize the form and check server health
    initializeForm();
    if (baseURL) {
        checkServerHealth();
    }
});