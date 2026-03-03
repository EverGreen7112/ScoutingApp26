# Google Sheets Setup Instructions

This guide will help you set up Google Sheets integration for your Scouting App. The app will automatically send match data (Auto and Teleop) to a Google Sheet when you click "End Auto" or "End Match".

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Scouting Data" or whatever you prefer
4. **That's it!** The script will automatically create the necessary sheets and structure.

### 📊 Three-Layer Structure

Your spreadsheet will automatically have **3 logical layers**:

#### 1️⃣ **RawData Sheet** (Created Automatically)
- **Purpose**: Receives every POST request from your app
- **Never edit manually** - This is your single source of truth
- **Append-only** - Data is never deleted or modified
- **Columns**: Type, Quale, Team Number, Auto Counter, Auto Delivery, Auto Climb, Teleop Counter, Teleop Delivery, Climb Level, Climb Time, Defense, Timestamp

#### 2️⃣ **Team_XXX Sheets** (Created Automatically)
- **One sheet per team** (e.g., `Team_254`, `Team_1678`)
- Created automatically when a team appears in RawData
- Each sheet has two sections:
  - **AUTO Section**: Shows all auto data for that team
  - **TELEOP Section**: Shows all teleop data for that team
- Data is automatically organized and sorted by timestamp

#### 3️⃣ **Dashboard Sheet** (Optional - You can create this later)
- For analysis and summaries
- Can compare teams, calculate averages, etc.
- Not created automatically - you can add this if needed

## Step 2: Create a Google Apps Script

1. In your Google Sheet, click on **Extensions** → **Apps Script**
2. This will open a new tab with the Apps Script editor
3. Delete any default code that's there
4. Copy and paste the following code:

