// ============================================
// SERVICE WORKER REGISTRATION (PWA)
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

// ============================================
// LOGIN DATA MANAGEMENT
// ============================================
// Function to save Quole and TeamNum from logIn.html to sessionStorage
function saveLoginData() {
    const quole = document.getElementById("quole").value;
    const teamNum = document.getElementById("teamNum").value;
    
    if (quole && teamNum) {
        sessionStorage.setItem("quole", quole);
        sessionStorage.setItem("teamNum", teamNum)
        return true;
    }
    return false;
}

// Function to get Quole and TeamNum from sessionStorage
function getLoginData() {
    return {
        quole: sessionStorage.getItem("quole") || "",
        teamNum: sessionStorage.getItem("teamNum") || ""
    };
}

// Function to create JSON from Quole and counter (legacy)
function createJSON(counter) {
    const loginData = getLoginData();
    
    const jsonData = {
        quole: loginData.quole,
        teamNum: loginData.teamNum,
        counter: counter,
        timestamp: new Date().toISOString()
    };
    return JSON.stringify(jsonData, null, 2);
}

// Function to create auto data object
function createAutoData(counter, autoClimbed) {
    const loginData = getLoginData();
    
    return {
        type: "auto",
        quole: loginData.quole,
        teamNum: loginData.teamNum,
        autoCounter: counter,
        autoClimbed: autoClimbed,
        timestamp: new Date().toISOString()
    };
}

// Function to create teleop data object
function createTeleopData(counter, climbLevel) {
    const loginData = getLoginData();
    
    return {
        type: "teleop",
        quole: loginData.quole,
        teamNum: loginData.teamNum,
        teleopCounter: counter,
        climbLevel: climbLevel,
        timestamp: new Date().toISOString()
    };
}

// Legacy function for backward compatibility
function createMatchData(counter) {
    const loginData = getLoginData();
    
    return {
        quole: loginData.quole,
        teamNum: loginData.teamNum,
        counter: counter,
        timestamp: new Date().toISOString()
    };
}

// Function to get the JSON (useful for game.html)
function getJSON() {
    // Use the global counter variable (updated by counting function)
    return createJSON(counter);
}


let counter = 0;
function counting() {
    counter++;
    document.getElementById("counter").innerText = counter;
}

// Function to save match data to localStorage
function saveMatchToLocalStorage(matchData) {
    try {
        // Get existing matches from localStorage
        const existingMatches = getMatchesFromLocalStorage();
        
        // Add new match
        existingMatches.push(matchData);
        
        // Save back to localStorage
        localStorage.setItem('scoutingMatches', JSON.stringify(existingMatches));
        
        return true;
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        return false;
    }
}

// Function to retrieve all matches from localStorage
function getMatchesFromLocalStorage() {
    try {
        const stored = localStorage.getItem('scoutingMatches');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return [];
    }
}

// Function to get the current Google Sheets URL
function getGoogleSheetsUrl() {
    return localStorage.getItem('googleSheetsScriptUrl') || null;
}

// Function to set or change the Google Sheets URL
function changeGoogleSheetsUrl() {
    const currentUrl = getGoogleSheetsUrl();
    let message = 'Enter your Google Apps Script Web App URL:';
    
    if (currentUrl) {
        message = 'Current URL: ' + currentUrl.substring(0, 50) + '...\n\n' + 
                  'Enter a new URL to change it, or click Cancel to keep the current one:';
    }
    
    const newUrl = prompt(message);
    
    if (newUrl === null) {
        // User clicked Cancel
        return { success: false, cancelled: true, message: 'URL change cancelled' };
    }
    
    if (newUrl.trim() === '') {
        // User entered empty string - clear the URL
        localStorage.removeItem('googleSheetsScriptUrl');
        return { success: true, message: 'Google Sheets URL cleared. You will be prompted for a URL when exporting.' };
    }
    
    // Validate URL format (basic check)
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
        return { success: false, message: 'Invalid URL format. URL must start with http:// or https://' };
    }
    
    // Save the new URL
    localStorage.setItem('googleSheetsScriptUrl', newUrl.trim());
    return { success: true, message: 'Google Sheets URL updated successfully!' };
}

// Function to export data to Google Sheets
async function exportToGoogleSheets(matchData) {
    // Get the Google Apps Script Web App URL from localStorage or prompt user
    let scriptUrl = localStorage.getItem('googleSheetsScriptUrl');
    
    if (!scriptUrl) {
        scriptUrl = prompt('Please enter your Google Apps Script Web App URL:\n\n(If you haven\'t set it up yet, see GOOGLE_SHEETS_SETUP.md for instructions)');
        if (scriptUrl) {
            localStorage.setItem('googleSheetsScriptUrl', scriptUrl);
        } else {
            return { success: false, message: 'Google Sheets export cancelled - no URL provided' };
        }
    }
    
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script Web Apps require no-cors
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(matchData)
        });
        
        // Note: With no-cors mode, we can't read the response, but the data should be sent
        return { success: true, message: 'Data sent to Google Sheets successfully!' };
    } catch (error) {
        console.error('Error exporting to Google Sheets:', error);
        return { success: false, message: 'Error exporting to Google Sheets: ' + error.message };
    }
}

// Function to download data as CSV
function downloadCSV(matchData) {
    // Convert match data to CSV format based on type
    let headers, row;
    
    if (matchData.type === 'auto') {
        headers = ['Type', 'Quole', 'Team Number', 'Auto Counter', 'Auto Climbed', 'Timestamp'];
        row = [
            'auto',
            matchData.quole || '',
            matchData.teamNum || '',
            matchData.autoCounter || '',
            matchData.autoClimbed ? 'True' : 'False',
            matchData.timestamp || ''
        ];
    } else if (matchData.type === 'teleop') {
        headers = ['Type', 'Quole', 'Team Number', 'Teleop Counter', 'Climb Level', 'Timestamp'];
        row = [
            'teleop',
            matchData.quole || '',
            matchData.teamNum || '',
            matchData.teleopCounter || '',
            matchData.climbLevel || '',
            matchData.timestamp || ''
        ];
    } else {
        // Legacy format
        headers = ['Quole', 'Team Number', 'Counter', 'Timestamp'];
        row = [
            matchData.quole || '',
            matchData.teamNum || '',
            matchData.counter || '',
            matchData.timestamp || ''
        ];
    }
    
    // Escape values that contain commas or quotes
    const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
    };
    
    const csvContent = [
        headers.map(escapeCSV).join(','),
        row.map(escapeCSV).join(',')
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `scouting_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true, message: 'CSV file downloaded successfully!' };
}

// Main function to save and export match data
async function showData(){
    // Get current match data
    const matchData = createMatchData(counter);
    
    // Save to localStorage
    const saved = saveMatchToLocalStorage(matchData);
    if (!saved) {
        alert('Warning: Could not save data to local storage.');
    }
    
    // Try to export to Google Sheets
    const exportResult = await exportToGoogleSheets(matchData);
    
    if (exportResult.success) {
        alert('Match data saved and exported to Google Sheets!\n\n' + exportResult.message);
    } else {
        // If Google Sheets export fails, offer CSV download
        const useCSV = confirm('Google Sheets export failed or was cancelled.\n\n' + 
                               exportResult.message + 
                               '\n\nWould you like to download the data as a CSV file instead?');
        if (useCSV) {
            const csvResult = downloadCSV(matchData);
            if (csvResult.success) {
                alert(csvResult.message);
            }
        }
    }
    
    // Reset counter for next match
    counter = 0;
    if (document.getElementById("counter")) {
        document.getElementById("counter").innerText = counter;
    }
}
