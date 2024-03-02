let transcript = [];
let numInterruptions = 0;
let personNameBuffer = "", transcriptTextBuffer = "";
let beforePersonName = "", beforeTranscriptText = "";
const options = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
};
let meetingStartTimeStamp = new Date().toLocaleString("default", options).replace(/[/:]/g, '-')
let meetingTitle = document.title
const extensionStatusJSON_bug = {
  "status": 400,
  "message": "<strong>TranscripTonic seems to have an error</strong> <br /> Please report it <a href='https://github.com/vivek-nexus/transcriptonic/issues' target='_blank'>here</a>."
}

checkExtensionStatus().then(() => {
  // Read the status JSON
  chrome.storage.local.get(["extensionStatusJSON"], function (result) {
    let extensionStatusJSON = result.extensionStatusJSON;
    console.log("Extension status " + extensionStatusJSON.status);

    if (extensionStatusJSON.status == 200) {
      checkElement(".google-material-icons", "call_end").then(() => {
        if (contains(".material-icons-extended", "closed_caption_off")[0]) {
          const captionsButton = contains(".material-icons-extended", "closed_caption_off")[0]

          console.log("Meeting started")
          setTimeout(() => {
            // pick up meeting name after a delay
            meetingTitle = updateMeetingTitle()
          }, 5000);

          chrome.storage.sync.get(["operationMode"], function (result) {
            if (result.operationMode == "manual")
              console.log("Manual mode selected, leaving transcript off")
            else
              captionsButton.click()
          })

          const targetNode = document.querySelector('.a4cQT') ? document.querySelector('.a4cQT') : undefined
          const config = { childList: true, attributes: true, subtree: true };
          // Create an observer instance linked to the callback function
          const observer = new MutationObserver(transcriber);

          // Start observing the target node for configured mutations
          if (targetNode) {
            observer.observe(targetNode, config)
            chrome.storage.sync.get(["operationMode"], function (result) {
              if (result.operationMode == "manual")
                showNotification({ status: 400, message: "<strong>TranscripTonic is not running</strong> <br /> Turn on captions using the CC icon, if needed" })
              else
                showNotification(extensionStatusJSON)
            })
          }
          else {
            showNotification(extensionStatusJSON_bug)
          }

          window.addEventListener("beforeunload", beforeUnloadCallback)

          contains(".google-material-icons", "call_end")[0].parentElement.addEventListener("click", () => {
            window.removeEventListener("beforeunload", beforeUnloadCallback)
            observer.disconnect();
            if ((personNameBuffer != "") && (transcriptTextBuffer != ""))
              pushToTranscript()
            chrome.storage.local.set(
              {
                numInterruptions: numInterruptions,
                transcript: transcript,
                meetingTitle: meetingTitle,
                meetingStartTimeStamp: meetingStartTimeStamp
              },
              function () {
                console.log(`Transcript length ${transcript.length}`)
                if (transcript.length > 0) {
                  chrome.runtime.sendMessage({ type: "download" }, function (response) {
                    console.log(response);
                  });
                }
              })
          })
        }
        else {
          showNotification(extensionStatusJSON_bug)
        }
      })
    }
    else {
      checkElement(".google-material-icons", "call_end").then(() => {
        showNotification(extensionStatusJSON);
      })
    }
  })
})

function contains(selector, text) {
  var elements = document.querySelectorAll(selector);
  return Array.prototype.filter.call(elements, function (element) {
    return RegExp(text).test(element.textContent);
  });
}

const checkElement = async (selector, text) => {
  if (text) {
    while (!Array.from(document.querySelectorAll(selector)).find(element => element.textContent === text)) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }
  else {
    while (!document.querySelector(selector)) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }
  return document.querySelector(selector);
}

function showInterruption() {
  numInterruptions++;

  // Remove previous notification if exists
  let previousNotification = document.querySelector(".notification");
  if (previousNotification)
    previousNotification.remove();

  // Banner CSS
  let html = document.querySelector("html");
  let obj = document.createElement("div");
  obj.classList.add("notification");
  let text = document.createElement("p");
  let closeButton = document.createElement("button");

  // Remove banner after 4s
  timeoutId = setTimeout(() => {
    obj.style.display = "none";
  }, 4000);

  obj.style.cssText = `color: #2A9ACA; ${commonCSS};`;
  text.innerHTML = "Oops! We think you interrupted someone!";
  closeButton.innerHTML = "x";
  closeButton.style.cssText = "position: absolute; top: 5px; right: 5px; cursor: pointer; background: none; border: none; padding: 0; font-size: 16px; line-height: 1; color: #000;";

  closeButton.addEventListener("click", () => {
    clearTimeout(timeoutId);
    obj.style.display = "none";
  });

  obj.prepend(text);
  obj.prepend(closeButton);
  if (html)
    html.append(obj);
}