```javascript
// ============================================
// MAIN ENTRY POINT - Receives POST requests
// ============================================
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.teamNum) {
      throw new Error('Team Number is required');
    }
    
    // Get or create RawData sheet
    const rawDataSheet = getOrCreateRawDataSheet();
    
    // Format row data for RawData
    let rowData = [];
    if (data.type === 'auto') {
      rowData = [
        'auto',
        data.quale || data.quole || '',
        data.teamNum || '',
        data.autoCounter || 0,
        data.autoDelivery || data.deliveryCounter || 0,
        (data.autoClimb !== undefined) ? data.autoClimb : (data.autoClimbed ? data.autoClimbed : ''),
        '', // Teleop Counter (empty for auto)
        '', // Teleop Delivery (empty for auto)
        '', // Climb Level (empty for auto)
        '', // Climb Time (empty for auto)
        '', // Defense (empty for auto)
        data.timestamp || ''
      ];
    } else if (data.type === 'teleop') {
      rowData = [
        'teleop',
        data.quale || data.quole || '',
        data.teamNum || '',
        '', // Auto Counter (empty for teleop)
        '', // Auto Delivery (empty for teleop)
        '', // Auto Climb (empty for teleop)
        data.teleopCounter || 0,
        data.teleopDelivery || data.deliveryCounter || 0,
        data.climbLevel || '',
        data.climbTime || '',
        data.defense || '',
        data.timestamp || ''
      ];
    } else {
      // Legacy format (for backward compatibility) - best-effort map
      rowData = [
        data.type || '',
        data.quale || data.quole || '',
        data.teamNum || '',
        data.autoCounter || data.counter || data.teleopCounter || 0,
        data.autoDelivery || data.deliveryCounter || 0,
        data.autoClimb || data.autoClimbed || '',
        data.teleopCounter || '',
        data.deliveryCounter || 0,
        data.climbLevel || '',
        data.climbTime || '',
        data.defense || '',
        data.timestamp || ''
      ];
    }
    
    // Append to RawData (append-only, never edited manually)
    rawDataSheet.appendRow(rowData);
    
    // Organize data into team sheet
    updateTeamSheet(data.teamNum);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data added successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// RAW DATA SHEET MANAGEMENT
// ============================================
function getOrCreateRawDataSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let rawDataSheet = spreadsheet.getSheetByName('RawData');
  
  if (!rawDataSheet) {
    // Create RawData sheet
    rawDataSheet = spreadsheet.insertSheet('RawData');
    
    // Set up headers
    const headers = [
      'Type',
      'Quale',
      'Team Number',
      'Auto Counter',
      'Auto Delivery',
      'Auto Climb',
      'Teleop Counter',
      'Teleop Delivery',
      'Climb Level',
      'Climb Time',
      'Defense',
      'Timestamp'
    ];
    rawDataSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format header row
    const headerRange = rawDataSheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    
    // Freeze header row
    rawDataSheet.setFrozenRows(1);
  }
  
  return rawDataSheet;
}

// ============================================
// TEAM SHEET MANAGEMENT
// ============================================
function getOrCreateTeamSheet(teamNumber) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'Team_' + teamNumber;
  let teamSheet = spreadsheet.getSheetByName(sheetName);
  
  if (!teamSheet) {
    // Create team sheet
    teamSheet = spreadsheet.insertSheet(sheetName);
    
    // Set up AUTO section
    teamSheet.getRange(1, 1).setValue('TEAM ' + teamNumber + ' — AUTO');
    teamSheet.getRange(1, 1).setFontWeight('bold');
    teamSheet.getRange(1, 1).setFontSize(14);
    teamSheet.getRange(1, 1, 1, 5).merge();
    
    const autoHeaders = ['Timestamp', 'Quale', 'Auto Counter', 'Auto Delivery', 'Auto Climb'];
    teamSheet.getRange(2, 1, 1, autoHeaders.length).setValues([autoHeaders]);
    teamSheet.getRange(2, 1, 1, autoHeaders.length).setFontWeight('bold');
    teamSheet.getRange(2, 1, 1, autoHeaders.length).setBackground('#e3f2fd');
    
    // Set up TELEOP section (start at row 4 to leave space)
    const teleopStartRow = 4;
    teamSheet.getRange(teleopStartRow, 1).setValue('TEAM ' + teamNumber + ' — TELEOP');
    teamSheet.getRange(teleopStartRow, 1).setFontWeight('bold');
    teamSheet.getRange(teleopStartRow, 1).setFontSize(14);
    teamSheet.getRange(teleopStartRow, 1, 1, 7).merge();
    
    const teleopHeaders = ['Timestamp', 'Quale', 'Teleop Counter', 'Teleop Delivery', 'Climb Level', 'Climb Time', 'Defense'];
    teamSheet.getRange(teleopStartRow + 1, 1, 1, teleopHeaders.length).setValues([teleopHeaders]);
    teamSheet.getRange(teleopStartRow + 1, 1, 1, teleopHeaders.length).setFontWeight('bold');
    teamSheet.getRange(teleopStartRow + 1, 1, 1, teleopHeaders.length).setBackground('#fff3e0');
    
    // Freeze header rows
    teamSheet.setFrozenRows(1);
  }
  
  return teamSheet;
}

// ============================================
// UPDATE TEAM SHEET WITH DATA FROM RAWDATA
// ============================================
function updateTeamSheet(teamNumber) {
  try {
    const rawDataSheet = getOrCreateRawDataSheet();
    const teamSheet = getOrCreateTeamSheet(teamNumber);
    
    // Get all data from RawData
    const rawData = rawDataSheet.getDataRange().getValues();
    const headers = rawData[0];
    
    // Find column indices
    const typeCol = headers.indexOf('Type');
    const teamCol = headers.indexOf('Team Number');
    const qualeCol = headers.indexOf('Quale');
    const autoCounterCol = headers.indexOf('Auto Counter');
    const autoDeliveryCol = headers.indexOf('Auto Delivery');
    const autoClimbCol = headers.indexOf('Auto Climb');
    const teleopCounterCol = headers.indexOf('Teleop Counter');
    const teleopDeliveryCol = headers.indexOf('Teleop Delivery');
    const climbLevelCol = headers.indexOf('Climb Level');
    const climbTimeCol = headers.indexOf('Climb Time');
    const defenseCol = headers.indexOf('Defense');
    const timestampCol = headers.indexOf('Timestamp');
    
    // Filter data for this team
    const autoRows = [];
    const teleopRows = [];
    
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (row[teamCol] == teamNumber) {
        if (row[typeCol] === 'auto') {
          autoRows.push([
            row[timestampCol] || '',
            row[qualeCol] || '',
            row[autoCounterCol] || 0,
            row[autoDeliveryCol] || 0,
            row[autoClimbCol] || ''
          ]);
        } else if (row[typeCol] === 'teleop') {
          teleopRows.push([
            row[timestampCol] || '',
            row[qualeCol] || '',
            row[teleopCounterCol] || 0,
            row[teleopDeliveryCol] || 0,
            row[climbLevelCol] || '',
            row[climbTimeCol] || '',
            row[defenseCol] || ''
          ]);
        }
      }
    }
    
    // Sort by timestamp (oldest first), then delivery desc, then counters/climb/defense
    autoRows.sort((a, b) => {
      // a[0]=Timestamp, a[3]=Auto Delivery, a[2]=Auto Counter, a[4]=Auto Climb
      const dateA = a[0] ? new Date(a[0]) : null;
      const dateB = b[0] ? new Date(b[0]) : null;
      if (dateA && dateB) {
        const d = dateA - dateB;
        if (d !== 0) return d; // oldest first
      } else if (dateA && !dateB) {
        return 1;
      } else if (!dateA && dateB) {
        return -1;
      }

      const deliveryA = Number(a[3] || 0);
      const deliveryB = Number(b[3] || 0);
      if (deliveryA !== deliveryB) return deliveryB - deliveryA; // delivery desc

      const counterA = Number(a[2] || 0);
      const counterB = Number(b[2] || 0);
      if (counterA !== counterB) return counterB - counterA; // higher score first

      const climbA = Number(a[4] || 0);
      const climbB = Number(b[4] || 0);
      if (climbA !== climbB) return climbB - climbA; // climb desc

      return 0;
    });

    teleopRows.sort((a, b) => {
      // a[0]=Timestamp, a[3]=Teleop Delivery, a[4]=Climb Level, a[6]=Defense, a[2]=Teleop Counter, a[5]=Climb Time
      const dateA = a[0] ? new Date(a[0]) : null;
      const dateB = b[0] ? new Date(b[0]) : null;
      if (dateA && dateB) {
        const d = dateA - dateB;
        if (d !== 0) return d; // oldest first
      } else if (dateA && !dateB) {
        return 1;
      } else if (!dateA && dateB) {
        return -1;
      }

      const deliveryA = Number(a[3] || 0);
      const deliveryB = Number(b[3] || 0);
      if (deliveryA !== deliveryB) return deliveryB - deliveryA; // delivery desc

      const climbA = Number(a[4] || 0);
      const climbB = Number(b[4] || 0);
      if (climbA !== climbB) return climbB - climbA; // climb level desc

      const defenseA = (a[6] || '').toString();
      const defenseB = (b[6] || '').toString();
      if (defenseA !== defenseB) return defenseA.localeCompare(defenseB); // defense asc

      const teleopA = Number(a[2] || 0);
      const teleopB = Number(b[2] || 0);
      if (teleopA !== teleopB) return teleopB - teleopA; // teleop counter desc

      const climbTimeA = Number(a[5] || 0);
      const climbTimeB = Number(b[5] || 0);
      if (climbTimeA !== climbTimeB) return climbTimeA - climbTimeB; // shorter climb time first

      return 0;
    });
    
    // Clear existing data (but keep headers)
    // AUTO section starts at row 3 (row 1 is title, row 2 is headers)
    const autoDataStartRow = 3;
    const autoDataEndRow = teamSheet.getLastRow();
    if (autoDataEndRow >= autoDataStartRow) {
      teamSheet.deleteRows(autoDataStartRow, autoDataEndRow - autoDataStartRow + 1);
    }
    
    // Insert AUTO data
    if (autoRows.length > 0) {
      teamSheet.getRange(autoDataStartRow, 1, autoRows.length, 5).setValues(autoRows);
      // Compute Auto average (Auto Counter average) and write it on the header row (col 7)
      let autoSum = 0;
      let autoCount = 0;
      for (let i = 0; i < autoRows.length; i++) {
        const val = Number(autoRows[i][2] || 0);
        if (!isNaN(val)) { autoSum += val; autoCount++; }
      }
      const autoAvg = autoCount > 0 ? (autoSum / autoCount) : 0;
      teamSheet.getRange(2, 7).setValue('Auto Avg');
      teamSheet.getRange(2, 8).setValue(autoAvg);
      // style the average cells
      teamSheet.getRange(2, 7, 1, 2).setFontWeight('bold').setFontSize(12).setBackground('#ffeb3b');
    } else {
      teamSheet.getRange(2, 7).clearContent().setBackground(null);
      teamSheet.getRange(2, 8).clearContent().setBackground(null);
    }
    
    // TELEOP section starts at row 4 (after AUTO section)
    // Calculate where TELEOP section should start (after AUTO section + spacing)
    const teleopDataStartRow = autoDataStartRow + autoRows.length + 2;
    
    // Insert TELEOP section header if not exists
    if (teamSheet.getRange(teleopDataStartRow - 1, 1).getValue() === '') {
      teamSheet.getRange(teleopDataStartRow - 1, 1).setValue('TEAM ' + teamNumber + ' — TELEOP');
      teamSheet.getRange(teleopDataStartRow - 1, 1).setFontWeight('bold');
      teamSheet.getRange(teleopDataStartRow - 1, 1).setFontSize(14);
      teamSheet.getRange(teleopDataStartRow - 1, 1, 1, 7).merge();
      
      const teleopHeaders = ['Timestamp', 'Quale', 'Teleop Counter', 'Teleop Delivery', 'Climb Level', 'Climb Time', 'Defense'];
      teamSheet.getRange(teleopDataStartRow, 1, 1, teleopHeaders.length).setValues([teleopHeaders]);
      teamSheet.getRange(teleopDataStartRow, 1, 1, teleopHeaders.length).setFontWeight('bold');
      teamSheet.getRange(teleopDataStartRow, 1, 1, teleopHeaders.length).setBackground('#fff3e0');
    }
    
    // Insert TELEOP data
    if (teleopRows.length > 0) {
      teamSheet.getRange(teleopDataStartRow + 1, 1, teleopRows.length, 7).setValues(teleopRows);
      // Compute Teleop average (Teleop Counter average) and write it on the teleop header row (next to headers)
      let teleopSum = 0;
      let teleopCount = 0;
      for (let i = 0; i < teleopRows.length; i++) {
        const val = Number(teleopRows[i][2] || 0);
        if (!isNaN(val)) { teleopSum += val; teleopCount++; }
      }
      const teleopAvg = teleopCount > 0 ? (teleopSum / teleopCount) : 0;
      teamSheet.getRange(teleopDataStartRow, 8).setValue('Teleop Avg');
      teamSheet.getRange(teleopDataStartRow, 9).setValue(teleopAvg);
      // style teleop avg
      teamSheet.getRange(teleopDataStartRow, 8, 1, 2).setFontWeight('bold').setFontSize(12).setBackground('#ffeb3b');
    } else {
      teamSheet.getRange(teleopDataStartRow, 8).clearContent().setBackground(null);
      teamSheet.getRange(teleopDataStartRow, 9).clearContent().setBackground(null);
    }
    
  } catch (error) {
    console.error('Error updating team sheet for team ' + teamNumber + ': ' + error.toString());
    // Don't throw - we still want to return success for the POST
  }
}

// ============================================
// ORGANIZE ALL EXISTING DATA (One-time setup)
// ============================================
function organizeAllData() {
  try {
    const rawDataSheet = getOrCreateRawDataSheet();
    const rawData = rawDataSheet.getDataRange().getValues();
    
    if (rawData.length <= 1) {
      return 'No data to organize';
    }
    
    // Get all unique team numbers
    const teamCol = rawData[0].indexOf('Team Number');
    const teams = new Set();
    
    for (let i = 1; i < rawData.length; i++) {
      const teamNum = rawData[i][teamCol];
      if (teamNum) {
        teams.add(teamNum);
      }
    }
    
    // Organize each team
    let organized = 0;
    for (const teamNum of teams) {
      updateTeamSheet(teamNum);
      organized++;
    }
    
    return 'Organized data for ' + organized + ' team(s)';
    
  } catch (error) {
    return 'Error: ' + error.toString();
  }
}
```

