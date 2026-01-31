# Google Sheets Setup Instructions

This guide will help you set up Google Sheets integration for your Scouting App. The app will automatically send match data to a Google Sheet when you click "end Match".

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Scouting Data" or whatever you prefer
4. In the first row, add these column headers:
   - **Name** (Column A)
   - **Quole** (Column B)
   - **Team Number** (Column C)
   - **Counter** (Column D)
   - **Timestamp** (Column E)

## Step 2: Create a Google Apps Script

1. In your Google Sheet, click on **Extensions** → **Apps Script**
2. This will open a new tab with the Apps Script editor
3. Delete any default code that's there
4. Copy and paste the following code:

```javascript
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Append the data as a new row
    sheet.appendRow([
      data.name || '',
      data.quole || '',
      data.teamNum || '',
      data.counter || '',
      data.timestamp || ''
    ]);
    
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

## Step 4: Configure Your Scouting App

1. When you first click "end Match" in your scouting app, you'll be prompted to enter the Google Apps Script Web App URL
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
6. The next time you click "end Match", you'll be prompted to enter the URL again

**Option 2: Using Browser Settings (Alternative Method)**
1. Open your browser's Developer Tools (F12)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. In the left sidebar, expand **Local Storage**
4. Click on your website's URL
5. Find the entry named `googleSheetsScriptUrl`
6. Right-click it and select **Delete** (or select it and press Delete)
7. Close Developer Tools
8. The next time you click "end Match", you'll be prompted to enter the URL again

## Step 5: Test It Out

1. Go to your scouting app
2. Enter your name, quole, and team number
3. Click some counters
4. Click "end Match"
5. Check your Google Sheet - you should see a new row with your data!

## Troubleshooting

### Data isn't appearing in the sheet
- Make sure you deployed the Web App with "Who has access" set to **Anyone**
- Check that the column headers match exactly (Name, Quole, Team Number, Counter, Timestamp)
- Open the Apps Script editor and check **Executions** to see if there are any errors

### Getting "Script URL not found" error
- Make sure you copied the entire Web App URL
- The URL should look like: `https://script.google.com/macros/s/.../exec`
- Try re-entering the URL when prompted

### Need to update or change the script URL?
- See the "How to Change or Re-enter the Google Sheets URL" section above in Step 4

## Alternative: CSV Download

If you prefer not to use Google Sheets, the app also offers a CSV download option. When Google Sheets export fails or is cancelled, you'll be prompted to download a CSV file instead, which you can then manually import into Google Sheets or any other spreadsheet program.
