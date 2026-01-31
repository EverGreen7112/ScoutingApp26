// Function to save Name and Quole from logIn.html to sessionStorage
function saveLoginData() {
    const name = document.getElementById("name").value;
    const quole = document.getElementById("quole").value;
    const teamNum = document.getElementById("teamNum").value;
    
    if (name && quole && teamNum) {
        sessionStorage.setItem("scouterName", name);
        sessionStorage.setItem("quole", quole);
        sessionStorage.setItem("teamNum", teamNum)
        return true;
    }
    return false;
}

// Function to get Name and Quole from sessionStorage
function getLoginData() {
    return {
        name: sessionStorage.getItem("scouterName") || "",
        quole: sessionStorage.getItem("quole") || "",
        teamNum: sessionStorage.getItem("teamNum") || ""

    };
}

// Function to create JSON from Name, Quole, and counter
function createJSON(counter) {
    const loginData = getLoginData();
    
    const jsonData = {
        name: loginData.name,
        quole: loginData.quole,
        teamNum: loginData.teamNum,
        counter: counter
    };
    return JSON.stringify(jsonData, null, 2);
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

function showData(){
    // Function to print the data from data.Json (downloaded file)
    // We'll read the file using the FileReader API (user selected file)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const content = evt.target.result;
                    const data = JSON.parse(content);
                    // Print data - could be shown in alert or console
                    alert(JSON.stringify(data, null, 2));
                    // Or: console.log(data);
                } catch (e) {
                    alert("Error parsing JSON: " + e.message);
                }
            };
            reader.readAsText(file);
        }
    };
    // Trigger file selector
    input.click();
}