5. Click **Save** (or press Ctrl+S / Cmd+S)
6. Give your project a name (e.g., "Scouting App Web App")

## Step 3: Deploy as Web App

1. Click on **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "Scouting App Data Receiver" (or any description you like)
   - **Execute as**: Select **Me** (your email address)
   - **Who has access**: Select **Anyone** (this allows your app to send data without authentication)
4. Click **Deploy**
5. You may be prompted to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Your Project Name] (unsafe)**
   - Click **Allow**
6. After authorization, you'll see a **Web app URL**
7. **Copy this URL** - you'll need it in the next step

## Step 3.5: Initial Setup (Optional - For Existing Data)

If you already have data in your spreadsheet or want to organize existing RawData, you can run the `organizeAllData()` function:

1. In the Apps Script editor, click on the function dropdown (top left)
2. Select `organizeAllData`
3. Click the **Run** button (▶️)
4. Authorize if prompted
5. Check the execution log - it will show how many teams were organized

**Note**: This function reads all data from RawData and creates/updates team sheets. It's safe to run multiple times - it will reorganize everything from RawData.

### How Automatic Organization Works

- **RawData sheet** is created automatically on first POST request
- **Team sheets** (Team_XXX) are created automatically when a new team number appears
- Data is automatically copied from RawData to the appropriate team sheet
- Auto data goes to the AUTO section, Teleop data goes to the TELEOP section
- Data is sorted by timestamp (oldest first)

