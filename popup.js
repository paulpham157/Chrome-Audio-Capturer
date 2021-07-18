let interval;
let timeLeft;

// displays of recording time status and updates buttons
const displayStatus = function() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const status = document.getElementById("status");
    const timeRem = document.getElementById("timeRem");
    const startButton = document.getElementById("start");
    const finishButton = document.getElementById("finish");
    const cancelButton = document.getElementById("cancel");

    chrome.runtime.sendMessage({ currentTab: tabs[0].id }, response => {
      if (response) {
        chrome.storage.sync.get(
          {
            maxTime: 1200000,
            limitRemoved: false
          },
          options => {
            if (options.maxTime > 1200000) {
              chrome.storage.sync.set({
                maxTime: 1200000
              });
              timeLeft = 1200000 - (Date.now() - response);
            } else {
              timeLeft = options.maxTime - (Date.now() - response);
            }
            status.innerHTML = "Tab is currently being captured";
            if (options.limitRemoved) {
              timeRem.innerHTML = `${parseTime(Date.now() - response)}`;
              interval = setInterval(() => {
                timeRem.innerHTML = `${parseTime(Date.now() - response)}`;
              });
            } else {
              timeRem.innerHTML = `${parseTime(timeLeft)} remaining`;
              interval = setInterval(() => {
                timeLeft = timeLeft - 1000;
                timeRem.innerHTML = `${parseTime(timeLeft)} remaining`;
              }, 1000);
            }
          }
        );
        finishButton.style.display = "block";
        cancelButton.style.display = "block";
      } else {
        startButton.style.display = "block";
      }
    });
  });
};

// displays time remaining or time elapsed
const parseTime = function(time) {
  let minutes = Math.floor(time / 1000 / 60);
  let seconds = Math.floor((time / 1000) % 60);
  if (minutes < 10 && minutes >= 0) {
    minutes = "0" + minutes;
  } else if (minutes < 0) {
    minutes = "00";
  }
  if (seconds < 10 && seconds >= 0) {
    seconds = "0" + seconds;
  } else if (seconds < 0) {
    seconds = "00";
  }
  return `${minutes}:${seconds}`;
};

//manipulation of the displayed buttons upon message from background
chrome.runtime.onMessage.addListener(request => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const status = document.getElementById("status");
    const timeRem = document.getElementById("timeRem");

    const startButton = document.getElementById("start");
    const finishButton = document.getElementById("finish");
    const cancelButton = document.getElementById("cancel");
    if (request.captureStarted && request.captureStarted === tabs[0].id) {
      chrome.storage.sync.get(
        {
          maxTime: 1200000,
          limitRemoved: false
        },
        options => {
          if (options.maxTime > 1200000) {
            chrome.storage.sync.set({
              maxTime: 1200000
            });
            timeLeft = 1200000 - (Date.now() - request.startTime);
          } else {
            timeLeft = options.maxTime - (Date.now() - request.startTime);
          }
          status.innerHTML = "Tab is currently being captured";
          if (options.limitRemoved) {
            timeRem.innerHTML = `${parseTime(Date.now() - request.startTime)}`;
            interval = setInterval(() => {
              timeRem.innerHTML = `${parseTime(
                Date.now() - request.startTime
              )}`;
            }, 1000);
          } else {
            timeRem.innerHTML = `${parseTime(timeLeft)} remaining`;
            interval = setInterval(() => {
              timeLeft = timeLeft - 1000;
              timeRem.innerHTML = `${parseTime(timeLeft)} remaining`;
            }, 1000);
          }
        }
      );
      finishButton.style.display = "block";
      cancelButton.style.display = "block";
      startButton.style.display = "none";
    } else if (
      request.captureStopped &&
      request.captureStopped === tabs[0].id
    ) {
      status.innerHTML = "";
      finishButton.style.display = "none";
      cancelButton.style.display = "none";
      startButton.style.display = "block";
      timeRem.innerHTML = "";
      clearInterval(interval);
    }
  });
});

//initial display for popup menu when opened
document.addEventListener("DOMContentLoaded", function() {
  displayStatus();
  const startButton = document.getElementById("start");
  const finishButton = document.getElementById("finish");
  const cancelButton = document.getElementById("cancel");

  if (startButton) {
    startButton.onclick = () => {
      chrome.runtime.sendMessage("startCaptureFromPopupButton");
    };
  }

  if (finishButton) {
    finishButton.onclick = () => {
      chrome.runtime.sendMessage("stopCaptureFromPopupButton");
    };
  }

  if (cancelButton) {
    cancelButton.onclick = () => {
      chrome.runtime.sendMessage("cancelCapture");
    };
  }

  const options = document.getElementById("options");
  if (options) {
    options.onclick = () => {
      chrome.runtime.openOptionsPage();
    };
  }
});
