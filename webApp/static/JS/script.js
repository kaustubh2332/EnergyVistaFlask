const box3 = document.querySelector(".box3");
const tl = gsap.timeline();
let pollingIntervals = {};
let minPower = 0;
let maxPower = Infinity;

// Modal elements
const modal = document.getElementById("powerModal");
const closeModal = document.querySelector(".close");
const setLimitsButton = document.getElementById("setLimits");

// Define the function to fetch data and update the UI
const fetchDataAndUpdateUI = async (url, applianceId, applianceName) => {
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Clear previous data
    const appliance = document.querySelector(applianceId);
    appliance.innerHTML = '';  // Clear the content of the appliance element

    // Add new data
    box3.style.display = "block";
    box3.style.display = "flex";
    box3.style.alignItems = "center";
    box3.style.justifyContent = "space-evenly";

    const h2 = document.createElement("h2");
    h2.textContent = applianceName;
    appliance.appendChild(h2);

    const dataPoints = [
      `Timestamp: ${data.Timestamp}`,
      `Voltage: ${data.Voltage} V`,
      `Current: ${data.Current} A`,
      `Power: ${data.Power} W`,
      `Energy: ${data.Energy} kWh`,
      `Frequency: ${data.Frequency} Hz`,
      `Power Factor: ${data["Power Factor"]}`
    ];

    dataPoints.forEach(point => {
      let span = document.createElement("span");
      span.className = "realtimedata";
      span.textContent = point;
      appliance.appendChild(span);
    });

    // Check power and update box shadow
    const power = data.Power;
    if(minPower!=0 && maxPower!=0)
    {
       
      if (power < minPower) {
        appliance.style.boxShadow = "4px 4px 6px -1px rgba(0,0,0,0.15),-4px -4px 6px -1px rgba(255,255,255,1)";
      } else if (power >= minPower && power <= maxPower) {
        appliance.style.boxShadow = "0 0 10px orange";
      } else if (power > maxPower) {
        appliance.style.boxShadow = "0 0 10px red";
      }
    
    }
    else{
      appliance.style.boxShadow = "4px 4px 6px -1px rgba(0,0,0,0.15),-4px -4px 6px -1px rgba(255,255,255,1)";
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    // Handle errors gracefully (e.g., display an error message)
  }
};

// Function to fetch data in sequence
const fetchSequentially = async (urls, applianceNames) => {
  for (let i = 0; i < urls.length; i++) {
    await fetchDataAndUpdateUI(urls[i], `#appliance-${i + 1}`, applianceNames[i]);
  }
};

// Start data polling for a given section
const startPolling = (urls, applianceNames, interval = 5000) => {
  // Clear previous intervals
  if (pollingIntervals[urls[0]]) {
    clearInterval(pollingIntervals[urls[0]]);
  }

  // Set up new intervals
  pollingIntervals[urls[0]] = setInterval(() => {
    fetchSequentially(urls, applianceNames);
  }, interval);
};

// Function to handle section clicks and start polling
const handleSectionClick = (urls, applianceNames) => {
  tl.from(".card", {
    scale: 0,
    opacity: 0,
    stagger: 3,
    duration: 0.5
  });

  // Start polling
  startPolling(urls, applianceNames);
};

// Event listener for lecture_hall
const lecture_hall = document.getElementById("lecture_hall");
lecture_hall.addEventListener("click", () => {
  handleSectionClick(
    [
      'https://script.google.com/macros/s/AKfycbx4suwMYqgGeVUAXvaoAsXRcEQXnSS6QHcbktarPVCxEd0yCaewa9jUSqGHNSmDPGhn/exec?module=MODULE30',
      'https://script.google.com/macros/s/AKfycbx4suwMYqgGeVUAXvaoAsXRcEQXnSS6QHcbktarPVCxEd0yCaewa9jUSqGHNSmDPGhn/exec?module=MODULE21',
      'https://script.google.com/macros/s/AKfycbx4suwMYqgGeVUAXvaoAsXRcEQXnSS6QHcbktarPVCxEd0yCaewa9jUSqGHNSmDPGhn/exec?module=MODULE28'
    ],
    ["APPLIANCE-1", "APPLIANCE-2", "APPLIANCE-3"]
  );
});

// Event listener for canteen
const canteen = document.getElementById("canteen");
canteen.addEventListener("click", () => {
  handleSectionClick(
    [
      'https://script.google.com/macros/s/AKfycbx4suwMYqgGeVUAXvaoAsXRcEQXnSS6QHcbktarPVCxEd0yCaewa9jUSqGHNSmDPGhn/exec?module=MODULE29',
      'https://script.google.com/macros/s/AKfycbx4suwMYqgGeVUAXvaoAsXRcEQXnSS6QHcbktarPVCxEd0yCaewa9jUSqGHNSmDPGhn/exec?module=MODULE24',
      'https://script.google.com/macros/s/AKfycbx4suwMYqgGeVUAXvaoAsXRcEQXnSS6QHcbktarPVCxEd0yCaewa9jUSqGHNSmDPGhn/exec?module=MODULE25'
    ],
    ["APPLIANCE-1", "APPLIANCE-2", "APPLIANCE-3"]
  );
});

// Event listener for lab
const lab = document.getElementById("lab");
lab.addEventListener("click", () => {
  handleSectionClick(
    [
      'https://script.google.com/macros/s/AKfycbx4suwMYqgGeVUAXvaoAsXRcEQXnSS6QHcbktarPVCxEd0yCaewa9jUSqGHNSmDPGhn/exec?module=MODULE23',
      'https://script.google.com/macros/s/AKfycbx4suwMYqgGeVUAXvaoAsXRcEQXnSS6QHcbktarPVCxEd0yCaewa9jUSqGHNSmDPGhn/exec?module=MODULE22',
      'https://script.google.com/macros/s/AKfycbx4suwMYqgGeVUAXvaoAsXRcEQXnSS6QHcbktarPVCxEd0yCaewa9jUSqGHNSmDPGhn/exec?module=MODULE27'
    ],
    ["APPLIANCE-1", "APPLIANCE-2", "APPLIANCE-3"]
  );
});

// Event listener for fire button
const firebtn = document.getElementById("firebtn");
firebtn.addEventListener("click", () => {
  modal.style.display = "block";
});

// Event listener for modal close button
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

// Event listener for set limits button
setLimitsButton.addEventListener("click", () => {
  minPower = parseFloat(document.getElementById("minPower").value) || 0;
  maxPower = parseFloat(document.getElementById("maxPower").value) || Infinity;
  modal.style.display = "none";
});

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