**You don't need to do anything manually** - the script handles all organization automatically!

## Step 4: Configure Your Scouting App

1. When you first click "End Auto" or "End Match" in your scouting app, you'll be prompted to enter the Google Apps Script Web App URL
2. Paste the URL you copied in Step 3
3. Click OK
4. The URL will be saved in your browser's localStorage, so you won't need to enter it again

### How to Change or Re-enter the Google Sheets URL

If you need to change the URL (for example, if you created a new Google Sheet or Web App), you have two options:

**Option 1: Using Browser Developer Console (Quick Method)**
1. Open your scouting app in the browser
2. Press **F12** (or right-click → Inspect) to open Developer Tools
3. Click on the **Console** tab
4. Type this command and press Enter:
   ```javascript
   localStorage.removeItem('googleSheetsScriptUrl')
   ```
5. Close the Developer Tools
6. The next time you click "End Auto" or "End Match", you'll be prompted to enter the URL again

**Option 2: Using Browser Settings (Alternative Method)**
1. Open your browser's Developer Tools (F12)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. In the left sidebar, expand **Local Storage**
4. Click on your website's URL
5. Find the entry named `googleSheetsScriptUrl`
6. Right-click it and select **Delete** (or select it and press Delete)
7. Close Developer Tools
8. The next time you click "End Auto" or "End Match", you'll be prompted to enter the URL again