function showNotification(extensionStatusJSON) {
  // Banner CSS
  let html = document.querySelector("html");
  let obj = document.createElement("div");
  let logo = document.createElement("img");
  let text = document.createElement("p");

  logo.setAttribute(
    "src",
    "https://ejnana.github.io/transcripto-status/icon.png"
  );
  logo.setAttribute("height", "32px");
  logo.setAttribute("width", "32px");
  logo.style.cssText = "border-radius: 4px";

  // Remove banner after 5s
  setTimeout(() => {
    obj.style.display = "none";
  }, 5000);

  if (extensionStatusJSON.status == 200) {
    obj.style.cssText = `color: #2A9ACA; ${commonCSS}`;
    text.innerHTML = extensionStatusJSON.message;
  }
  else {
    obj.style.cssText = `color: orange; ${commonCSS}`;
    text.innerHTML = extensionStatusJSON.message;
  }

  obj.prepend(text);
  obj.prepend(logo);
  if (html)
    html.append(obj);
}

const commonCSS = `background: rgb(255 255 255 / 25%);
    backdrop-filter: blur(16px);
    position: fixed;
    top: 5%;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    max-width: 780px;
    z-index: 1000;
    padding: 0rem 1rem;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    font-size: 1rem;
    line-height: 1.5;
    font-family: 'Google Sans',Roboto,Arial,sans-serif;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;`;


function beforeUnloadCallback() {
  if ((personNameBuffer != "") && (transcriptTextBuffer != ""))
    pushToTranscript()

  chrome.runtime.sendMessage(
    {
      type: "save_and_download",
      numInterruptions: numInterruptions,
      transcript: transcript,
      meetingTitle: meetingTitle,
      meetingStartTimeStamp: meetingStartTimeStamp,
    },
    function (response) {
      console.log(response)
    })
}

function transcriber(mutationsList, observer) {
  // Callback function to execute when mutations are observed
  setTimeout(() => {
    mutationsList.forEach(mutation => {
      if (document.querySelector('.a4cQT').firstChild.firstChild.childNodes.length > 0) {
        const people = document.querySelector('.a4cQT').firstChild.firstChild.childNodes

        const person = people[people.length - 1]
        if ((!person.childNodes[0]) || (!person.childNodes[1]?.lastChild)) {
          console.log("There is a bug in TranscripTonic. Please report it at https://github.com/vivek-nexus/transcriptonic/issues")
          showNotification(extensionStatusJSON_bug)
          return
        }
        const currentPersonName = person.childNodes[0] ? person.childNodes[0].textContent : ""
        const currentTranscriptText = person.childNodes[1].lastChild ? person.childNodes[1].lastChild.textContent : ""

        if (beforeTranscriptText == "") {
          personNameBuffer = currentPersonName
          beforeTranscriptText = currentTranscriptText
          transcriptTextBuffer += currentTranscriptText
        }
        else {
          // console.log("text buffer: " + transcriptTextBuffer);
          // console.log("current text: " + currentTranscriptText);
          // console.log("person buffer: " + personNameBuffer);
          // console.log("current speaker: " + currentPersonName);

          // THIS IS WHEN A NEW PERSON STARTS SPEAKING
          if (personNameBuffer != currentPersonName) {
            pushToTranscript();
            overWriteChromeStorage();

            if (personNameBuffer != "" && currentPersonName == "You" && !/[.!?]$/.test(transcriptTextBuffer.trim())) { // regex to check if last sentence was unfinished
              showInterruption();
            }

            beforeTranscriptText = currentTranscriptText
            personNameBuffer = currentPersonName;
            transcriptTextBuffer = currentTranscriptText;
          }
          else { // SAME PERSON SPEAKING
            transcriptTextBuffer += currentTranscriptText.substring(currentTranscriptText.indexOf(beforeTranscriptText) + beforeTranscriptText.length)
            beforeTranscriptText = currentTranscriptText
          }
        }
      }
      else {
        console.log("No active transcript")
        if ((personNameBuffer != "") && (transcriptTextBuffer != "")) {
          pushToTranscript()
          overWriteChromeStorage()
        }
        beforePersonName = ""
        beforeTranscriptText = ""
        personNameBuffer = ""
        transcriptTextBuffer = ""
      }
      console.log(transcriptTextBuffer)
      // console.log(transcript)
    })
  }, 500); // was originally 1000
}

function pushToTranscript() {
  transcript.push({
    "personName": personNameBuffer,
    "personTranscript": transcriptTextBuffer
  })
}

function overWriteChromeStorage() {
  chrome.storage.local.set({
    numInterruptions: numInterruptions,
    transcript: transcript,
    meetingTitle: meetingTitle,
    meetingStartTimeStamp: meetingStartTimeStamp
  }, function () { })
}

function updateMeetingTitle() {
  if (document.querySelector(".u6vdEc")) {
    const title = document.querySelector(".u6vdEc").textContent
    const invalidFilenameRegex = /[^\w\-_.() ]/g;
    return title.replace(invalidFilenameRegex, '_')
  }
  else
    return document.title
}

async function checkExtensionStatus() {
  // Set default value as 200
  chrome.storage.local.set({
    extensionStatusJSON: { status: 200, message: "<strong>TranscripTonic is running</strong> <br /> Do not turn off captions" },
  });

  // https://stackoverflow.com/a/42518434
  await fetch(
    "https://ejnana.github.io/transcripto-status/status-prod.json",
    { cache: "no-store" }
  )
    .then((response) => response.json())
    .then((result) => {
      // Write status to chrome local storage
      chrome.storage.local.set({ extensionStatusJSON: result }, function () {
        console.log("Extension status fetched and saved")
      });
    })
    .catch((err) => {
      console.log(err);
    });
}