## Step 5: Test It Out

1. Go to your scouting app
2. Enter quole and team number, then click "Start Match"
3. In the Auto page, click the counter button and toggle the climb button if needed
4. Click "End Auto" - this will save auto data and move to Teleop
5. In the Teleop page, click the counter button
6. Click "End Match" - select a climb level (No Climb, L1, L2, or L3)
7. Check your Google Sheet:
   - **RawData sheet**: You should see two rows (one auto, one teleop)
   - **Team_XXX sheet**: A new sheet should be created with your team number
   - The team sheet should have AUTO and TELEOP sections with your data organized

## Troubleshooting

### Data isn't appearing in RawData sheet
- Make sure you deployed the Web App with "Who has access" set to **Anyone**
- Open the Apps Script editor and check **Executions** to see if there are any errors
- Check that your POST request includes a valid `teamNum` field (required)
- Verify the data format matches what the script expects

### Team sheets (Team_XXX) are not appearing
- **First check**: Look for the "RawData" sheet - data should appear there first
- Team sheets are created automatically when data for that team arrives
- If RawData has data but no team sheets:
  1. Open Apps Script editor
  2. Select `organizeAllData` function
  3. Click Run (▶️)
  4. This will create/update all team sheets from existing RawData
- Check the execution log for any errors

### Data appears in RawData but not in team sheets
- This usually means the organization step failed silently
- Run `organizeAllData()` function manually (see Step 3.5)
- Check the execution log for error messages
- Verify team numbers in RawData are valid (not empty, not null)

### Team sheet exists but sections are empty
- Run `organizeAllData()` to reorganize all data
- Or manually run `updateTeamSheet(teamNumber)` for a specific team
- Check that RawData has rows with matching Team Number and Type

### Getting "Script URL not found" error
- Make sure you copied the entire Web App URL
- The URL should look like: `https://script.google.com/macros/s/.../exec`
- Try re-entering the URL when prompted

### Need to update or change the script URL?
- See the "How to Change or Re-enter the Google Sheets URL" section above in Step 4

### How to manually trigger organization
If team sheets aren't updating automatically:
1. Open Apps Script editor
2. Select `organizeAllData` from the function dropdown
3. Click Run (▶️)
4. Check execution log for results

To organize a specific team:
1. Open Apps Script editor
2. In the console, type: `updateTeamSheet(254)` (replace 254 with your team number)
3. Press Enter

## Alternative: CSV Download

If you prefer not to use Google Sheets, the app also offers a CSV download option. When Google Sheets export fails or is cancelled, you'll be prompted to download a CSV file instead, which you can then manually import into Google Sheets or any other spreadsheet program.
